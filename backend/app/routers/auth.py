"""
AutoPost Hub — Auth Router
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
PUT  /api/auth/profile    — update own name
PUT  /api/auth/password   — change own password (requires current password)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional

from app.deps import get_db, get_current_user
from app.models import User
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class ProfileUpdateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email sudah terdaftar",
        )

    user = User(
        email=req.email.lower().strip(),
        name=req.name.strip(),
        password_hash=hash_password(req.password),
        role="tenant",
        balance=0.0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, role=user.role)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda telah disuspend. Hubungi admin.",
        )

    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, role=user.role)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    """Get current user's profile — always reflects latest data from DB."""
    return user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    req: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update own display name.
    TENANT ISOLATION: Only modifies the authenticated user's own record.
    """
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
    """
    Change own password. Requires current password for verification.
    TENANT ISOLATION: Only modifies the authenticated user's own password.
    """
    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password saat ini tidak benar",
        )

    if req.current_password == req.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password baru tidak boleh sama dengan password lama",
        )

    user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "Password berhasil diubah"}
