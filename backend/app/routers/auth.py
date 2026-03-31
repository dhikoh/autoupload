"""
AutoPost Hub — Auth Router
POST /api/auth/register           — register tenant (3/minute per IP)
POST /api/auth/login              — login (5/minute per IP + lockout after 10 failures)
GET  /api/auth/me                 — get own profile
PUT  /api/auth/profile            — update own name
PUT  /api/auth/password           — change own password (requires current password)
GET  /api/auth/verify-email       — verify email via token (?token=xxx)
POST /api/auth/resend-verification — resend verification email
"""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional

from app.deps import get_db, get_current_user
from app.models import User
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.auth import hash_password, verify_password, create_access_token
from app.config import settings
from app.middleware.rate_limit import (
    limiter,
    check_login_lockout,
    record_failed_login,
    clear_failed_logins,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class ProfileUpdateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class ResendVerificationRequest(BaseModel):
    email: str


# ── Register ───────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("3/minute")
def register(request: Request, req: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register new tenant account.
    If EMAIL_VERIFICATION_REQUIRED=True, sends verification email before allowing login.
    Rate limited: 3/minute per IP.
    """
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email sudah terdaftar")

    # Generate verification token if required
    verification_token = None
    is_verified = True
    if settings.EMAIL_VERIFICATION_REQUIRED:
        verification_token = secrets.token_urlsafe(32)
        is_verified = False

    user = User(
        email=req.email.lower().strip(),
        name=req.name.strip(),
        password_hash=hash_password(req.password),
        role="tenant",
        balance=0.0,
        is_email_verified=is_verified,
        email_verification_token=verification_token,
        email_verification_expires=(
            datetime.now(timezone.utc) + timedelta(hours=24)
            if verification_token else None
        ),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Send verification email if required
    if verification_token:
        from app.services.email import send_verification_email
        sent = send_verification_email(user.email, user.name, verification_token)
        if not sent:
            import logging
            logging.getLogger(__name__).warning(
                f"[Auth] Failed to send verification email to {user.email}"
            )

    token = create_access_token(user.id, user.role)
    response = TokenResponse(access_token=token, role=user.role)

    # Attach verification flag for frontend to show the right UI
    if settings.EMAIL_VERIFICATION_REQUIRED:
        # We still return token but frontend should show "check your email" state
        response.email_verification_required = True
    return response


# ── Login ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, req: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email and password.
    Rate limited: 5/minute per IP.
    Lockout: 10 failures in 15 minutes → locked 15 minutes.
    Failed logins are logged and may trigger IP auto-block.
    """
    email = req.email.lower().strip()
    client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() \
                or (request.client.host if request.client else "unknown")

    # Check lockout BEFORE password verify
    try:
        check_login_lockout(email)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(req.password, user.password_hash):
        record_failed_login(email, ip_address=client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda telah disuspend. Hubungi admin.",
        )

    if settings.EMAIL_VERIFICATION_REQUIRED and not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email belum diverifikasi. Cek inbox Anda atau minta kirim ulang.",
            headers={"X-Verification-Required": "true"},
        )

    clear_failed_logins(email)
    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, role=user.role)


# ── Email Verification ─────────────────────────────────────────────────────────

@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Verify email address using the token from the verification email link.
    GET /api/auth/verify-email?token=xxx
    """
    if not token:
        raise HTTPException(400, "Token tidak valid")

    user = db.query(User).filter(
        User.email_verification_token == token,
    ).first()

    if not user:
        raise HTTPException(400, "Token tidak valid atau sudah digunakan")

    if user.is_email_verified:
        return {"message": "Email sudah diverifikasi sebelumnya", "already_verified": True}

    now = datetime.now(timezone.utc)
    expires = user.email_verification_expires
    if expires:
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if now > expires:
            raise HTTPException(400, "Link verifikasi sudah kadaluarsa. Minta kirim ulang.")

    user.is_email_verified = True
    user.email_verification_token = None
    user.email_verification_expires = None
    db.commit()

    return {"message": "Email berhasil diverifikasi! Sekarang Anda bisa login.", "verified": True}


@router.post("/resend-verification")
@limiter.limit("3/minute")
def resend_verification(
    request: Request,
    req: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    """
    Resend email verification link. Rate limited 3/minute per IP.
    Always returns 200 (doesn't reveal if email exists — prevents enumeration).
    """
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()

    if user and not user.is_email_verified:
        new_token = secrets.token_urlsafe(32)
        user.email_verification_token = new_token
        user.email_verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
        db.commit()

        from app.services.email import send_verification_email
        send_verification_email(user.email, user.name, new_token)

    return {"message": "Jika email terdaftar dan belum diverifikasi, link baru telah dikirim."}


# ── Profile & Password ─────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    """Get current user profile."""
    return user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    req: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user.name = req.name.strip()
    db.commit()
    db.refresh(user)
    return user


@router.put("/password", response_model=dict)
def change_password(
    req: PasswordChangeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(400, "Password saat ini tidak benar")
    if req.current_password == req.new_password:
        raise HTTPException(400, "Password baru tidak boleh sama dengan password lama")
    user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "Password berhasil diubah"}
