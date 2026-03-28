"""
AutoPost Hub — Auto-Cleanup Logic
Deletes uploaded files from disk after all target platforms succeed.
Prevents ghost files from accumulating.
"""

import os
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Post, PostPlatform

logger = logging.getLogger(__name__)


def check_and_cleanup(post_id: str, db: Session) -> None:
    """
    After each platform upload completes, check if ALL platforms for this post
    are done successfully. If yes → delete the file from disk and nullify file_path.
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
    has_failed = any(p.status == "failed" for p in platform_records)

    if all_success:
        # ✅ All platforms succeeded → DELETE file, mark completed
        _delete_file(post.file_path)
        post.file_path = None
        post.status = "completed"
        post.completed_at = datetime.now(timezone.utc)
        logger.info(f"✅ Post {post_id}: All platforms success, file cleaned up")
    elif has_failed:
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


def _delete_file(file_path: str) -> None:
    """Safely delete a file from disk. No error if already deleted."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"🗑️ Deleted file: {file_path}")
    except OSError as e:
        logger.error(f"❌ Failed to delete {file_path}: {e}")
