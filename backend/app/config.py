"""
AutoPost Hub — Application Settings
Loaded from .env file or environment variables.
"""

from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional


class Settings(BaseSettings):
    # App
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    BASE_URL: str = "http://localhost:3000"  # Frontend base URL (for email links)

    # Database
    DATABASE_URL: str = "sqlite:///./autopost.db"

    # File upload
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 500

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_CELERY: bool = False

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Superadmin
    SUPERADMIN_EMAIL: Optional[str] = None
    SUPERADMIN_PASSWORD: Optional[str] = None
    SUPERADMIN_NAME: str = "Super Admin"

    # ── Email / SMTP ───────────────────────────────────────────
    # Required for: email verification, admin notifications
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None       # e.g. noreply@yourdomain.com
    SMTP_PASSWORD: Optional[str] = None       # App password (not account password)
    SMTP_FROM_EMAIL: str = "noreply@autoposthub.com"
    SMTP_FROM_NAME: str = "AutoPost Hub"
    SMTP_USE_TLS: bool = True                 # True = STARTTLS (port 587), False = SSL (port 465)

    # ── Security Features ──────────────────────────────────────
    EMAIL_VERIFICATION_REQUIRED: bool = False  # Set True in production
    ADMIN_NOTIFICATION_EMAIL: Optional[str] = None  # Where to send security alerts
    IP_BLOCKLIST_AUTO_BLOCK: bool = True       # Auto-block IPs after 3 lockouts/hour
    IP_AUTO_BLOCK_DURATION_HOURS: int = 24     # Duration of auto-block

    model_config = {"env_file": ".env", "extra": "ignore"}

    @property
    def upload_path(self) -> Path:
        p = Path(self.UPLOAD_DIR)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def proofs_path(self) -> Path:
        p = Path(self.UPLOAD_DIR) / "proofs"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def smtp_configured(self) -> bool:
        """Returns True if SMTP is properly configured."""
        return bool(self.SMTP_USERNAME and self.SMTP_PASSWORD)


settings = Settings()
