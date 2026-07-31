from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AI Knowledge Base API",
    version="1.0.0",
    description="Backend API untuk Manajemen Dokumen dan RAG AI"
)

# Konfigurasi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Disesuaikan nanti dengan origin frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Knowledge Base API", "status": "running"}

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy"}