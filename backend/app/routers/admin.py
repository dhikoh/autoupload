"""
AutoPost Hub — Admin Router
All endpoints guarded by require_admin or require_staff_or_admin.

Superadmin: full access (settings, staff management, suspend, manual balance)
Staff: view users, review topups, view stats, view ranking

PROOF FILES:
  GET /api/admin/proofs/{filename} — serve proof files (authenticated, staff+admin only)
  StaticFiles mount for /proofs is REMOVED. Files only accessible via this authenticated endpoint.
"""

import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import settings as app_settings
from app.deps import get_db, require_admin, require_staff_or_admin
from app.models import (
    User, Post, PostPlatform, ConnectedAccount,
    TopUpRequest, BalanceTransaction, AppSetting,
)
from app.schemas import (
    AdminStatsResponse, AdminUserResponse, AdminUserListResponse,
    AdminBalanceAddRequest, AdminTopUpReviewRequest,
    AdminSettingsResponse, AdminSettingsUpdateRequest,
    AdminStaffCreateRequest, UserResponse,
    TopUpResponse, TopUpListResponse,
    RankingEntry, RankingResponse,
)
from app.auth import hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])

SETTING_KEYS = ["upload_price", "bank_name", "bank_account", "bank_holder", "cs_whatsapp", "cs_email"]


# ── Stats ──────────────────────────────────────────────

@router.get("/stats", response_model=AdminStatsResponse)
def admin_stats(
    user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(User.id)).filter(User.role == "tenant").scalar() or 0
    total_posts = db.query(func.count(Post.id)).scalar() or 0
    total_revenue = db.query(func.coalesce(func.sum(Post.cost), 0.0)).scalar() or 0.0
    pending_topups = db.query(func.count(TopUpRequest.id)).filter(
        TopUpRequest.status == "pending"
    ).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(
        User.role == "tenant", User.is_active == True
    ).scalar() or 0
    suspended_users = db.query(func.count(User.id)).filter(
        User.role == "tenant", User.is_active == False
    ).scalar() or 0

    return AdminStatsResponse(
        total_users=total_users,
        total_posts=total_posts,
        total_revenue=total_revenue,
        pending_topups=pending_topups,
        active_users=active_users,
        suspended_users=suspended_users,
    )


# ── Users ──────────────────────────────────────────────

@router.get("/users", response_model=AdminUserListResponse)
def list_users(
    role: str = Query(None),
    search: str = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    result = []
    for u in users:
        post_count = db.query(func.count(Post.id)).filter(Post.user_id == u.id).scalar() or 0
        result.append(AdminUserResponse(
            id=u.id, email=u.email, name=u.name, role=u.role,
            balance=u.balance, is_active=u.is_active,
            total_posts=post_count, created_at=u.created_at,
        ))

    return AdminUserListResponse(users=result, total=total)


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_detail(
    user_id: str,
    admin: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User tidak ditemukan")
    return target


# ── Manual Balance Add (superadmin only) ───────────────

@router.post("/users/{user_id}/balance", response_model=UserResponse)
def add_balance_manual(
    user_id: str,
    req: AdminBalanceAddRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User tidak ditemukan")

    target.balance += req.amount
    tx = BalanceTransaction(
        user_id=target.id,
        amount=req.amount,
        type="manual_add",
        balance_after=target.balance,
        description=req.description or f"Manual top-up by admin",
    )
    db.add(tx)
    db.commit()
    db.refresh(target)
    return target


# ── Suspend/Unsuspend (superadmin only) ────────────────

@router.post("/users/{user_id}/suspend", response_model=UserResponse)
def toggle_suspend(
    user_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User tidak ditemukan")

    # Cannot suspend superadmin accounts
    if target.role == "superadmin":
        raise HTTPException(400, "Tidak bisa suspend superadmin")

    # C-SELF-SUSPEND FIX: Prevent admin from suspending their own account
    if target.id == admin.id:
        raise HTTPException(400, "Tidak bisa suspend akun sendiri")

    target.is_active = not target.is_active
    db.commit()
    db.refresh(target)
    return target


# ── Staff Management (superadmin only) ─────────────────

@router.post("/staff", response_model=UserResponse, status_code=201)
def create_staff(
    req: AdminStaffCreateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(409, "Email sudah terdaftar")

    staff = User(
        email=req.email.lower().strip(),
        name=req.name.strip(),
        password_hash=hash_password(req.password),
        role="staff",
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


@router.delete("/staff/{user_id}", status_code=204)
def delete_staff(
    user_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # Cannot delete self
    if user_id == admin.id:
        raise HTTPException(400, "Tidak bisa menghapus akun sendiri")

    target = db.query(User).filter(User.id == user_id, User.role == "staff").first()
    if not target:
        raise HTTPException(404, "Staff tidak ditemukan")
    db.delete(target)
    db.commit()


# ── Top-Up Review (staff + admin) ──────────────────────

@router.get("/topups", response_model=TopUpListResponse)
def list_topups(
    status_filter: str = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    admin: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db),
):
    query = db.query(TopUpRequest)
    if status_filter:
        query = query.filter(TopUpRequest.status == status_filter)

    total = query.count()
    topups = query.order_by(
        TopUpRequest.status.asc(),   # pending first
        TopUpRequest.created_at.desc(),
    ).offset(offset).limit(limit).all()

    # Enrich with user info for display
    result = []
    for t in topups:
        user_obj = db.query(User).filter(User.id == t.user_id).first()
        item = TopUpResponse(
            id=t.id,
            user_id=t.user_id,
            user_name=user_obj.name if user_obj else "Unknown",
            user_email=user_obj.email if user_obj else "",
            amount=t.amount,
            proof_file_name=t.proof_file_name,
            status=t.status,
            admin_note=t.admin_note,
            created_at=t.created_at,
            reviewed_at=t.reviewed_at,
        )
        result.append(item)

    return TopUpListResponse(topups=result, total=total)


@router.post("/topups/{topup_id}/review", response_model=TopUpResponse)
def review_topup(
    topup_id: str,
    req: AdminTopUpReviewRequest,
    admin: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db),
):
    topup = db.query(TopUpRequest).filter(TopUpRequest.id == topup_id).first()
    if not topup:
        raise HTTPException(404, "Top-up request tidak ditemukan")
    if topup.status != "pending":
        raise HTTPException(400, "Top-up sudah direview sebelumnya")

    topup.reviewed_by = admin.id
    topup.reviewed_at = datetime.now(timezone.utc)
    topup.admin_note = req.note

    if req.action == "approve":
        topup.status = "approved"
        # Credit balance to user
        target = db.query(User).filter(User.id == topup.user_id).first()
        if target:
            target.balance += topup.amount
            tx = BalanceTransaction(
                user_id=target.id,
                amount=topup.amount,
                type="topup",
                reference_id=topup.id,
                balance_after=target.balance,
                description=f"Top-up Rp {topup.amount:,.0f} disetujui",
            )
            db.add(tx)
    else:
        topup.status = "rejected"
        # Clean up proof file on rejection to prevent ghost files
        if topup.proof_file_path:
            try:
                if os.path.exists(topup.proof_file_path):
                    os.remove(topup.proof_file_path)
            except OSError:
                pass  # Non-critical — log if needed

    db.commit()
    db.refresh(topup)

    user_obj = db.query(User).filter(User.id == topup.user_id).first()
    return TopUpResponse(
        id=topup.id,
        user_id=topup.user_id,
        user_name=user_obj.name if user_obj else "Unknown",
        user_email=user_obj.email if user_obj else "",
        amount=topup.amount,
        proof_file_name=topup.proof_file_name,
        status=topup.status,
        admin_note=topup.admin_note,
        created_at=topup.created_at,
        reviewed_at=topup.reviewed_at,
    )


# ── Proof File Serving (authenticated staff+admin only) ─
# C-5 FIX: Replaces StaticFiles(/proofs) — files no longer publicly accessible

@router.get("/proofs/{filename}")
def serve_proof_file(
    filename: str,
    admin: User = Depends(require_staff_or_admin),
):
    """
    Serve a proof-of-transfer file.
    SECURITY: Only accessible to authenticated staff/admin users.
    Prevents path traversal via basename sanitization.
    """
    # Sanitize: no directory traversal
    safe_filename = Path(filename).name
    if not safe_filename or safe_filename != filename:
        raise HTTPException(400, "Nama file tidak valid")

    file_path = app_settings.proofs_path / safe_filename
    if not file_path.exists():
        raise HTTPException(404, "File tidak ditemukan")

    return FileResponse(str(file_path))


# ── App Settings (superadmin only) ─────────────────────

@router.get("/settings", response_model=AdminSettingsResponse)
def get_settings(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return _build_settings(db)


@router.put("/settings", response_model=AdminSettingsResponse)
def update_settings(
    req: AdminSettingsUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    updates = req.model_dump(exclude_none=True)
    for key, value in updates.items():
        setting = db.query(AppSetting).filter(AppSetting.key == key).first()
        if setting:
            setting.value = str(value)
            setting.updated_at = datetime.now(timezone.utc)
        else:
            db.add(AppSetting(key=key, value=str(value)))
    db.commit()
    return _build_settings(db)


def _build_settings(db: Session) -> AdminSettingsResponse:
    settings_dict = {}
    for key in SETTING_KEYS:
        s = db.query(AppSetting).filter(AppSetting.key == key).first()
        settings_dict[key] = s.value if s else ""
    return AdminSettingsResponse(**settings_dict)


# ── Ranking (staff + admin) ────────────────────────────

@router.get("/ranking", response_model=RankingResponse)
def get_ranking(
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db),
):
    """Ranking user by upload count + platform channel."""
    results = (
        db.query(
            Post.user_id,
            PostPlatform.platform,
            func.count(PostPlatform.id).label("total_uploads"),
        )
        .join(Post, Post.id == PostPlatform.post_id)
        .group_by(Post.user_id, PostPlatform.platform)
        .order_by(func.count(PostPlatform.id).desc())
        .limit(limit)
        .all()
    )

    rankings = []
    for r in results:
        user_obj = db.query(User).filter(User.id == r.user_id).first()
        if not user_obj:
            continue

        account = db.query(ConnectedAccount).filter(
            ConnectedAccount.user_id == r.user_id,
            ConnectedAccount.platform == r.platform,
        ).first()

        success = db.query(func.count(PostPlatform.id)).join(Post).filter(
            Post.user_id == r.user_id,
            PostPlatform.platform == r.platform,
            PostPlatform.status == "success",
        ).scalar() or 0

        total = r.total_uploads or 0
        rankings.append(RankingEntry(
            user_id=r.user_id,
            user_name=user_obj.name,
            user_email=user_obj.email,
            platform=r.platform,
            platform_username=account.platform_username if account else None,
            total_uploads=total,
            success_count=success,
            success_rate=round((success / total * 100), 1) if total > 0 else 0.0,
        ))

    return RankingResponse(rankings=rankings)
