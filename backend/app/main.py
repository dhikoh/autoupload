"""
AutoPost Hub — FastAPI Application Entry Point
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import auth, upload, posts, accounts

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup. No orphan tables — all defined in models.py."""
    Base.metadata.create_all(bind=engine)
    # Ensure upload directory exists
    settings.upload_path  # property creates dir
    logging.info("✅ AutoPost Hub API ready")
    yield


app = FastAPI(
    title="AutoPost Hub API",
    description="Social media auto-uploader backend",
    version="1.0.0",
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

# Register routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(posts.router)
app.include_router(accounts.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "autopost-hub"}
