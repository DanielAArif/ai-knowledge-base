import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.routers import (
    auth,
    category,
    document,
    admin_users,
    chat,
    query,
)

from app.database import get_db

from app.services.websocket.subscriber import (
    start_redis_subscriber,
)


# ============================================================
# LOGGING
# ============================================================

logger = logging.getLogger(__name__)


# ============================================================
# APPLICATION LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[LIFESPAN] FastAPI startup dimulai.", flush=True)

    loop = asyncio.get_running_loop()

    print(
        "[LIFESPAN] Memulai Redis subscriber.",
        flush=True,
    )

    start_redis_subscriber(loop)

    print(
        "[LIFESPAN] Redis subscriber sudah dipanggil.",
        flush=True,
    )

    yield

    print(
        "[LIFESPAN] FastAPI shutdown.",
        flush=True,
    )


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AI Knowledge Base API",
    description=(
        "API Service for AI-Powered Enterprise "
        "Knowledge Base & RAG System"
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "Content-Disposition",
        "Content-Type",
    ],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    auth.router
)

app.include_router(
    category.router
)

app.include_router(
    document.router
)

app.include_router(
    chat.router
)

app.include_router(
    admin_users.router
)

app.include_router(
    query.router
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def read_root():
    return {
        "message": "AI Knowledge Base API is running!"
    }


# ============================================================
# HEALTH CHECK DATABASE
# ============================================================

@app.get(
    "/health/db"
)
def health_check_db(
    db: Session = Depends(get_db),
):
    """
    Health check untuk koneksi PostgreSQL.

    Selain mengecek koneksi database,
    endpoint ini juga mengembalikan daftar
    tabel yang tersedia pada schema public.
    """

    try:
        # ----------------------------------------------------
        # Test koneksi
        # ----------------------------------------------------

        result = db.execute(
            text("SELECT 1")
        ).scalar()

        # ----------------------------------------------------
        # Ambil daftar tabel
        # ----------------------------------------------------

        tables_query = db.execute(
            text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
            """)
        ).fetchall()

        tables = [
            row[0]
            for row in tables_query
        ]

        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        return {
            "status": "healthy",
            "database_connection": "successful",
            "query_result": result,
            "existing_tables": tables,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                "Database connection failed: "
                f"{str(e)}"
            ),
        )