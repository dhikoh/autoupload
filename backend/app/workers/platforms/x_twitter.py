"""X (Twitter) upload worker — STUB (mock mode)"""
from app.workers.platforms.base import _mock_upload


def upload(account, file_path: str, metadata: dict) -> dict:
    # TODO: Implement X API v2 media upload + tweet
    return _mock_upload("x", file_path, metadata)
