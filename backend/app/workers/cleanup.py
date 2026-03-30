"""
AutoPost Hub — Auto-Cleanup Logic
1. check_and_cleanup()  — called after each platform upload; deletes file when all done
2. force_cleanup()      — called on post deletion
3. cleanup_orphan_files() — periodic job: removes files with no matching Post record
                            (handles ghost files from uploads where post creation failed)

GHOST FILE PREVENTION:
  Files can be orphaned when:
  a) User uploads file but tab closes before post is created
  b) Post creation fails after file upload (e.g. API error)
  c) File from a "partial" post kept for retry but user never retries

  Run cleanup_orphan_files() periodically (e.g. via APScheduler or cron every hour).
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path

from sqlalchemy.orm import Session

from app.models import Post, PostPlatform

logger = logging.getLogger(__name__)


def check_and_cleanup(post_id: str, db: Session) -> None:
    """
    After each platform upload completes, check if ALL platforms for this post
    are done. If all success → delete the file and mark post completed.
    If some failed → keep file for retry, mark partial.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post or not post.file_path:
        return

    platform_records = db.query(PostPlatform).filter(PostPlatform.post_id == post_id).all()

    if not platform_records:
        return

    all_done = all(p.status in ("success", "failed") for p in platform_records)
    if not all_done:
        return  # Still processing, wait

    all_success = all(p.status == "success" for p in platform_records)

    if all_success:
        # ✅ All platforms succeeded → DELETE file, mark completed
        _delete_file(post.file_path)
        post.file_path = None
        post.status = "completed"
        post.completed_at = datetime.now(timezone.utc)
        logger.info(f"✅ Post {post_id}: All platforms success, file cleaned up")
    else:
        # ⚠️ Some failed → keep file for retry, mark partial
        post.status = "partial"
        logger.warning(f"⚠️ Post {post_id}: Some platforms failed, file kept for retry")

    db.commit()


def force_cleanup(post_id: str, db: Session) -> None:
    """Force delete file for a post regardless of platform status (for delete endpoint)."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if post and post.file_path:
        _delete_file(post.file_path)
        post.file_path = None
        db.commit()


def cleanup_orphan_files(upload_dir: str, db: Session, max_age_hours: int = 2) -> int:
    """
    Scan the uploads directory for files that have NO matching Post record.
    Deletes files older than max_age_hours (default: 2 hours).

    This handles ghost files from:
    - Uploads where post creation failed
    - User closed browser mid-upload
    - Any other scenario where upload succeeded but post was not created

    Returns: number of files deleted.

    SAFETY: Only scans the root uploads dir, not the 'proofs' subdirectory.
    The 'proofs' directory is managed separately by the topup review process.
    """
    upload_path = Path(upload_dir).resolve()  # Normalize to absolute path
    if not upload_path.exists():
        return 0

    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    deleted = 0

    for file_path in upload_path.iterdir():
        # Skip directories (e.g. 'proofs' subdirectory)
        if not file_path.is_file():
            continue

        # Check file age — only delete files older than cutoff
        try:
            mtime = datetime.fromtimestamp(file_path.stat().st_mtime, tz=timezone.utc)
            if mtime > cutoff:
                continue  # Too recent, skip (might still be processing)
        except OSError:
            continue

        # Check if any Post record references this file.
        # We check by filename (safe_name) since DB stores the full resolved path.
        # Using LIKE match to handle both absolute and relative path formats.
        filename = file_path.name
        posts_with_file = db.query(Post).filter(
            Post.file_path.like(f"%{filename}")
        ).first()

        if not posts_with_file:
            # No post references this file → orphaned, safe to delete
            logger.info(f"🗑️ Orphan file cleanup: {filename}")
            try:
                file_path.unlink()
                deleted += 1
            except OSError as e:
                logger.error(f"Failed to delete orphan file {file_path}: {e}")

    if deleted > 0:
        logger.info(f"✅ Orphan cleanup: removed {deleted} ghost file(s)")

    return deleted


def cleanup_stale_partial_posts(db: Session, max_age_days: int = 7) -> int:
    """
    Clean up files from 'partial' posts that haven't been retried in max_age_days.
    After this many days, the file is deleted and post is marked 'failed'.

    This prevents ghost files from posts that the user never retried.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
    deleted = 0

    stale_posts = db.query(Post).filter(
        Post.status == "partial",
        Post.file_path.isnot(None),
        Post.created_at < cutoff,
    ).all()

    for post in stale_posts:
        if post.file_path:
            _delete_file(post.file_path)
            post.file_path = None
        post.status = "failed"
        deleted += 1
        logger.info(f"🗑️ Stale partial post {post.id}: file deleted after {max_age_days} days")

    if deleted > 0:
        db.commit()
        logger.info(f"✅ Stale partial cleanup: processed {deleted} post(s)")

    return deleted


def _delete_file(file_path: str) -> None:
    """Safely delete a file from disk. No error if already deleted."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"🗑️ Deleted file: {file_path}")
    except OSError as e:
        logger.error(f"❌ Failed to delete {file_path}: {e}")
