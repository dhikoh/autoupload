"""
AutoPost Hub — Security Router (Admin Only)
GET    /api/admin/security/blocked-ips       — list all blocked IPs
POST   /api/admin/security/blocked-ips       — manually block an IP
DELETE /api/admin/security/blocked-ips/{id}  — unblock an IP
GET    /api/admin/security/events            — view security audit log
DELETE /api/admin/security/events            — clear old events
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.deps import get_db, require_admin
from app.models import User, BlockedIP, SecurityEvent
from app.middleware.ip_block import add_to_blocklist, remove_from_blocklist, refresh_ip_cache

router = APIRouter(prefix="/api/admin/security", tags=["Admin Security"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class BlockIPRequest(BaseModel):
    ip_address: str
    reason: Optional[str] = None
    duration_hours: Optional[int] = None  # None = permanent


class BlockedIPResponse(BaseModel):
    id: str
    ip_address: str
    reason: Optional[str]
    is_auto_blocked: bool
    blocked_at: datetime
    expires_at: Optional[datetime]
    blocked_by_name: Optional[str] = None

    model_config = {"from_attributes": True}


class SecurityEventResponse(BaseModel):
    id: str
    event_type: str
    ip_address: Optional[str]
    email: Optional[str]
    details: Optional[str]
    admin_notified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Blocked IPs ────────────────────────────────────────────────────────────────

@router.get("/blocked-ips")
def list_blocked_ips(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all currently active blocked IPs."""
    now = datetime.now(timezone.utc)
    blocks = db.query(BlockedIP).filter(
        (BlockedIP.expires_at.is_(None)) | (BlockedIP.expires_at > now)
    ).order_by(BlockedIP.blocked_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": b.id,
            "ip_address": b.ip_address,
            "reason": b.reason,
            "is_auto_blocked": b.is_auto_blocked,
            "blocked_at": b.blocked_at,
            "expires_at": b.expires_at,
            "blocked_by_name": b.blocker.name if b.blocker else "System",
        }
        for b in blocks
    ]


@router.post("/blocked-ips", status_code=201)
def block_ip(
    req: BlockIPRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Manually block an IP address.
    duration_hours=None → permanent block.
    duration_hours=24   → block for 24 hours.
    """
    # Validate IP format (basic)
    ip = req.ip_address.strip()
    if not ip or len(ip) > 45:
        raise HTTPException(400, "Format IP tidak valid")

    existing = db.query(BlockedIP).filter(BlockedIP.ip_address == ip).first()
    if existing:
        # Update existing block
        existing.reason = req.reason or existing.reason
        existing.expires_at = (
            datetime.now(timezone.utc) + timedelta(hours=req.duration_hours)
            if req.duration_hours else None
        )
        existing.blocked_by = admin.id
        db.commit()
        add_to_blocklist(ip, existing.expires_at)
        return {"message": f"Block untuk {ip} diperbarui", "id": existing.id}

    expires_at = (
        datetime.now(timezone.utc) + timedelta(hours=req.duration_hours)
        if req.duration_hours else None
    )
    block = BlockedIP(
        ip_address=ip,
        reason=req.reason or "Blokir manual oleh admin",
        is_auto_blocked=False,
        expires_at=expires_at,
        blocked_by=admin.id,
    )
    db.add(block)

    # Log security event
    event = SecurityEvent(
        event_type="manual_block_ip",
        ip_address=ip,
        details=f"Manually blocked by {admin.email}. Reason: {req.reason or 'No reason given'}. "
                f"Duration: {'permanent' if not req.duration_hours else f'{req.duration_hours}h'}",
        admin_notified=True,
    )
    db.add(event)
    db.commit()

    # Update in-memory cache immediately
    add_to_blocklist(ip, expires_at)

    # Notify admin (other admins if configured)
    from app.services.email import send_admin_notification
    from app.config import settings
    import threading
    threading.Thread(
        target=send_admin_notification,
        args=("manual_block_ip",
              f"Admin {admin.email} blocked IP {ip}. Reason: {req.reason or 'N/A'}",
              ip, None),
        daemon=True,
    ).start()

    return {"message": f"IP {ip} berhasil diblokir", "id": block.id}


@router.delete("/blocked-ips/{block_id}", status_code=204)
def unblock_ip(
    block_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Remove an IP from the blocklist."""
    block = db.query(BlockedIP).filter(BlockedIP.id == block_id).first()
    if not block:
        raise HTTPException(404, "Block tidak ditemukan")

    ip = block.ip_address
    db.delete(block)

    event = SecurityEvent(
        event_type="unblock_ip",
        ip_address=ip,
        details=f"IP {ip} unblocked by {admin.email}",
        admin_notified=False,
    )
    db.add(event)
    db.commit()

    remove_from_blocklist(ip)


# ── Security Events ────────────────────────────────────────────────────────────

@router.get("/events")
def list_security_events(
    event_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """View security audit log. Filterable by event_type."""
    query = db.query(SecurityEvent)
    if event_type:
        query = query.filter(SecurityEvent.event_type == event_type)
    events = query.order_by(SecurityEvent.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "ip_address": e.ip_address,
            "email": e.email,
            "details": e.details,
            "admin_notified": e.admin_notified,
            "created_at": e.created_at,
        }
        for e in events
    ]


@router.delete("/events", status_code=204)
def clear_old_events(
    days_old: int = Query(30, ge=1, description="Delete events older than N days"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete security events older than N days (default 30)."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_old)
    deleted = db.query(SecurityEvent).filter(SecurityEvent.created_at < cutoff).delete()
    db.commit()
    return {"deleted": deleted}


@router.post("/test-email")
def test_admin_notification(
    admin: User = Depends(require_admin),
):
    """Send a test security notification email to ADMIN_NOTIFICATION_EMAIL."""
    from app.config import settings
    from app.services.email import send_admin_notification

    if not settings.ADMIN_NOTIFICATION_EMAIL:
        raise HTTPException(400, "ADMIN_NOTIFICATION_EMAIL belum dikonfigurasi di env")

    sent = send_admin_notification(
        event_type="manual_block_ip",
        details=f"Test notification dikirim oleh {admin.email}. SMTP berfungsi normal.",
        ip_address="127.0.0.1",
        email=admin.email,
    )

    if sent:
        return {"message": f"Test email dikirim ke {settings.ADMIN_NOTIFICATION_EMAIL}"}
    else:
        raise HTTPException(500, "Gagal mengirim email. Cek konfigurasi SMTP di env.")
