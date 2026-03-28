"""
AutoPost Hub — Database Models
All tables defined here. No orphan relationships — cascade delete enabled.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Float, Text,
    DateTime, ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ── Enums ──────────────────────────────────────────────

PLATFORMS = ("youtube", "facebook", "instagram", "tiktok", "x", "threads")

POST_STATUS = ("draft", "queued", "processing", "completed", "partial", "failed")

PLATFORM_UPLOAD_STATUS = ("pending", "uploading", "success", "failed")


# ── User ───────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String(320), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    password_hash = Column(String(128), nullable=False)
    plan = Column(String(20), default="free")  # free / pro / business
    created_at = Column(DateTime, default=_now)

    # Relationships — cascade delete to prevent orphans
    accounts = relationship("ConnectedAccount", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")


# ── Connected Account (OAuth tokens per platform) ──────

class ConnectedAccount(Base):
    __tablename__ = "connected_accounts"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(20), nullable=False)  # youtube, facebook, etc.
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    profile_name = Column(String(100), nullable=True)
    profile_url = Column(String(500), nullable=True)
    connected_at = Column(DateTime, default=_now)

    user = relationship("User", back_populates="accounts")


# ── Post (the main upload job) ─────────────────────────

class Post(Base):
    __tablename__ = "posts"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Content
    caption = Column(Text, nullable=True)
    hashtags = Column(String(500), nullable=True)
    youtube_title = Column(String(200), nullable=True)

    # File — set to NULL after successful cleanup
    file_path = Column(String(500), nullable=True)
    file_name = Column(String(200), nullable=True)
    file_size = Column(Float, nullable=True)  # in MB
    file_type = Column(String(50), nullable=True)  # video/mp4, image/jpeg, etc.

    # Status
    status = Column(String(20), default="draft")  # draft/queued/processing/completed/partial/failed
    scheduled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="posts")
    platforms = relationship("PostPlatform", back_populates="post", cascade="all, delete-orphan")


# ── PostPlatform (status per platform for each post) ───

class PostPlatform(Base):
    __tablename__ = "post_platforms"

    id = Column(String, primary_key=True, default=_uuid)
    post_id = Column(String, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)

    platform = Column(String(20), nullable=False)
    account_id = Column(String, ForeignKey("connected_accounts.id", ondelete="SET NULL"), nullable=True)

    # Upload status
    status = Column(String(20), default="pending")  # pending/uploading/success/failed
    error_message = Column(Text, nullable=True)
    platform_post_id = Column(String(200), nullable=True)  # ID returned by the platform
    platform_post_url = Column(String(500), nullable=True)

    uploaded_at = Column(DateTime, nullable=True)

    post = relationship("Post", back_populates="platforms")
