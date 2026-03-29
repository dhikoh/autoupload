"""
AutoPost Hub — Database Seeder
Auto-creates superadmin and default app settings on first startup.
"""

import logging

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import User, AppSetting
from app.auth import hash_password

logger = logging.getLogger(__name__)

# Default app settings
DEFAULT_SETTINGS = {
    "upload_price": "1000",
    "bank_name": "BCA",
    "bank_account": "1234567890",
    "bank_holder": "AutoPost Hub",
    "cs_whatsapp": "628123456789",
    "cs_email": "support@autoposthub.com",
}

# Superadmin credentials
SUPERADMIN_EMAIL = "dhiko.h@gmail.com"
SUPERADMIN_PASSWORD = "Bismillah@up2026~"
SUPERADMIN_NAME = "Dhiko (Admin)"


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
    """Create superadmin if not exists."""
    existing = db.query(User).filter(User.email == SUPERADMIN_EMAIL).first()
    if existing:
        # Ensure role is superadmin (in case was changed)
        if existing.role != "superadmin":
            existing.role = "superadmin"
            db.commit()
            logger.info("✅ Updated existing user to superadmin")
        return

    admin = User(
        email=SUPERADMIN_EMAIL,
        name=SUPERADMIN_NAME,
        password_hash=hash_password(SUPERADMIN_PASSWORD),
        role="superadmin",
        balance=0.0,
    )
    db.add(admin)
    db.commit()
    logger.info(f"✅ Superadmin created: {SUPERADMIN_EMAIL}")


def _seed_settings(db: Session) -> None:
    """Create default settings if not exists. Does not overwrite existing."""
    for key, value in DEFAULT_SETTINGS.items():
        existing = db.query(AppSetting).filter(AppSetting.key == key).first()
        if not existing:
            db.add(AppSetting(key=key, value=value))

    db.commit()
    logger.info("✅ Default settings seeded")
