"""
AutoPost Hub — Platform Worker Base
Each platform module implements upload(). Currently stubs returning mock success.
Real API integration will be added per-platform when API credentials are provided.
"""

import time
import random


def _mock_upload(platform: str, file_path: str, metadata: dict) -> dict:
    """Simulate platform upload with a small delay. Returns mock result."""
    time.sleep(random.uniform(0.5, 2.0))  # Simulate network latency

    # 95% success rate in mock mode
    if random.random() < 0.95:
        return {
            "success": True,
            "platform_post_id": f"mock_{platform}_{random.randint(100000, 999999)}",
            "platform_post_url": f"https://{platform}.com/post/mock_{random.randint(100000, 999999)}",
        }
    else:
        return {
            "success": False,
            "error": f"[MOCK] Simulated upload failure for {platform}",
        }
