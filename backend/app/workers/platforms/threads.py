"""Threads upload worker — STUB (mock mode)"""
from app.workers.platforms.base import _mock_upload


def upload(account, file_path: str, metadata: dict) -> dict:
    # TODO: Implement Threads API upload
    return _mock_upload("threads", file_path, metadata)
