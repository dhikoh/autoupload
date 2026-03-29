"""
AutoPost Hub — Connected Accounts Router
GET    /api/accounts       — list user's connected accounts
POST   /api/accounts       — add connected account
DELETE /api/accounts/{id}   — disconnect account
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.models import User, ConnectedAccount
from app.schemas import AccountCreateRequest, AccountResponse

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])


@router.get("", response_model=list[AccountResponse])
def list_accounts(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == user.id
    ).order_by(ConnectedAccount.connected_at.desc()).all()


@router.post("", response_model=AccountResponse, status_code=201)
def add_account(
    req: AccountCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == user.id,
        ConnectedAccount.platform == req.platform,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Akun {req.platform} sudah terhubung",
        )

    account = ConnectedAccount(
        user_id=user.id,
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


@router.delete("/{account_id}", status_code=204)
def disconnect_account(
    account_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(ConnectedAccount).filter(
        ConnectedAccount.id == account_id,
        ConnectedAccount.user_id == user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Akun tidak ditemukan")

    db.delete(account)
    db.commit()
