"""
AutoPost Hub — Pydantic Schemas (Request/Response)
Every field is explicitly typed. No leaking of internal fields.
"""

from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ── Auth ───────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str = Field(..., max_length=320)
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    plan: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Connected Account ──────────────────────────────────

class AccountCreateRequest(BaseModel):
    platform: str = Field(..., pattern="^(youtube|facebook|instagram|tiktok|x|threads)$")
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    profile_name: Optional[str] = None
    profile_url: Optional[str] = None


class AccountResponse(BaseModel):
    id: str
    platform: str
    profile_name: Optional[str]
    profile_url: Optional[str]
    connected_at: datetime

    model_config = {"from_attributes": True}


# ── Post ───────────────────────────────────────────────

class PostCreateRequest(BaseModel):
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    youtube_title: Optional[str] = None
    platforms: list[str] = Field(..., min_length=1)
    schedule_at: Optional[datetime] = None
    # File metadata from /api/upload response
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[float] = None
    file_type: Optional[str] = None


class PostPlatformResponse(BaseModel):
    id: str
    platform: str
    status: str
    error_message: Optional[str]
    platform_post_id: Optional[str]
    platform_post_url: Optional[str]
    uploaded_at: Optional[datetime]

    model_config = {"from_attributes": True}


class PostResponse(BaseModel):
    id: str
    caption: Optional[str]
    hashtags: Optional[str]
    youtube_title: Optional[str]
    file_name: Optional[str]
    file_size: Optional[float]
    file_type: Optional[str]
    status: str
    scheduled_at: Optional[datetime]
    created_at: datetime
    completed_at: Optional[datetime]
    platforms: list[PostPlatformResponse] = []

    model_config = {"from_attributes": True}


class PostListResponse(BaseModel):
    posts: list[PostResponse]
    total: int


# ── Dashboard Stats ────────────────────────────────────

class DashboardStats(BaseModel):
    total_posts: int
    scheduled: int
    success_rate: float
    connected_accounts: int
