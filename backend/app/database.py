from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Mengambil Database URL dari environment variabel, dengan fallback nilai default
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://kb_user:kb_password@postgres:5432/kb_database"
)

# Inisialisasi Engine SQLAlchemy
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Factory Session untuk menangani transaksi query
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- TAMBAHKAN INI: Basis deklaratif untuk semua model database ---
Base = declarative_base()

# Dependency Injection untuk FastAPI (Dependency Session)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()