"""Instagram upload worker — STUB (mock mode)"""
from app.workers.platforms.base import _mock_upload


def upload(account, file_path: str, metadata: dict) -> dict:
    # TODO: Implement Instagram Graph API upload
    return _mock_upload("instagram", file_path, metadata)
