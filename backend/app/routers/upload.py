"""
AutoPost Hub — File Upload Router
POST /api/upload — upload file, return safe file token (not full disk path)

SECURITY:
  - Validates file type by Content-Type AND magic bytes (file signature)
  - Returns file_token (filename only) instead of full server path
  - posts.py reconstructs the real path from token + UPLOAD_DIR
  - Max file size enforced (default 500MB)
  - Rate limited: 20 uploads/hour per IP
"""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, status

from app.config import settings
from app.deps import get_current_user
from app.models import User
from app.middleware.rate_limit import limiter

router = APIRouter(prefix="/api/upload", tags=["Upload"])

ALLOWED_TYPES = {
    "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm",
    "image/jpeg", "image/png", "image/webp", "image/gif",
}

# Magic bytes (file signatures) for each content type
# Format: (content_type, [list of valid byte signatures as tuples])
MAGIC_BYTES: dict[str, list[bytes]] = {
    "video/mp4":        [b"\x00\x00\x00\x18ftyp", b"\x00\x00\x00\x20ftyp", b"\x00\x00\x00\x1cftyp"],
    "video/quicktime":  [b"\x00\x00\x00\x14ftyp", b"ftypmov "],
    "video/x-msvideo":  [b"RIFF"],
    "video/webm":       [b"\x1a\x45\xdf\xa3"],
    "image/jpeg":       [b"\xff\xd8\xff"],
    "image/png":        [b"\x89PNG\r\n\x1a\n"],
    "image/webp":       [b"RIFF"],  # RIFF....WEBP
    "image/gif":        [b"GIF87a", b"GIF89a"],
}

# For small/ambiguous signatures we check both magic and content-type
# WebP is RIFF + "WEBP" at offset 8, special case handled below


def _validate_magic_bytes(content_type: str, header: bytes) -> bool:
    """
    Validate that file content matches expected magic bytes for its content type.
    Returns True if valid, False if mismatch (potential spoofed/malicious file).
    """
    signatures = MAGIC_BYTES.get(content_type, [])
    if not signatures:
        return True  # Unknown type — still let Content-Type guard handle it

    for sig in signatures:
        if header[:len(sig)] == sig:
            # Extra check for WebP: bytes 8-12 must be "WEBP"
            if content_type == "image/webp":
                return len(header) >= 12 and header[8:12] == b"WEBP"
            return True

    return False


@router.post("")
@limiter.limit("20/hour")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """
    Upload a content file. Returns a file_token for use in POST /api/posts.
    The server-side path is NEVER returned to the client.
    """
    # 1. Content-Type whitelist
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipe file tidak didukung: {file.content_type}. Gunakan MP4, MOV, AVI, WebM, JPG, PNG, WebP, GIF.",
        )

    # 2. Read file into memory
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)

    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File terlalu besar ({size_mb:.1f}MB). Maksimal {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    # 3. Magic bytes validation — prevents Content-Type spoofing
    header = content[:16]
    if not _validate_magic_bytes(file.content_type, header):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File tidak valid: konten file tidak sesuai dengan tipe yang diklaim.",
        )

    # 4. Save file with UUID name (no original filename for security)
    ext = Path(file.filename).suffix.lower() if file.filename else ""
    safe_name = f"{uuid.uuid4().hex}{ext}"
    file_path = settings.upload_path / safe_name

    with open(file_path, "wb") as f:
        f.write(content)

    # 5. Return token (filename only), NOT the full server path
    return {
        "file_token": safe_name,          # Safe — just the filename, no path info
        "file_name": file.filename,       # Original name for display
        "file_size": round(size_mb, 2),
        "file_type": file.content_type,
    }
