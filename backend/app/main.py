"""
AutoPost Hub — FastAPI Application Entry Point

SECURITY NOTE:
  Proof files (/proofs/) are NO LONGER served as public StaticFiles.
  They are served via authenticated endpoint: GET /api/admin/proofs/{filename}
  Only staff/admin can access them.

BACKGROUND JOBS (APScheduler):
  Every 1 hour  : cleanup_orphan_files       — removes ghost upload files (no Post record)
  Every 24 hours: cleanup_stale_partial_posts — removes files from 7-day-old partial posts
  Every 1 minute : trigger_scheduled_posts   — processes posts whose scheduled_at has arrived
"""

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from threading import Thread

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import auth, upload, posts, accounts, admin, topup
from app.seed import seed_database
from app.workers.cleanup import cleanup_orphan_files, cleanup_stale_partial_posts

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ── Scheduled Jobs ──────────────────────────────────────────────

def _run_orphan_cleanup():
    """Scheduled job: remove ghost files from uploads directory."""
    db = SessionLocal()
    try:
        deleted = cleanup_orphan_files(settings.UPLOAD_DIR, db, max_age_hours=2)
        if deleted:
            logger.info(f"[Scheduler] Orphan cleanup: removed {deleted} file(s)")
    except Exception as e:
        logger.error(f"[Scheduler] Orphan cleanup error: {e}")
    finally:
        db.close()


def _run_stale_partial_cleanup():
    """Scheduled job: remove files from partial posts older than 7 days."""
    db = SessionLocal()
    try:
        from app.workers.cleanup import cleanup_stale_partial_posts
        cleaned = cleanup_stale_partial_posts(db, max_age_days=7)
        if cleaned:
            logger.info(f"[Scheduler] Stale partial cleanup: processed {cleaned} post(s)")
    except Exception as e:
        logger.error(f"[Scheduler] Stale partial cleanup error: {e}")
    finally:
        db.close()


def _trigger_scheduled_posts():
    """
    Scheduled job (every minute): find posts whose scheduled_at has arrived
    and trigger their background processing.

    This completes the C-3 fix — posts with schedule_at in the future are
    now properly deferred and triggered at the right time.
    """
    from app.models import Post
    from app.workers.tasks import process_post

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        # Find queued posts whose scheduled time has arrived
        due_posts = db.query(Post).filter(
            Post.status == "queued",
            Post.scheduled_at.isnot(None),
            Post.scheduled_at <= now,
        ).all()

        for post in due_posts:
            logger.info(f"[Scheduler] Triggering scheduled post {post.id} (was due at {post.scheduled_at})")
            # Mark as processing first to avoid double-trigger
            post.status = "processing"
            db.commit()
            # Launch background thread
            thread = Thread(target=process_post, args=(post.id,), daemon=True)
            thread.start()

    except Exception as e:
        logger.error(f"[Scheduler] Scheduled posts trigger error: {e}")
    finally:
        db.close()


scheduler = BackgroundScheduler(timezone="UTC")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup, seed default data, start scheduler."""
    Base.metadata.create_all(bind=engine)
    settings.upload_path    # property creates uploads dir
    settings.proofs_path    # property creates proofs subdir

    # Seed superadmin and default settings
    seed_database()

    # ── Background jobs ──
    scheduler.add_job(
        _trigger_scheduled_posts,
        "interval", minutes=1,
        id="scheduled_posts_trigger",
        max_instances=1,  # Prevent overlapping runs
    )
    scheduler.add_job(
        _run_orphan_cleanup,
        "interval", hours=1,
        id="orphan_cleanup",
        max_instances=1,
    )
    scheduler.add_job(
        _run_stale_partial_cleanup,
        "interval", hours=24,
        id="stale_cleanup",
        max_instances=1,
    )
    scheduler.start()

    logger.info("✅ AutoPost Hub API ready — APScheduler running (3 jobs)")
    yield

    # Graceful shutdown
    scheduler.shutdown(wait=False)
    logger.info("🛑 AutoPost Hub API shutdown complete")


# ── FastAPI App ─────────────────────────────────────────────────

app = FastAPI(
    title="AutoPost Hub API",
    description="Social media auto-uploader backend",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — explicit method list for production safety
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Register routers
# NOTE: /proofs static mount is REMOVED — files served via authenticated /api/admin/proofs/
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(posts.router)
app.include_router(accounts.router)
app.include_router(admin.router)
app.include_router(topup.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "autopost-hub",
        "version": "2.0.0",
        "scheduler": "running" if scheduler.running else "stopped",
    }
