"""
AutoPost Hub — Database Setup (SQLAlchemy)

Supports both SQLite (development) and PostgreSQL (production).

SQLite:  DATABASE_URL=sqlite:///./autopost.db
         DATABASE_URL=sqlite:////app/data/autopost.db  (Docker absolute path)

PostgreSQL: DATABASE_URL=postgresql://user:password@host:5432/autopost_db
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings


def _make_engine():
    url = settings.DATABASE_URL

    if url.startswith("sqlite"):
        # SQLite: single-file, needs check_same_thread=False for multi-threaded FastAPI
        # Uses StaticPool for in-memory, NullPool for file-based (already correct)
        engine = create_engine(
            url,
            connect_args={"check_same_thread": False},
            # SQLite WAL mode: allows concurrent readers + 1 writer (much better performance)
            echo=False,
        )

        # Enable WAL mode for SQLite — critical for concurrent reads with APScheduler
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_conn, connection_record):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")    # Write-Ahead Logging
            cursor.execute("PRAGMA synchronous=NORMAL")  # Balance durability/speed
            cursor.execute("PRAGMA foreign_keys=ON")     # Enforce FK constraints
            cursor.execute("PRAGMA busy_timeout=5000")   # Wait up to 5s if locked
            cursor.close()

        return engine

    elif url.startswith("postgresql"):
        # PostgreSQL: full-featured, production-ready
        # Connection pool: 5 connections per worker, overflow up to 10
        engine = create_engine(
            url,
            pool_size=5,
            max_overflow=10,
            pool_timeout=30,
            pool_recycle=1800,  # Recycle connections every 30 min (prevents stale connections)
            echo=False,
        )
        return engine

    else:
        # Generic fallback
        return create_engine(url, echo=False)


engine = _make_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
