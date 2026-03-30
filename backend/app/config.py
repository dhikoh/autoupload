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

    # Database
    DATABASE_URL: str = "sqlite:///./autopost.db"

    # File upload
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 500

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_CELERY: bool = False  # False = sync mode (no Redis needed)

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Superadmin (REQUIRED in production — never hardcode in source)
    SUPERADMIN_EMAIL: Optional[str] = None
    SUPERADMIN_PASSWORD: Optional[str] = None
    SUPERADMIN_NAME: str = "Super Admin"

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


settings = Settings()
