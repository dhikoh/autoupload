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
    role: str = "tenant"


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    balance: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Connected Account ──────────────────────────────────

class AccountCreateRequest(BaseModel):
    platform: str = Field(..., pattern="^(youtube|facebook|instagram|tiktok|x|threads)$")
    platform_username: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    profile_name: Optional[str] = None
    profile_url: Optional[str] = None


class AccountResponse(BaseModel):
    id: str
    platform: str
    platform_username: Optional[str]
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
    cost: float
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
    balance: float
    upload_price: float


# ── Top-Up ─────────────────────────────────────────────

class TopUpCreateRequest(BaseModel):
    amount: float = Field(..., gt=0)


class TopUpResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    proof_file_name: Optional[str]
    status: str
    admin_note: Optional[str]
    created_at: datetime
    reviewed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class TopUpListResponse(BaseModel):
    topups: list[TopUpResponse]
    total: int


# ── Balance ────────────────────────────────────────────

class BalanceTransactionResponse(BaseModel):
    id: str
    amount: float
    type: str
    reference_id: Optional[str]
    balance_after: float
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class BalanceResponse(BaseModel):
    balance: float
    transactions: list[BalanceTransactionResponse]


# ── Admin ──────────────────────────────────────────────

class AdminStatsResponse(BaseModel):
    total_users: int
    total_posts: int
    total_revenue: float
    pending_topups: int
    active_users: int
    suspended_users: int


class AdminUserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    balance: float
    is_active: bool
    total_posts: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserListResponse(BaseModel):
    users: list[AdminUserResponse]
    total: int


class AdminBalanceAddRequest(BaseModel):
    amount: float = Field(..., gt=0)
    description: Optional[str] = None


class AdminTopUpReviewRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    note: Optional[str] = None


class AdminSettingsResponse(BaseModel):
    upload_price: str
    bank_name: str
    bank_account: str
    bank_holder: str
    cs_whatsapp: str
    cs_email: str


class AdminSettingsUpdateRequest(BaseModel):
    upload_price: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_holder: Optional[str] = None
    cs_whatsapp: Optional[str] = None
    cs_email: Optional[str] = None


class PublicSettingsResponse(BaseModel):
    upload_price: str
    bank_name: str
    bank_account: str
    bank_holder: str
    cs_whatsapp: str
    cs_email: str


class AdminStaffCreateRequest(BaseModel):
    email: str = Field(..., max_length=320)
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)


class RankingEntry(BaseModel):
    user_id: str
    user_name: str
    user_email: str
    platform: str
    platform_username: Optional[str]
    total_uploads: int
    success_count: int
    success_rate: float


class RankingResponse(BaseModel):
    rankings: list[RankingEntry]
