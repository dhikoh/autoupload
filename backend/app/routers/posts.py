"""
AutoPost Hub — Posts Router
POST   /api/posts            — create post + queue upload
GET    /api/posts             — list user's posts
GET    /api/posts/{id}        — post detail with platform status
POST   /api/posts/{id}/retry  — retry failed platforms
DELETE /api/posts/{id}        — delete post + cleanup file
GET    /api/posts/stats       — dashboard stats
"""

from threading import Thread
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.deps import get_db, get_current_user
from app.models import User, Post, PostPlatform, ConnectedAccount
from app.schemas import PostCreateRequest, PostResponse, PostListResponse, DashboardStats
from app.workers.tasks import process_post
from app.workers.cleanup import force_cleanup

router = APIRouter(prefix="/api/posts", tags=["Posts"])


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dashboard overview stats."""
    total = db.query(func.count(Post.id)).filter(Post.user_id == user.id).scalar() or 0
    scheduled = db.query(func.count(Post.id)).filter(
        Post.user_id == user.id, Post.scheduled_at.isnot(None), Post.status == "queued"
    ).scalar() or 0

    # Success rate: count successful PostPlatforms / total PostPlatforms
    total_pp = db.query(func.count(PostPlatform.id)).join(Post).filter(Post.user_id == user.id).scalar() or 0
    success_pp = db.query(func.count(PostPlatform.id)).join(Post).filter(
        Post.user_id == user.id, PostPlatform.status == "success"
    ).scalar() or 0
    rate = round((success_pp / total_pp * 100), 1) if total_pp > 0 else 0.0

    accounts = db.query(func.count(ConnectedAccount.id)).filter(
        ConnectedAccount.user_id == user.id
    ).scalar() or 0

    return DashboardStats(
        total_posts=total,
        scheduled=scheduled,
        success_rate=rate,
        connected_accounts=accounts,
    )


@router.post("", response_model=PostResponse, status_code=201)
def create_post(
    req: PostCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new post and queue it for upload to selected platforms."""
    # Validate platforms
    valid_platforms = {"youtube", "facebook", "instagram", "tiktok", "x", "threads"}
    for p in req.platforms:
        if p not in valid_platforms:
            raise HTTPException(400, detail=f"Platform tidak valid: {p}")

    # Create the post
    post = Post(
        user_id=user.id,
        caption=req.caption,
        hashtags=req.hashtags,
        youtube_title=req.youtube_title,
        file_path=req.file_path,
        file_name=req.file_name,
        file_size=req.file_size,
        file_type=req.file_type,
        status="queued",
        scheduled_at=req.schedule_at,
    )
    db.add(post)
    db.flush()  # Get post.id without committing

    # Create PostPlatform records for each selected platform
    for platform in req.platforms:
        # Find connected account for this platform (optional)
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

    # Process in background thread (sync mode, no Celery needed)
    thread = Thread(target=process_post, args=(post.id,), daemon=True)
    thread.start()

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
    """List user's posts with optional filters."""
    query = db.query(Post).filter(Post.user_id == user.id)

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
    """Get post detail with per-platform upload status."""
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == user.id).first()
    if not post:
        raise HTTPException(404, detail="Post tidak ditemukan")
    return post


@router.post("/{post_id}/retry", response_model=PostResponse)
def retry_post(
    post_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retry failed platform uploads for a post."""
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == user.id).first()
    if not post:
        raise HTTPException(404, detail="Post tidak ditemukan")

    if post.status not in ("partial", "failed"):
        raise HTTPException(400, detail="Post tidak bisa di-retry (status bukan partial/failed)")

    if not post.file_path:
        raise HTTPException(400, detail="File sudah dihapus, tidak bisa retry")

    # Reset failed platforms to pending
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

    # Process retry in background
    thread = Thread(target=process_post, args=(post.id,), daemon=True)
    thread.start()

    return post


@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a post and its uploaded file. Cascade deletes PostPlatform records."""
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == user.id).first()
    if not post:
        raise HTTPException(404, detail="Post tidak ditemukan")

    # Force cleanup file from disk
    force_cleanup(post_id, db)

    # Delete post (cascade deletes PostPlatform records)
    db.delete(post)
    db.commit()
