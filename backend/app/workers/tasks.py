"""
AutoPost Hub — Upload Task Processor
Processes post uploads synchronously (or via Celery in production).
Uploads to each target platform, updates status, then triggers cleanup.
"""

import logging
from datetime import datetime, timezone
from importlib import import_module

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Post, PostPlatform, ConnectedAccount
from app.workers.cleanup import check_and_cleanup

logger = logging.getLogger(__name__)

# Platform module mapping
PLATFORM_MODULES = {
    "youtube": "app.workers.platforms.youtube",
    "facebook": "app.workers.platforms.facebook",
    "instagram": "app.workers.platforms.instagram",
    "tiktok": "app.workers.platforms.tiktok",
    "x": "app.workers.platforms.x_twitter",
    "threads": "app.workers.platforms.threads",
}


def process_post(post_id: str) -> None:
    """
    Process a post: upload to each target platform, update status, cleanup.
    This runs synchronously in dev mode. In production, called as Celery task.
    """
    db: Session = SessionLocal()
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            logger.error(f"Post {post_id} not found")
            return

        post.status = "processing"
        db.commit()

        # Get all target platforms for this post
        platform_records = (
            db.query(PostPlatform)
            .filter(PostPlatform.post_id == post_id, PostPlatform.status.in_(["pending", "failed"]))
            .all()
        )

        for pp in platform_records:
            _upload_to_platform(pp, post, db)

        # After all uploads, check if we can cleanup the file
        check_and_cleanup(post_id, db)

    except Exception as e:
        logger.error(f"Process post {post_id} error: {e}")
        # Mark post as failed if unexpected error
        try:
            post = db.query(Post).filter(Post.id == post_id).first()
            if post and post.status == "processing":
                post.status = "failed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


def _upload_to_platform(pp: PostPlatform, post: Post, db: Session) -> None:
    """Upload content to a single platform and update the PostPlatform record."""
    platform = pp.platform

    try:
        # Update status to uploading
        pp.status = "uploading"
        db.commit()

        # Get the platform worker module
        module_path = PLATFORM_MODULES.get(platform)
        if not module_path:
            pp.status = "failed"
            pp.error_message = f"Platform '{platform}' tidak didukung"
            db.commit()
            return

        worker = import_module(module_path)

        # Get connected account for this platform (if any)
        account = None
        if pp.account_id:
            account = db.query(ConnectedAccount).filter(ConnectedAccount.id == pp.account_id).first()

        # Build metadata
        metadata = {
            "caption": post.caption,
            "hashtags": post.hashtags,
            "youtube_title": post.youtube_title,
        }

        # Execute upload
        result = worker.upload(account, post.file_path, metadata)

        if result.get("success"):
            pp.status = "success"
            pp.platform_post_id = result.get("platform_post_id")
            pp.platform_post_url = result.get("platform_post_url")
            pp.uploaded_at = datetime.now(timezone.utc)
            logger.info(f"✅ {platform} upload success for post {post.id}")
        else:
            pp.status = "failed"
            pp.error_message = result.get("error", "Unknown error")
            logger.warning(f"❌ {platform} upload failed for post {post.id}: {pp.error_message}")

    except Exception as e:
        pp.status = "failed"
        pp.error_message = str(e)
        logger.error(f"❌ {platform} exception for post {post.id}: {e}")

    db.commit()
