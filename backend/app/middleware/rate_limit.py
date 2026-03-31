"""
AutoPost Hub — Rate Limiting & Account Lockout

Provides:
  1. Slowapi limiter instance (IP-based rate limiting per endpoint)
  2. In-memory account lockout tracker (brute-force protection on login)
  3. Auto-block IP after repeated lockout triggers (+ admin notification)

Rate limits applied per endpoint:
  POST /api/auth/login     — 5/minute per IP
  POST /api/auth/register  — 3/minute per IP
  POST /api/upload         — 20 per 10 minutes per IP
  POST /api/posts          — 30 per 10 minutes per IP
  POST /api/topup          — 5 per 10 minutes per IP

Account lockout:
  After 10 failed login attempts within 15 minutes → IP locked for 15 minutes
  Auto-block IP in database after 3 lockout events in 1 hour (if enabled)
"""

import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)

# ── Slowapi Limiter ────────────────────────────────────────────────────────────

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    headers_enabled=True,   # Return X-RateLimit-* headers
)


# ── Account Lockout ────────────────────────────────────────────────────────────

_LOCKOUT_MAX_ATTEMPTS = 10
_LOCKOUT_WINDOW_MINUTES = 15
_LOCKOUT_DURATION_MINUTES = 15

# Failed login attempts per email
_failed_login_attempts: dict[str, list[datetime]] = defaultdict(list)

# Lockout events per IP (for auto-block escalation)
_lockout_events_by_ip: dict[str, list[datetime]] = defaultdict(list)
_AUTO_BLOCK_THRESHOLD = 3    # lockout events per IP before auto-block
_AUTO_BLOCK_WINDOW_HOURS = 1  # time window to count lockout events


def _now() -> datetime:
    return datetime.now(timezone.utc)


def check_login_lockout(email: str) -> None:
    """Raise ValueError if email is currently locked out. Call BEFORE verifying password."""
    email = email.lower().strip()
    now = _now()
    cutoff = now - timedelta(minutes=_LOCKOUT_WINDOW_MINUTES)

    _failed_login_attempts[email] = [
        t for t in _failed_login_attempts[email] if t > cutoff
    ]

    if len(_failed_login_attempts[email]) >= _LOCKOUT_MAX_ATTEMPTS:
        oldest = _failed_login_attempts[email][0]
        unlock_at = oldest + timedelta(minutes=_LOCKOUT_DURATION_MINUTES)
        remaining = max(1, int((unlock_at - now).total_seconds() / 60) + 1)
        logger.warning(f"[Lockout] Login blocked for {email}")
        raise ValueError(
            f"Terlalu banyak percobaan login yang gagal. "
            f"Coba lagi dalam {remaining} menit."
        )


def record_failed_login(email: str, ip_address: Optional[str] = None) -> None:
    """
    Record a failed login attempt.
    If this triggers lockout AND IP is known, record lockout event for potential auto-block.
    """
    email = email.lower().strip()
    now = _now()
    _failed_login_attempts[email].append(now)
    count = len(_failed_login_attempts[email])
    remaining = max(0, _LOCKOUT_MAX_ATTEMPTS - count)

    logger.warning(
        f"[Security] Failed login: {email} from {ip_address or 'unknown'} "
        f"— attempt {count}/{_LOCKOUT_MAX_ATTEMPTS}"
    )

    # If this is the lockout-triggering attempt, record IP event + notify admin
    if count == _LOCKOUT_MAX_ATTEMPTS and ip_address:
        _record_lockout_event_for_ip(email, ip_address)


def _record_lockout_event_for_ip(email: str, ip_address: str) -> None:
    """Track lockout events per IP. Auto-block if threshold exceeded."""
    from app.config import settings

    now = _now()
    cutoff = now - timedelta(hours=_AUTO_BLOCK_WINDOW_HOURS)
    _lockout_events_by_ip[ip_address] = [
        t for t in _lockout_events_by_ip[ip_address] if t > cutoff
    ]
    _lockout_events_by_ip[ip_address].append(now)
    count = len(_lockout_events_by_ip[ip_address])

    # Log security event to DB + send admin notification
    _log_security_event(
        event_type="login_lockout",
        ip_address=ip_address,
        email=email,
        details=f"Account {email} locked out after {_LOCKOUT_MAX_ATTEMPTS} failures. "
                f"IP has triggered {count} lockout(s) in last {_AUTO_BLOCK_WINDOW_HOURS}h.",
    )

    # Auto-block IP if threshold reached
    if settings.IP_BLOCKLIST_AUTO_BLOCK and count >= _AUTO_BLOCK_THRESHOLD:
        _auto_block_ip(ip_address, email, count)


def _auto_block_ip(ip_address: str, email: str, lockout_count: int) -> None:
    """Automatically block an IP that has triggered too many lockouts."""
    from app.config import settings
    from app.database import SessionLocal
    from app.models import BlockedIP
    from app.middleware.ip_block import add_to_blocklist

    hours = settings.IP_AUTO_BLOCK_DURATION_HOURS
    expires_at = _now() + timedelta(hours=hours)

    db = SessionLocal()
    try:
        existing = db.query(BlockedIP).filter(BlockedIP.ip_address == ip_address).first()
        if not existing:
            block = BlockedIP(
                ip_address=ip_address,
                reason=f"Auto-blocked: {lockout_count} account lockouts in 1 hour "
                       f"(targeting {email} and possibly others)",
                is_auto_blocked=True,
                expires_at=expires_at,
            )
            db.add(block)
            db.commit()
            add_to_blocklist(ip_address, expires_at)
            logger.warning(f"[Security] AUTO-BLOCKED IP {ip_address} for {hours}h")

            _log_security_event(
                event_type="auto_block_ip",
                ip_address=ip_address,
                email=email,
                details=f"IP auto-blocked for {hours}h after {lockout_count} lockout events.",
                notify_admin=True,
            )
    except Exception as e:
        logger.error(f"[Security] Failed to auto-block {ip_address}: {e}")
        db.rollback()
    finally:
        db.close()


def clear_failed_logins(email: str) -> None:
    """Clear failed login counter after successful login."""
    email = email.lower().strip()
    if email in _failed_login_attempts:
        del _failed_login_attempts[email]


def _log_security_event(
    event_type: str,
    details: str,
    ip_address: Optional[str] = None,
    email: Optional[str] = None,
    notify_admin: bool = True,
) -> None:
    """Log a security event to the database and optionally notify admin."""
    from app.database import SessionLocal
    from app.models import SecurityEvent

    db = SessionLocal()
    try:
        event = SecurityEvent(
            event_type=event_type,
            ip_address=ip_address,
            email=email,
            details=details,
            admin_notified=False,
        )
        db.add(event)
        db.commit()

        if notify_admin:
            # Run in background — don't block request
            import threading
            from app.services.email import send_admin_notification
            t = threading.Thread(
                target=send_admin_notification,
                args=(event_type, details, ip_address, email),
                daemon=True,
            )
            t.start()
            event.admin_notified = True
            db.commit()

    except Exception as e:
        logger.error(f"[Security] Failed to log event {event_type}: {e}")
        db.rollback()
    finally:
        db.close()
