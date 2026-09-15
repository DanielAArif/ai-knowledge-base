from __future__ import annotations

import asyncio
import json
import logging
import os
import threading

import redis

from .manager import manager
from .publisher import DOCUMENT_STATUS_CHANNEL

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://redis:6379/0",
)


_event_loop: asyncio.AbstractEventLoop | None = None
_subscriber_thread: threading.Thread | None = None


def _listen_for_events() -> None:
    client = redis.Redis.from_url(
        REDIS_URL,
        decode_responses=True,
    )

    pubsub = client.pubsub()

    pubsub.subscribe(
        DOCUMENT_STATUS_CHANNEL
    )

    logger.info(
        "[Redis] Subscriber started: channel=%s",
        DOCUMENT_STATUS_CHANNEL,
    )

    try:
        for message in pubsub.listen():
            if message["type"] != "message":
                continue

            try:
                event = json.loads(
                    message["data"]
                )

                logger.info(
                    "[Redis] Event received: %s",
                    event,
                )

                if _event_loop is None:
                    logger.warning(
                        "[Redis] Event loop belum tersedia."
                    )
                    continue

                asyncio.run_coroutine_threadsafe(
                    manager.send_to_document(
                        document_id=int(
                            event["document_id"]
                        ),
                        message=event,
                    ),
                    _event_loop,
                )

            except Exception:
                logger.exception(
                    "[Redis] Gagal memproses event."
                )

    except Exception:
        logger.exception(
            "[Redis] Subscriber berhenti."
        )

    finally:
        try:
            pubsub.close()
            client.close()
        except Exception:
            pass


def start_redis_subscriber(
    loop: asyncio.AbstractEventLoop,
) -> None:
    global _event_loop
    global _subscriber_thread

    _event_loop = loop

    if (
        _subscriber_thread is not None
        and _subscriber_thread.is_alive()
    ):
        logger.warning(
            "[Redis] Subscriber sudah berjalan."
        )
        return

    _subscriber_thread = threading.Thread(
        target=_listen_for_events,
        name="redis-document-subscriber",
        daemon=True,
    )

    _subscriber_thread.start()

    logger.info(
        "[Redis] Background subscriber started."
    )