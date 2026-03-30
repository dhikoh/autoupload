"""
AutoPost Hub — Upload Task Processor
Processes post uploads synchronously (or via Celery in production).
Uploads to each target platform, updates status, then triggers cleanup.

ACCOUNT HANDLING:
  If a platform's connected account was deleted after post creation,
  account will be None. In DEMO/MOCK mode this is fine.
  In PRODUCTION with real APIs, missing account = upload failed with clear error.
"""

import logging
from datetime import datetime, timezone
from importlib import import_module

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Post, PostPlatform, ConnectedAccount
from app.workers.cleanup import check_and_cleanup

logger = logging.getLogger(__name__)

# Mapping from platform name → Python module path
PLATFORM_MODULES = {
    "youtube":   "app.workers.platforms.youtube",
    "facebook":  "app.workers.platforms.facebook",
    "instagram": "app.workers.platforms.instagram",
    "tiktok":    "app.workers.platforms.tiktok",
    "x":         "app.workers.platforms.x_twitter",
    "threads":   "app.workers.platforms.threads",
}

# Set to True if real API credentials are configured.
# When False (DEMO/MOCK mode), missing accounts are allowed and mock uploads run.
# When True, missing account causes immediate failure with helpful error.
REQUIRE_CONNECTED_ACCOUNT = False  # Change to True after OAuth is implemented


def process_post(post_id: str) -> None:
    """
    Process a post: upload to each target platform, update status, cleanup.
    Runs synchronously in dev mode. In production, can be called via Celery.
    """
    db: Session = SessionLocal()
    post = None
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            logger.error(f"Post {post_id} not found in database")
            return

        # Only process if in queued state (guard against double-processing)
        if post.status not in ("queued",):
            logger.warning(f"Post {post_id} is in status '{post.status}', skipping")
            return

        post.status = "processing"
        db.commit()
        logger.info(f"⚙️ Processing post {post_id} → platforms: "
                    f"{[p.platform for p in post.platforms]}")

        # Get all pending/failed platforms for this post
        platform_records = (
            db.query(PostPlatform)
            .filter(
                PostPlatform.post_id == post_id,
                PostPlatform.status.in_(["pending", "failed"])
            )
            .all()
        )

        if not platform_records:
            logger.warning(f"Post {post_id}: no pending platforms found")
            post.status = "failed"
            db.commit()
            return

        for pp in platform_records:
            _upload_to_platform(pp, post, db)

        # After all uploads attempt, determine final status and cleanup
        check_and_cleanup(post_id, db)

    except Exception as e:
        logger.error(f"❌ Critical error processing post {post_id}: {e}", exc_info=True)
        # Recovery: mark post as failed if still stuck in processing
        try:
            if post is not None and post.status == "processing":
                post.status = "failed"
                db.commit()
            elif post is None:
                # Reload from DB in case local reference is stale
                stale_post = db.query(Post).filter(Post.id == post_id).first()
                if stale_post and stale_post.status == "processing":
                    stale_post.status = "failed"
                    db.commit()
        except Exception as recovery_err:
            logger.error(f"Recovery also failed for post {post_id}: {recovery_err}")
    finally:
        db.close()


def _upload_to_platform(pp: PostPlatform, post: Post, db: Session) -> None:
    """Upload content to a single platform and update the PostPlatform record."""
    platform = pp.platform

    try:
        # 1. Mark as uploading
        pp.status = "uploading"
        db.commit()

        # 2. Validate platform module exists
        module_path = PLATFORM_MODULES.get(platform)
        if not module_path:
            pp.status = "failed"
            pp.error_message = f"Platform '{platform}' tidak didukung"
            db.commit()
            logger.error(f"Unsupported platform: {platform}")
            return

        # 3. Load the platform worker module
        worker = import_module(module_path)

        # 4. Get connected account (may be None if disconnected after post creation)
        account = None
        if pp.account_id:
            account = db.query(ConnectedAccount).filter(
                ConnectedAccount.id == pp.account_id
            ).first()

            if not account:
                # Account was deleted after post was created
                logger.warning(
                    f"Post {post.id}: connected account {pp.account_id} "
                    f"for {platform} was deleted. "
                    f"{'Failing upload.' if REQUIRE_CONNECTED_ACCOUNT else 'Continuing in mock mode.'}"
                )
                if REQUIRE_CONNECTED_ACCOUNT:
                    pp.status = "failed"
                    pp.error_message = (
                        f"Akun {platform} yang ditautkan sudah dihapus. "
                        "Silakan connect ulang akun dan retry."
                    )
                    db.commit()
                    return
                # In mock mode: continue with account=None

        elif REQUIRE_CONNECTED_ACCOUNT:
            # No account linked at all and we require one
            pp.status = "failed"
            pp.error_message = (
                f"Tidak ada akun {platform} yang terhubung. "
                "Silakan connect akun di halaman Accounts."
            )
            db.commit()
            logger.warning(f"Post {post.id}: no account for {platform} — upload skipped")
            return

        # 5. Build metadata payload
        metadata = {
            "caption": post.caption,
            "hashtags": post.hashtags,
            "youtube_title": post.youtube_title,
            "file_type": post.file_type,
        }

        # 6. Execute upload via platform worker
        result = worker.upload(account, post.file_path, metadata)

        # 7. Update PostPlatform record based on result
        if result.get("success"):
            pp.status = "success"
            pp.platform_post_id = result.get("platform_post_id")
            pp.platform_post_url = result.get("platform_post_url")
            pp.uploaded_at = datetime.now(timezone.utc)
            logger.info(f"✅ {platform} upload success for post {post.id}")
        else:
            pp.status = "failed"
            pp.error_message = result.get("error", "Unknown upload error")
            logger.warning(
                f"❌ {platform} upload failed for post {post.id}: {pp.error_message}"
            )

    except ImportError as e:
        pp.status = "failed"
        pp.error_message = f"Platform module error: {e}"
        logger.error(f"Cannot import {platform} worker: {e}")

    except Exception as e:
        pp.status = "failed"
        pp.error_message = str(e)[:500]  # Truncate very long error messages
        logger.error(f"❌ {platform} exception for post {post.id}: {e}", exc_info=True)

    finally:
        db.commit()
