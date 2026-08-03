from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models import UserRole

# ------------------- USER SCHEMAS -------------------

# Skema Input Registrasi
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: Optional[UserRole] = UserRole.USER

# Skema Response Data User (Tanpa password)
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

# ------------------- AUTH SCHEMAS -------------------

# Skema Input Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Skema Response Token JWT
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse