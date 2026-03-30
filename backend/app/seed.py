"""
AutoPost Hub — Database Seeder
Auto-creates superadmin and default app settings on first startup.

IMPORTANT: Set these environment variables before deploying:
  SUPERADMIN_EMAIL    — email for superadmin account
  SUPERADMIN_PASSWORD — password for superadmin account
  SUPERADMIN_NAME     — display name (optional, default: "Super Admin")
"""

import logging

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import User, AppSetting
from app.auth import hash_password
from app.config import settings

logger = logging.getLogger(__name__)

# Default app settings seeded on first run
DEFAULT_SETTINGS = {
    "upload_price": "1000",
    "bank_name": "BCA",
    "bank_account": "1234567890",
    "bank_holder": "AutoPost Hub",
    "cs_whatsapp": "628123456789",
    "cs_email": "support@autoposthub.com",
}


def seed_database() -> None:
    """Seed superadmin and default settings. Safe to call multiple times."""
    db: Session = SessionLocal()
    try:
        _seed_superadmin(db)
        _seed_settings(db)
    except Exception as e:
        logger.error(f"Seed error: {e}")
    finally:
        db.close()


def _seed_superadmin(db: Session) -> None:
    """Create superadmin if not exists. Credentials read from env vars."""
    email = settings.SUPERADMIN_EMAIL
    password = settings.SUPERADMIN_PASSWORD
    name = settings.SUPERADMIN_NAME

    if not email or not password:
        logger.warning(
            "⚠️  SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD not set in environment. "
            "Superadmin will NOT be created. Please set these env vars."
        )
        return

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        # Ensure role is superadmin (in case it was accidentally changed)
        if existing.role != "superadmin":
            existing.role = "superadmin"
            db.commit()
            logger.info("✅ Updated existing user to superadmin")
        return

    admin = User(
        email=email,
        name=name,
        password_hash=hash_password(password),
        role="superadmin",
        balance=0.0,
    )
    db.add(admin)
    db.commit()
    logger.info(f"✅ Superadmin created: {email}")


def _seed_settings(db: Session) -> None:
    """Create default settings if not exists. Does not overwrite existing values."""
    for key, value in DEFAULT_SETTINGS.items():
        existing = db.query(AppSetting).filter(AppSetting.key == key).first()
        if not existing:
            db.add(AppSetting(key=key, value=value))

    db.commit()
    logger.info("✅ Default settings seeded")
