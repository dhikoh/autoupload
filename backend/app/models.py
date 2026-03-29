"""
AutoPost Hub — Database Models
All tables defined here. No orphan relationships — cascade delete enabled.

Roles: superadmin, staff, tenant
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Float, Text, Boolean,
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

USER_ROLES = ("superadmin", "staff", "tenant")

TOPUP_STATUS = ("pending", "approved", "rejected")

TRANSACTION_TYPES = ("topup", "deduct", "manual_add", "refund")


# ── User ───────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String(320), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    password_hash = Column(String(128), nullable=False)
    role = Column(String(20), default="tenant")       # superadmin / staff / tenant
    balance = Column(Float, default=0.0)               # saldo in Rupiah
    is_active = Column(Boolean, default=True)           # admin can suspend
    created_at = Column(DateTime, default=_now)

    # Relationships — cascade delete to prevent orphans
    accounts = relationship("ConnectedAccount", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    topup_requests = relationship("TopUpRequest", back_populates="user", cascade="all, delete-orphan",
                                  foreign_keys="TopUpRequest.user_id")
    transactions = relationship("BalanceTransaction", back_populates="user", cascade="all, delete-orphan")


# ── App Settings (admin-configurable key-value) ────────

class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=_now, onupdate=_now)


# ── Top-Up Request ─────────────────────────────────────

class TopUpRequest(Base):
    __tablename__ = "topup_requests"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    amount = Column(Float, nullable=False)   # Rp
    proof_file_path = Column(String(500), nullable=True)
    proof_file_name = Column(String(200), nullable=True)

    status = Column(String(20), default="pending")  # pending/approved/rejected
    admin_note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=_now)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    user = relationship("User", back_populates="topup_requests", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])


# ── Balance Transaction (audit trail) ──────────────────

class BalanceTransaction(Base):
    __tablename__ = "balance_transactions"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    amount = Column(Float, nullable=False)   # positive = credit, negative = debit
    type = Column(String(20), nullable=False)  # topup/deduct/manual_add/refund
    reference_id = Column(String, nullable=True)  # topup_id or post_id
    balance_after = Column(Float, nullable=False)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=_now)

    user = relationship("User", back_populates="transactions")


# ── Connected Account (OAuth tokens per platform) ──────

class ConnectedAccount(Base):
    __tablename__ = "connected_accounts"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(20), nullable=False)
    platform_username = Column(String(100), nullable=True)  # channel/account name
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
    file_size = Column(Float, nullable=True)
    file_type = Column(String(50), nullable=True)

    # Cost
    cost = Column(Float, default=0.0)  # Rp charged for this post

    # Status
    status = Column(String(20), default="draft")
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
    status = Column(String(20), default="pending")
    error_message = Column(Text, nullable=True)
    platform_post_id = Column(String(200), nullable=True)
    platform_post_url = Column(String(500), nullable=True)

    uploaded_at = Column(DateTime, nullable=True)

    post = relationship("Post", back_populates="platforms")
