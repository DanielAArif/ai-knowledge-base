from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[UserRole] = UserRole.USER

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

    # ==========================================
# SCHEMA ADMIN USER MANAGEMENT
# ==========================================

class UserAdminUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    # Jika di DB ada field is_active, kamu bisa un-comment baris ini:
    # is_active: Optional[bool] = None

class UserAdminResponse(UserBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}