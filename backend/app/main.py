"""
AutoPost Hub — FastAPI Application Entry Point
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import settings
from app.database import engine, Base
from app.routers import auth, upload, posts, accounts, admin, topup
from app.seed import seed_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup, seed default data."""
    Base.metadata.create_all(bind=engine)
    settings.upload_path  # property creates dir
    # Create proofs directory
    proof_dir = Path(settings.UPLOAD_DIR) / "proofs"
    proof_dir.mkdir(parents=True, exist_ok=True)
    # Seed superadmin and default settings
    seed_database()
    logging.info("✅ AutoPost Hub API ready")
    yield


app = FastAPI(
    title="AutoPost Hub API",
    description="Social media auto-uploader backend",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve proof files for admin viewing
proofs_path = Path(settings.UPLOAD_DIR) / "proofs"
proofs_path.mkdir(parents=True, exist_ok=True)
app.mount("/proofs", StaticFiles(directory=str(proofs_path)), name="proofs")

# Register routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(posts.router)
app.include_router(accounts.router)
app.include_router(admin.router)
app.include_router(topup.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "autopost-hub", "version": "2.0.0"}
