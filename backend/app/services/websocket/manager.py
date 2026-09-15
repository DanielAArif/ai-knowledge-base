from __future__ import annotations

import logging
from collections import defaultdict

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Mengelola koneksi WebSocket berdasarkan document_id.

    Satu dokumen dapat dipantau oleh beberapa client,
    sehingga digunakan set untuk menyimpan koneksi aktif.
    """

    def __init__(self):
        self.active_connections: dict[int, set[WebSocket]] = (
            defaultdict(set)
        )

    async def connect(
        self,
        document_id: int,
        websocket: WebSocket,
    ) -> None:
        await websocket.accept()

        self.active_connections[document_id].add(
            websocket
        )

        logger.info(
            "[WebSocket] Client connected: document_id=%s",
            document_id,
        )

    def disconnect(
        self,
        document_id: int,
        websocket: WebSocket,
    ) -> None:
        connections = self.active_connections.get(
            document_id
        )

        if not connections:
            return

        connections.discard(websocket)

        if not connections:
            self.active_connections.pop(
                document_id,
                None,
            )

        logger.info(
            "[WebSocket] Client disconnected: document_id=%s",
            document_id,
        )

    async def send_to_document(
        self,
        document_id: int,
        message: dict,
    ) -> None:
        connections = self.active_connections.get(
            document_id
        )

        if not connections:
            return

        disconnected = []

        for websocket in connections:
            try:
                await websocket.send_json(message)

            except Exception:
                logger.exception(
                    "[WebSocket] Gagal mengirim event: "
                    "document_id=%s",
                    document_id,
                )

                disconnected.append(websocket)

        for websocket in disconnected:
            connections.discard(websocket)

        if not connections:
            self.active_connections.pop(
                document_id,
                None,
            )


manager = ConnectionManager()