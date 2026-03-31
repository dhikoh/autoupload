"""
AutoPost Hub — Top-Up & Balance Router (Tenant)
POST /api/topup         — request top-up with proof file
GET  /api/topup         — list own top-up history
GET  /api/balance       — check balance + transaction history
GET  /api/settings/public — get public settings (price, bank, CS)
"""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session

from app.config import settings
from app.deps import get_db, get_current_user
from app.models import User, TopUpRequest, BalanceTransaction, AppSetting
from app.schemas import (
    TopUpResponse, TopUpListResponse,
    BalanceResponse,
    PublicSettingsResponse,
)
from app.middleware.rate_limit import limiter

router = APIRouter(tags=["TopUp & Balance"])

PROOF_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}


@router.post("/api/topup", response_model=TopUpResponse, status_code=201)
@limiter.limit("5 per 10 minutes")
async def create_topup(
    request: Request,
    amount: float = Form(...),
    proof: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Request top-up with proof of transfer."""
    if amount <= 0:
        raise HTTPException(400, "Jumlah top-up harus lebih dari 0")

    # Validate proof file type
    if proof.content_type not in PROOF_ALLOWED_TYPES:
        raise HTTPException(400, "Bukti transfer harus JPG, PNG, WebP, atau PDF")

    # Save proof file
    content = await proof.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > 10:
        raise HTTPException(413, "File bukti terlalu besar (maks 10MB)")

    proof_dir = Path(settings.UPLOAD_DIR) / "proofs"
    proof_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(proof.filename).suffix if proof.filename else ".jpg"
    safe_name = f"{uuid.uuid4().hex}{ext}"
    proof_path = proof_dir / safe_name

    with open(proof_path, "wb") as f:
        f.write(content)

    topup = TopUpRequest(
        user_id=user.id,
        amount=amount,
        proof_file_path=str(proof_path),
        proof_file_name=proof.filename,
    )
    db.add(topup)
    db.commit()
    db.refresh(topup)
    return topup


@router.get("/api/topup", response_model=TopUpListResponse)
def list_my_topups(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List own top-up requests."""
    query = db.query(TopUpRequest).filter(TopUpRequest.user_id == user.id)
    total = query.count()
    topups = query.order_by(TopUpRequest.created_at.desc()).offset(offset).limit(limit).all()
    return TopUpListResponse(topups=topups, total=total)


@router.get("/api/balance", response_model=BalanceResponse)
def get_balance(
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get balance and recent transactions."""
    transactions = (
        db.query(BalanceTransaction)
        .filter(BalanceTransaction.user_id == user.id)
        .order_by(BalanceTransaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return BalanceResponse(balance=user.balance, transactions=transactions)


@router.get("/api/settings/public", response_model=PublicSettingsResponse)
def get_public_settings(db: Session = Depends(get_db)):
    """Public endpoint — no auth needed. Returns upload price, bank info, CS contact."""
    keys = ["upload_price", "bank_name", "bank_account", "bank_holder", "cs_whatsapp", "cs_email"]
    result = {}
    for key in keys:
        s = db.query(AppSetting).filter(AppSetting.key == key).first()
        result[key] = s.value if s else ""
    return PublicSettingsResponse(**result)
