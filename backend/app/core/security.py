import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User

# Kunci rahasia JWT
SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_FALLBACK_DEFAULT")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Scheme HTTPBearer untuk integrasi tombol "Authorize" di Swagger UI
security_scheme = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Memeriksa apakah plain password cocok dengan bcrypt hash."""
    # Truncate manual ke 72 byte jika password terlalu panjang (keterbatasan bawaan bcrypt)
    password_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def get_password_hash(password: str) -> str:
    """Mengubah plain text password menjadi bcrypt hash."""
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Membuat JWT Access Token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# =====================================================================
# DEPENDENCY UNTUK MEMVERIFIKASI TOKEN JWT & MENGAMBIL USER YANG LOGIN
# =====================================================================
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Membaca token dari Header 'Authorization: Bearer <TOKEN>'.
    Jika token valid, mengembalikan instance User dari database.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token autentikasi tidak valid atau sudah kadaluwarsa.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Dekode token JWT menggunakan SECRET_KEY
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Ambil user dari PostgreSQL berdasarkan ID (sub)
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user