from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.routers import auth, category, document, admin_users, chat
from app.routers import query

# Import fungsi get_db dari modul database yang baru dibuat
from app.database import get_db

app = FastAPI(
    title="AI Knowledge Base API",
    description="API Service for AI-Powered Enterprise Knowledge Base & RAG System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(category.router)
app.include_router(document.router)
app.include_router(chat.router)
app.include_router(admin_users.router)
app.include_router(query.router)

@app.get("/")
def read_root():
    return {"message": "AI Knowledge Base API is running!"}

# Endpoint Health Check khusus untuk Database PostgreSQL
@app.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    try:
        # Jalankan query sederhana ke PostgreSQL
        result = db.execute(text("SELECT 1")).scalar()
        
        # Ambil daftar nama tabel yang sudah dibuat oleh Alembic
        tables_query = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)).fetchall()
        
        tables = [row[0] for row in tables_query]

        return {
            "status": "healthy",
            "database_connection": "successful",
            "query_result": result,
            "existing_tables": tables
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Database connection failed: {str(e)}"
        )