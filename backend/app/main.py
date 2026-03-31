"""
AutoPost Hub — FastAPI Application Entry Point

SECURITY NOTE:
  Proof files (/proofs/) are NO LONGER served as public StaticFiles.
  They are served via authenticated endpoint: GET /api/admin/proofs/{filename}
  Only staff/admin can access them.

BACKGROUND JOBS (APScheduler):
  Every 1 minute : trigger_scheduled_posts — processes posts whose scheduled_at has arrived
  Every 1 hour   : cleanup_orphan_files    — removes ghost upload files
  Every 24 hours : cleanup_stale_partial   — removes files from 7-day-old partial posts

MULTI-WORKER NOTE:
  APScheduler only starts on the PRIMARY worker (process rank 0 via WORKER_ID env var).
  This prevents duplicate job runs when running multiple uvicorn workers.
  When using --workers > 1, set WORKER_ID=0 on one instance only,
  OR use --workers 1 (simplest, recommended for SQLite).
"""

import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from threading import Thread

from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import auth, upload, posts, accounts, admin, topup
from app.seed import seed_database
from app.workers.cleanup import cleanup_orphan_files, cleanup_stale_partial_posts
from app.middleware.rate_limit import limiter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ── Scheduled Job Functions ─────────────────────────────────────

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
    """
    from app.models import Post
    from app.workers.tasks import process_post

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        due_posts = db.query(Post).filter(
            Post.status == "queued",
            Post.scheduled_at.isnot(None),
            Post.scheduled_at <= now,
        ).all()

        for post in due_posts:
            logger.info(f"[Scheduler] Triggering scheduled post {post.id}")
            post.status = "processing"
            db.commit()
            thread = Thread(target=process_post, args=(post.id,), daemon=True)
            thread.start()

    except Exception as e:
        logger.error(f"[Scheduler] Scheduled posts trigger error: {e}")
    finally:
        db.close()


# ── Scheduler Setup ─────────────────────────────────────────────

def _is_primary_worker() -> bool:
    """
    Detect if this is the primary worker process.

    With uvicorn --workers N, each worker is a separate process.
    We only want ONE process running the APScheduler to prevent duplicate jobs.

    Detection strategy:
    - Use WORKER_ID env var if set (set to "0" on primary worker)
    - Fallback: use SQLAlchemy job store which handles distributed deduplication
    """
    worker_id = os.environ.get("WORKER_ID", "0")
    return worker_id == "0"


def _make_scheduler() -> BackgroundScheduler:
    """
    Create APScheduler with SQLAlchemy job store.
    This ensures jobs don't run twice even if multiple workers somehow start.
    """
    # Use database as job store — prevents duplicate job registration
    # Works with both SQLite and PostgreSQL
    jobstores = {
        "default": SQLAlchemyJobStore(engine=engine)
    }
    return BackgroundScheduler(
        jobstores=jobstores,
        timezone="UTC",
    )


scheduler: BackgroundScheduler | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup, seed default data, start scheduler."""
    global scheduler

    # Create all tables
    Base.metadata.create_all(bind=engine)
    settings.upload_path   # Creates uploads dir
    settings.proofs_path   # Creates proofs subdir

    # Seed superadmin and default settings
    seed_database()

    # Only start scheduler on the primary worker
    if _is_primary_worker():
        scheduler = _make_scheduler()

        # Remove stale jobs from previous run before adding new ones
        try:
            scheduler.remove_all_jobs()
        except Exception:
            pass

        scheduler.add_job(
            _trigger_scheduled_posts,
            "interval", minutes=1,
            id="scheduled_posts_trigger",
            max_instances=1,
            replace_existing=True,
        )
        scheduler.add_job(
            _run_orphan_cleanup,
            "interval", hours=1,
            id="orphan_cleanup",
            max_instances=1,
            replace_existing=True,
        )
        scheduler.add_job(
            _run_stale_partial_cleanup,
            "interval", hours=24,
            id="stale_cleanup",
            max_instances=1,
            replace_existing=True,
        )
        scheduler.start()
        logger.info("✅ AutoPost Hub API ready — APScheduler running (3 jobs)")
    else:
        logger.info("✅ AutoPost Hub API ready — scheduler skipped (secondary worker)")

    yield

    # Graceful shutdown
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("🛑 APScheduler shutdown")


# ── FastAPI App ─────────────────────────────────────────────────

app = FastAPI(
    title="AutoPost Hub API",
    description="Social media auto-uploader backend",
    version="2.0.0",
    lifespan=lifespan,
)

# Rate limiting (slowapi) — must be registered before CORS middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS — explicit origins for production safety
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
        "database": "postgresql" if settings.DATABASE_URL.startswith("postgresql") else "sqlite",
        "scheduler": "running" if (scheduler and scheduler.running) else "stopped",
    }
