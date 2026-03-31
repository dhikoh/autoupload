"""
AutoPost Hub — Lightweight Schema Migration Runner

Handles ALTER TABLE for existing databases that were created before certain
columns were added. Uses SQLAlchemy text() to execute raw SQL safely.

This is a simple alternative to Alembic for single-server deployments.
For multi-server production, migrate to Alembic (see DEPLOY.md).

Called in main.py lifespan AFTER create_all().
"""

import logging
from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def run_migrations(engine: Engine) -> None:
    """
    Apply any pending schema migrations idempotently.
    Safe to call multiple times — already-existing columns are silently skipped.
    """
    with engine.connect() as conn:
        is_sqlite = str(engine.url).startswith("sqlite")
        is_pg = str(engine.url).startswith("postgresql")

        _migrations = [
            # (table, column, type_sqlite, type_pg)
            ("users", "is_email_verified", "BOOLEAN DEFAULT 0", "BOOLEAN DEFAULT false"),
            ("users", "email_verification_token", "VARCHAR(64)", "VARCHAR(64)"),
            ("users", "email_verification_expires", "DATETIME", "TIMESTAMP"),
        ]

        for table, column, type_sqlite, type_pg in _migrations:
            col_type = type_sqlite if is_sqlite else type_pg
            try:
                if is_sqlite:
                    conn.execute(text(
                        f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"
                    ))
                elif is_pg:
                    conn.execute(text(
                        f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type}"
                    ))
                conn.commit()
                logger.info(f"[Migration] Added column: {table}.{column}")
            except Exception:
                # Column already exists — safe to ignore
                conn.rollback()

        logger.info("[Migration] Schema migrations complete")
