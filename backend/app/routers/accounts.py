"""
AutoPost Hub — Connected Accounts Router
GET    /api/accounts          — list user's connected accounts (tenant-isolated)
POST   /api/accounts          — add connected account (tenant-isolated)
PUT    /api/accounts/{id}     — update account token/profile (tenant-isolated)
DELETE /api/accounts/{id}     — disconnect account (tenant-isolated)

TENANT ISOLATION:
  All queries filter by ConnectedAccount.user_id == current_user.id.
  Users cannot read, update, or delete other users' accounts.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.deps import get_db, get_current_user
from app.models import User, ConnectedAccount
from app.schemas import AccountCreateRequest, AccountResponse

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])


class AccountUpdateRequest(BaseModel):
    platform_username: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    profile_name: Optional[str] = None
    profile_url: Optional[str] = None


@router.get("", response_model=list[AccountResponse])
def list_accounts(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List connected accounts — only returns accounts belonging to current user."""
    return db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == user.id   # ← TENANT ISOLATION
    ).order_by(ConnectedAccount.connected_at.desc()).all()


@router.post("", response_model=AccountResponse, status_code=201)
def add_account(
    req: AccountCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Connect a platform account. Each user can have one account per platform."""
    # TENANT ISOLATION: check uniqueness only within current user's accounts
    existing = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == user.id,
        ConnectedAccount.platform == req.platform,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Akun {req.platform} sudah terhubung. Disconnect dulu untuk mengganti.",
        )

    account = ConnectedAccount(
        user_id=user.id,       # ← Always set to current user — cannot spoof
        platform=req.platform,
        platform_username=req.platform_username,
        access_token=req.access_token,
        refresh_token=req.refresh_token,
        profile_name=req.profile_name,
        profile_url=req.profile_url,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: str,
    req: AccountUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update an account's token or profile info (e.g. after OAuth refresh).
    TENANT ISOLATION: Can only update own accounts.
    """
    account = db.query(ConnectedAccount).filter(
        ConnectedAccount.id == account_id,
        ConnectedAccount.user_id == user.id,   # ← ISOLATION
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Akun tidak ditemukan")

    # Only update fields that were provided
    if req.platform_username is not None:
        account.platform_username = req.platform_username
    if req.access_token is not None:
        account.access_token = req.access_token
    if req.refresh_token is not None:
        account.refresh_token = req.refresh_token
    if req.profile_name is not None:
        account.profile_name = req.profile_name
    if req.profile_url is not None:
        account.profile_url = req.profile_url

    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=204)
def disconnect_account(
    account_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Disconnect a platform account.
    TENANT ISOLATION: Can only delete own accounts.
    """
    account = db.query(ConnectedAccount).filter(
        ConnectedAccount.id == account_id,
        ConnectedAccount.user_id == user.id,   # ← ISOLATION
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Akun tidak ditemukan")

    db.delete(account)
    db.commit()
