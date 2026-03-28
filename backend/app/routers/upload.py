"""
AutoPost Hub — File Upload Router
POST /api/upload  — upload file, return metadata
"""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from app.config import settings
from app.deps import get_current_user
from app.models import User

router = APIRouter(prefix="/api/upload", tags=["Upload"])

ALLOWED_TYPES = {
    "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm",
    "image/jpeg", "image/png", "image/webp", "image/gif",
}


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipe file tidak didukung: {file.content_type}. Gunakan MP4, MOV, JPG, PNG, WebP, GIF.",
        )

    # Read file and check size
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)

    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File terlalu besar ({size_mb:.1f}MB). Maksimal {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    # Save file with unique name to prevent collision
    ext = Path(file.filename).suffix if file.filename else ""
    safe_name = f"{uuid.uuid4().hex}{ext}"
    file_path = settings.upload_path / safe_name

    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "file_path": str(file_path),
        "file_name": file.filename,
        "file_size": round(size_mb, 2),
        "file_type": file.content_type,
    }
