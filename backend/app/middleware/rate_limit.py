"""
AutoPost Hub — Rate Limiting & Account Lockout

Provides:
  1. Slowapi limiter instance (IP-based rate limiting per endpoint)
  2. In-memory account lockout tracker (brute-force protection on login)

Rate limits applied per endpoint:
  POST /api/auth/login     — 5/minute per IP (brute force prevention)
  POST /api/auth/register  — 3/minute per IP (registration spam prevention)
  POST /api/upload         — 20/hour per IP (upload spam prevention)
  POST /api/posts          — 30/hour per user (post creation spam)
  POST /api/topup          — 5/hour per IP (topup spam prevention)

Account lockout:
  After 10 failed login attempts within 15 minutes → IP locked for 15 minutes
  This runs independently of IP rate limiting (defense in depth)

NOTE: These are application-level limits. Production deployments should ALSO
add Nginx/Traefik rate limiting at the proxy level for additional protection
(see DEPLOY.md for recommended Nginx config).
"""

import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)

# ── Slowapi Limiter (IP-based) ─────────────────────────────────────────────────

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],          # No global limit — set per endpoint
    headers_enabled=True,       # Return X-RateLimit-* headers in responses
)


# ── Account Lockout (Failed Login Tracker) ─────────────────────────────────────

_LOCKOUT_MAX_ATTEMPTS = 10       # Max failed attempts before lockout
_LOCKOUT_WINDOW_MINUTES = 15     # Time window to count failures
_LOCKOUT_DURATION_MINUTES = 15   # How long the lockout lasts

# { "email": [datetime, datetime, ...] } — list of failed attempt timestamps
_failed_login_attempts: dict[str, list[datetime]] = defaultdict(list)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def check_login_lockout(email: str) -> None:
    """
    Raise ValueError if email is currently locked out.
    Call BEFORE verifying password.
    """
    email = email.lower().strip()
    now = _now()
    cutoff = now - timedelta(minutes=_LOCKOUT_WINDOW_MINUTES)

    # Prune old attempts outside the window
    _failed_login_attempts[email] = [
        t for t in _failed_login_attempts[email] if t > cutoff
    ]

    if len(_failed_login_attempts[email]) >= _LOCKOUT_MAX_ATTEMPTS:
        oldest = _failed_login_attempts[email][0]
        unlock_at = oldest + timedelta(minutes=_LOCKOUT_DURATION_MINUTES)
        remaining = int((unlock_at - now).total_seconds() / 60) + 1
        logger.warning(f"[Lockout] Login blocked for {email} — too many failures")
        raise ValueError(
            f"Terlalu banyak percobaan login yang gagal. "
            f"Coba lagi dalam {remaining} menit."
        )


def record_failed_login(email: str) -> None:
    """Record a failed login attempt. Call AFTER confirming password is wrong."""
    email = email.lower().strip()
    _failed_login_attempts[email].append(_now())
    count = len(_failed_login_attempts[email])
    remaining = max(0, _LOCKOUT_MAX_ATTEMPTS - count)
    logger.warning(
        f"[Security] Failed login for {email} — "
        f"attempt {count}/{_LOCKOUT_MAX_ATTEMPTS}, "
        f"{remaining} attempt(s) before lockout"
    )


def clear_failed_logins(email: str) -> None:
    """Clear failed login counter after successful login."""
    email = email.lower().strip()
    if email in _failed_login_attempts:
        del _failed_login_attempts[email]
