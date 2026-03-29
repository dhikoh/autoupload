"""
AutoPost Hub — FastAPI Dependencies
Reusable dependency functions for database session, auth, and role guards.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.auth import decode_access_token
from app.models import User

security = HTTPBearer()


def get_db():
    """Yield a database session. Auto-closes after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate JWT, return the User object. Reject suspended users."""
    token_data = decode_access_token(creds.credentials)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid atau expired",
        )
    user = db.query(User).filter(User.id == token_data["sub"]).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User tidak ditemukan",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda telah disuspend. Hubungi admin.",
        )
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Only superadmin can access."""
    if user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya superadmin yang bisa mengakses",
        )
    return user


def require_staff_or_admin(user: User = Depends(get_current_user)) -> User:
    """Staff or superadmin can access."""
    if user.role not in ("superadmin", "staff"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak, butuh role staff atau superadmin",
        )
    return user
