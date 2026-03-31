"""
AutoPost Hub — IP Blocklist Middleware

Checks incoming requests against a blocklist stored in the database.
Uses an in-memory cache (refreshed every 60 seconds) to avoid per-request DB hits.

Features:
  - Manual blocks by admin (permanent or with expiry)
  - Auto-blocks by system (after 3 lockouts in 1 hour)
  - Expiry-aware (auto-unblock when expires_at passes)
  - Thread-safe cache refresh

Admin endpoints for management are in routers/security.py
"""

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

# ── In-memory cache ────────────────────────────────────────────────────────────

_blocked_ips: dict[str, Optional[datetime]] = {}  # {ip: expires_at or None (permanent)}
_cache_lock = threading.Lock()
_last_refresh: float = 0
_CACHE_TTL = 60  # seconds between DB refreshes


def refresh_ip_cache(db=None) -> None:
    """Reload blocked IPs from database into memory cache."""
    global _blocked_ips, _last_refresh

    if db is None:
        from app.database import SessionLocal
        db = SessionLocal()
        close_db = True
    else:
        close_db = False

    try:
        from app.models import BlockedIP
        now = datetime.now(timezone.utc)

        # Load all blocks that haven't expired
        blocks = db.query(BlockedIP).filter(
            (BlockedIP.expires_at.is_(None)) | (BlockedIP.expires_at > now)
        ).all()

        with _cache_lock:
            _blocked_ips = {b.ip_address: b.expires_at for b in blocks}
            _last_refresh = time.monotonic()

    except Exception as e:
        logger.error(f"[IPBlocklist] Cache refresh error: {e}")
    finally:
        if close_db:
            db.close()


def is_ip_blocked(ip: str) -> bool:
    """Check if an IP is currently blocked. Refreshes cache if stale."""
    global _last_refresh

    with _cache_lock:
        stale = (time.monotonic() - _last_refresh) > _CACHE_TTL

    if stale:
        refresh_ip_cache()

    with _cache_lock:
        if ip not in _blocked_ips:
            return False
        expires_at = _blocked_ips[ip]
        if expires_at is None:
            return True  # Permanent block
        now = datetime.now(timezone.utc)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if now > expires_at:
            # Expired — remove from cache (will be cleaned from DB by next refresh)
            del _blocked_ips[ip]
            return False
        return True


def add_to_blocklist(ip: str, expires_at: Optional[datetime] = None) -> None:
    """Add IP to in-memory cache immediately (DB write happens separately)."""
    with _cache_lock:
        _blocked_ips[ip] = expires_at


def remove_from_blocklist(ip: str) -> None:
    """Remove IP from in-memory cache immediately."""
    with _cache_lock:
        _blocked_ips.pop(ip, None)


# ── Starlette Middleware ────────────────────────────────────────────────────────

class IPBlocklistMiddleware(BaseHTTPMiddleware):
    """
    Middleware that checks every request's source IP against the blocklist.
    Blocked IPs receive a 403 response immediately.

    Exempt paths:
      - /api/health (for monitoring tools)
      - /docs, /openapi.json (Swagger UI — admin only in prod anyway)
    """

    EXEMPT_PATHS = {"/api/health", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"

        # Check X-Forwarded-For if behind a proxy (Nginx/Cloudflare)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        if is_ip_blocked(client_ip):
            logger.warning(f"[IPBlocklist] Blocked request from {client_ip} to {request.url.path}")
            return JSONResponse(
                status_code=403,
                content={
                    "detail": "Akses ditolak. IP Anda telah diblokir. Hubungi admin jika ini adalah kesalahan.",
                    "code": "IP_BLOCKED",
                }
            )

        return await call_next(request)
