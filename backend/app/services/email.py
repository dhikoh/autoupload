"""
AutoPost Hub — Email Service (built-in smtplib, zero extra dependencies)

Handles:
  1. Email verification on registration
  2. Admin security notifications (brute force, auto-block, etc.)

Configuration (in .env):
  SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD
  SMTP_FROM_EMAIL, SMTP_FROM_NAME, SMTP_USE_TLS
  ADMIN_NOTIFICATION_EMAIL

Usage:
  from app.services.email import send_verification_email, send_admin_notification
"""

import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


# ── Core send function ─────────────────────────────────────────────────────────

def _send_email(to_email: str, subject: str, html_body: str, text_body: str = "") -> bool:
    """
    Send an email using SMTP. Returns True on success, False on failure.
    Silently logs errors so email failures never crash the main flow.
    """
    if not settings.smtp_configured:
        logger.warning(f"[Email] SMTP not configured — cannot send email to {to_email}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        # Attach plain text fallback first, then HTML (email clients prefer last)
        if text_body:
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        if settings.SMTP_USE_TLS:
            # STARTTLS mode (port 587)
            context = ssl.create_default_context()
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.ehlo()
                server.starttls(context=context)
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        else:
            # SSL mode (port 465)
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=context, timeout=10) as server:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())

        logger.info(f"[Email] Sent '{subject}' to {to_email}")
        return True

    except smtplib.SMTPException as e:
        logger.error(f"[Email] SMTP error sending to {to_email}: {e}")
        return False
    except Exception as e:
        logger.error(f"[Email] Unexpected error sending to {to_email}: {e}")
        return False


# ── Email Templates ────────────────────────────────────────────────────────────

def _base_html(title: str, content: str) -> str:
    """Minimal, clean HTML email template."""
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#1a1a2e;border-radius:12px;overflow:hidden;border:1px solid rgba(124,58,237,0.2);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:28px 36px;">
            <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:-0.5px;">AutoPost Hub</h1>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:32px 36px;color:#e2e8f0;font-size:15px;line-height:1.7;">
            {content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;color:#64748b;font-size:12px;">
              Email ini dikirim otomatis dari AutoPost Hub. Jangan balas email ini.<br>
              &copy; 2024 AutoPost Hub. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


# ── Public API ─────────────────────────────────────────────────────────────────

def send_verification_email(to_email: str, name: str, token: str) -> bool:
    """Send email verification link to newly registered user."""
    verify_url = f"{settings.BASE_URL}/verify-email?token={token}"

    content = f"""
    <h2 style="margin:0 0 16px;color:#a78bfa;font-size:20px;">Selamat datang, {name}! 👋</h2>
    <p>Terima kasih telah mendaftar di AutoPost Hub. Satu langkah lagi untuk memulai!</p>
    <p>Klik tombol di bawah untuk memverifikasi alamat email Anda:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{verify_url}"
         style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;
                text-decoration:none;padding:14px 32px;border-radius:8px;
                font-size:15px;font-weight:700;display:inline-block;">
        ✓ Verifikasi Email Saya
      </a>
    </div>
    <p style="font-size:13px;color:#94a3b8;">
      Link ini berlaku selama <strong>24 jam</strong>.<br>
      Jika Anda tidak mendaftar di AutoPost Hub, abaikan email ini.
    </p>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:20px 0;">
    <p style="font-size:12px;color:#64748b;">
      Atau copy link ini ke browser:<br>
      <span style="color:#a78bfa;word-break:break-all;">{verify_url}</span>
    </p>
    """

    return _send_email(
        to_email=to_email,
        subject="Verifikasi Email Anda — AutoPost Hub",
        html_body=_base_html("Verifikasi Email", content),
        text_body=f"Verifikasi email Anda: {verify_url}",
    )


def send_admin_notification(
    event_type: str,
    details: str,
    ip_address: Optional[str] = None,
    email: Optional[str] = None,
) -> bool:
    """
    Send security alert to admin (ADMIN_NOTIFICATION_EMAIL).
    Called when: account lockout, IP auto-block, rate limit abuse detected.
    """
    if not settings.ADMIN_NOTIFICATION_EMAIL:
        return False

    type_labels = {
        "login_lockout": ("🔐 Brute Force Detected", "#ef4444"),
        "auto_block_ip": ("🚫 IP Auto-Blocked", "#f97316"),
        "manual_block_ip": ("🛡️ IP Manually Blocked", "#3b82f6"),
        "rate_limit_exceeded": ("⚡ Rate Limit Exceeded", "#eab308"),
        "register_spam": ("📋 Registration Spam", "#8b5cf6"),
    }

    label, color = type_labels.get(event_type, ("🔔 Security Alert", "#94a3b8"))

    content = f"""
    <h2 style="margin:0 0 20px;color:{color};font-size:20px;">{label}</h2>
    <table style="width:100%;border-collapse:collapse;">
      {'<tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;width:120px;">IP Address</td><td style="color:#e2e8f0;font-size:14px;">' + (ip_address or '—') + '</td></tr>' if ip_address else ''}
      {'<tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;width:120px;">Email</td><td style="color:#e2e8f0;font-size:14px;">' + (email or '—') + '</td></tr>' if email else ''}
      <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;">Event Type</td><td style="color:#e2e8f0;font-size:14px;">{event_type}</td></tr>
      <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;">Detail</td><td style="color:#e2e8f0;font-size:14px;">{details}</td></tr>
    </table>
    <div style="margin-top:24px;padding:12px 16px;background:rgba(0,0,0,0.3);border-radius:6px;border-left:3px solid {color};">
      <p style="margin:0;font-size:13px;color:#94a3b8;">
        Login ke admin panel untuk mengelola IP blocklist:
        <a href="{settings.BASE_URL}/admin/security" style="color:#a78bfa;">{settings.BASE_URL}/admin/security</a>
      </p>
    </div>
    """

    return _send_email(
        to_email=settings.ADMIN_NOTIFICATION_EMAIL,
        subject=f"[AutoPost Hub] {label}",
        html_body=_base_html("Security Alert", content),
        text_body=f"Security Alert: {event_type}\nIP: {ip_address or '—'}\nEmail: {email or '—'}\nDetail: {details}",
    )


def send_password_reset_email(to_email: str, name: str, token: str) -> bool:
    """Send password reset link. (Future feature placeholder)"""
    reset_url = f"{settings.BASE_URL}/reset-password?token={token}"

    content = f"""
    <h2 style="margin:0 0 16px;color:#a78bfa;">Reset Password</h2>
    <p>Halo {name},</p>
    <p>Kami menerima permintaan reset password untuk akun Anda.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{reset_url}"
         style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;
                text-decoration:none;padding:14px 32px;border-radius:8px;
                font-size:15px;font-weight:700;display:inline-block;">
        Reset Password Saya
      </a>
    </div>
    <p style="font-size:13px;color:#94a3b8;">
      Link berlaku <strong>1 jam</strong>. Jika bukan Anda yang meminta, abaikan email ini.
    </p>
    """

    return _send_email(
        to_email=to_email,
        subject="Reset Password — AutoPost Hub",
        html_body=_base_html("Reset Password", content),
        text_body=f"Reset password Anda: {reset_url}",
    )
