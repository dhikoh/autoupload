"""YouTube upload worker — STUB (mock mode)"""
from app.workers.platforms.base import _mock_upload


def upload(account, file_path: str, metadata: dict) -> dict:
    """Upload video to YouTube. Returns {success, platform_post_id, platform_post_url} or {success, error}."""
    # TODO: Implement YouTube Data API v3 upload
    # - Use account.access_token for OAuth
    # - Upload via resumable upload endpoint
    # - Set title = metadata.get("youtube_title")
    # - Set description = metadata.get("caption")
    return _mock_upload("youtube", file_path, metadata)
