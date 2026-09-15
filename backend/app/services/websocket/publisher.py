from __future__ import annotations

import json
import logging
import os

import redis

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://redis:6379/0",
)

DOCUMENT_STATUS_CHANNEL = "document:indexing"


def get_redis_client() -> redis.Redis:
    return redis.Redis.from_url(
        REDIS_URL,
        decode_responses=True,
    )


def publish_document_status(
    document_id: int,
    status: str,
    message: str,
    progress: int | None = None,
) -> None:
    """
    Mengirim event status indexing ke Redis Pub/Sub.

    Event nantinya diterima oleh FastAPI WebSocket listener.
    """

    event = {
        "type": "document_indexing",
        "document_id": document_id,
        "status": status,
        "message": message,
        "progress": progress,
    }

    try:
        client = get_redis_client()

        client.publish(
            DOCUMENT_STATUS_CHANNEL,
            json.dumps(event),
        )

        logger.info(
            "[Redis] Event published: "
            "document_id=%s, status=%s",
            document_id,
            status,
        )

    except Exception:
        logger.exception(
            "[Redis] Gagal publish event: "
            "document_id=%s, status=%s",
            document_id,
            status,
        )