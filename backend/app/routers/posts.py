"""
AutoPost Hub — Posts Router
POST   /api/posts            — create post + queue upload (deducts balance)
GET    /api/posts             — list user's posts (tenant-isolated)
GET    /api/posts/{id}        — post detail with platform status (tenant-isolated)
POST   /api/posts/{id}/retry  — retry failed/partial platforms (tenant-isolated)
DELETE /api/posts/{id}        — delete post + cleanup file (tenant-isolated)
GET    /api/posts/stats       — dashboard stats (tenant-isolated)

TENANT ISOLATION:
  All queries filter by Post.user_id == current_user.id.
  Users can ONLY see, edit, or delete their own posts.
"""

import os
from datetime import datetime, timezone
from pathlib import Path
from threading import Thread
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.deps import get_db, get_current_user
from app.config import settings as app_settings
from app.models import User, Post, PostPlatform, ConnectedAccount, AppSetting, BalanceTransaction
from app.schemas import PostCreateRequest, PostResponse, PostListResponse, DashboardStats
from app.workers.tasks import process_post
from app.workers.cleanup import force_cleanup
from app.middleware.rate_limit import limiter

router = APIRouter(prefix="/api/posts", tags=["Posts"])


def _get_upload_price(db: Session) -> float:
    """Get current upload price from settings."""
    s = db.query(AppSetting).filter(AppSetting.key == "upload_price").first()
    return float(s.value) if s else 1000.0


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dashboard overview stats — scoped to current user (tenant isolation)."""
    total = db.query(func.count(Post.id)).filter(Post.user_id == user.id).scalar() or 0
    scheduled = db.query(func.count(Post.id)).filter(
        Post.user_id == user.id, Post.scheduled_at.isnot(None), Post.status == "queued"
    ).scalar() or 0

    # Success rate — only for current user's posts
    total_pp = (
        db.query(func.count(PostPlatform.id))
        .join(Post)
        .filter(Post.user_id == user.id)
        .scalar() or 0
    )
    success_pp = (
        db.query(func.count(PostPlatform.id))
        .join(Post)
        .filter(Post.user_id == user.id, PostPlatform.status == "success")
        .scalar() or 0
    )
    rate = round((success_pp / total_pp * 100), 1) if total_pp > 0 else 0.0

    accounts = (
        db.query(func.count(ConnectedAccount.id))
        .filter(ConnectedAccount.user_id == user.id)
        .scalar() or 0
    )

    price = _get_upload_price(db)

    return DashboardStats(
        total_posts=total,
        scheduled=scheduled,
        success_rate=rate,
        connected_accounts=accounts,
        balance=user.balance,
        upload_price=price,
    )


@router.post("", response_model=PostResponse, status_code=201)
@limiter.limit("30 per 10 minutes")
def create_post(
    request: Request,
    req: PostCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new post and queue it for upload. Deducts balance from tenant."""
    # --- Guard: suspended users cannot post ---
    if not user.is_active:
        raise HTTPException(403, detail="Akun Anda disuspend. Hubungi admin.")

    # --- Validate platforms ---
    valid_platforms = {"youtube", "facebook", "instagram", "tiktok", "x", "threads"}
    for p in req.platforms:
        if p not in valid_platforms:
            raise HTTPException(400, detail=f"Platform tidak valid: {p}")

    # --- Resolve file path from token (file_token = filename only, NOT full path) ---
    # This prevents path traversal: we construct the path ourselves from UPLOAD_DIR
    resolved_file_path = None
    if req.file_token:
        # Sanitize: strip any directory components from the token
        safe_name = Path(req.file_token).name
        if not safe_name or safe_name != req.file_token:
            raise HTTPException(400, detail="File token tidak valid")
        candidate = app_settings.upload_path / safe_name
        if not candidate.is_file():
            raise HTTPException(400, detail="File tidak ditemukan di server")
        resolved_file_path = str(candidate)
    elif req.file_path:
        # Legacy: accept file_path for backwards compatibility but validate strictly
        real_path = os.path.realpath(req.file_path)
        upload_dir = os.path.realpath(str(app_settings.upload_path))
        if not real_path.startswith(upload_dir + os.sep) and real_path != upload_dir:
            raise HTTPException(400, detail="File path tidak valid")
        if not os.path.isfile(real_path):
            raise HTTPException(400, detail="File tidak ditemukan di server")
        resolved_file_path = real_path

    # --- Check balance with row-level lock to prevent race condition ---
    price = _get_upload_price(db)
    if user.role == "tenant":
        # SELECT FOR UPDATE prevents concurrent requests from double-spending
        locked_user = (
            db.query(User)
            .filter(User.id == user.id)
            .with_for_update()
            .first()
        )
        if locked_user.balance < price:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=(
                    f"Saldo tidak cukup. Butuh Rp {price:,.0f}, "
                    f"saldo Anda Rp {locked_user.balance:,.0f}. Silakan top-up."
                ),
            )

    # --- Deduct balance (admin/staff exempt) ---
    cost = 0.0
    if user.role == "tenant":
        cost = price
        locked_user.balance -= cost
        tx = BalanceTransaction(
            user_id=user.id,
            amount=-cost,
            type="deduct",
            balance_after=locked_user.balance,
            description=f"Upload ke {', '.join(req.platforms)}",
        )
        db.add(tx)

    # --- Create the post record ---
    post = Post(
        user_id=user.id,
        caption=req.caption,
        hashtags=req.hashtags,
        youtube_title=req.youtube_title,
        file_path=resolved_file_path,   # Server-resolved path, never from client
        file_name=req.file_name,
        file_size=req.file_size,
        file_type=req.file_type,
        cost=cost,
        status="queued",
        scheduled_at=req.schedule_at,
    )
    db.add(post)
    db.flush()  # Get post.id before commit

    # Set reference_id on balance transaction
    if user.role == "tenant":
        tx.reference_id = post.id

    # --- Create per-platform records ---
    for platform in req.platforms:
        # TENANT ISOLATION: only look up accounts belonging to this user
        account = db.query(ConnectedAccount).filter(
            ConnectedAccount.user_id == user.id,
            ConnectedAccount.platform == platform,
        ).first()

        pp = PostPlatform(
            post_id=post.id,
            platform=platform,
            account_id=account.id if account else None,
            status="pending",
        )
        db.add(pp)

    db.commit()
    db.refresh(post)

    # --- Queue processing ---
    # For scheduled posts: only start thread if scheduled_at is in the past or not set
    should_process_now = (
        post.scheduled_at is None
        or post.scheduled_at <= datetime.now(timezone.utc)
    )
    if should_process_now:
        thread = Thread(target=process_post, args=(post.id,), daemon=True)
        thread.start()
    # If scheduled for the future, the post stays "queued" until the scheduler picks it up

    return post


@router.get("", response_model=PostListResponse)
def list_posts(
    status_filter: Optional[str] = Query(None, alias="status"),
    platform: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List user's posts with optional filters.
    TENANT ISOLATION: Only returns posts belonging to the authenticated user.
    """
    query = db.query(Post).filter(Post.user_id == user.id)  # ← ISOLATION

    if status_filter:
        query = query.filter(Post.status == status_filter)
    if platform:
        query = query.join(PostPlatform).filter(PostPlatform.platform == platform)

    total = query.count()
    posts = query.order_by(Post.created_at.desc()).offset(offset).limit(limit).all()

    return PostListResponse(posts=posts, total=total)


@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get post detail with per-platform upload status.
    TENANT ISOLATION: Returns 404 if post_id doesn't belong to current user.
    """
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.user_id == user.id,  # ← ISOLATION: cannot access other users' posts
    ).first()
    if not post:
        raise HTTPException(404, detail="Post tidak ditemukan")
    return post


@router.post("/{post_id}/retry", response_model=PostResponse)
def retry_post(
    post_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retry failed/partial platform uploads for a post (no additional charge).
    TENANT ISOLATION: Only allows retry on own posts.
    """
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.user_id == user.id,  # ← ISOLATION
    ).first()
    if not post:
        raise HTTPException(404, detail="Post tidak ditemukan")

    if post.status not in ("partial", "failed"):
        raise HTTPException(400, detail="Post tidak bisa di-retry (status bukan partial/failed)")

    if not post.file_path:
        raise HTTPException(400, detail="File sudah dihapus, tidak bisa retry")

    failed_platforms = db.query(PostPlatform).filter(
        PostPlatform.post_id == post_id,
        PostPlatform.status == "failed",
    ).all()

    if not failed_platforms:
        raise HTTPException(400, detail="Tidak ada platform yang gagal")

    for pp in failed_platforms:
        pp.status = "pending"
        pp.error_message = None

    post.status = "queued"
    db.commit()
    db.refresh(post)

    thread = Thread(target=process_post, args=(post.id,), daemon=True)
    thread.start()

    return post


@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a post and its uploaded file. Cascade deletes PostPlatform records.
    TENANT ISOLATION: Users can only delete their own posts.
    """
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.user_id == user.id,  # ← ISOLATION
    ).first()
    if not post:
        raise HTTPException(404, detail="Post tidak ditemukan")

    force_cleanup(post_id, db)
    db.delete(post)
    db.commit()
