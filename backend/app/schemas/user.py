from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from app.models.user import UserRole


class UserBase(BaseModel):
  email: EmailStr
  full_name: Optional[str] = None
  role: Optional[UserRole] = UserRole.USER

  @field_validator("role", mode="before")
  @classmethod
  def normalize_role(cls, v):
    if isinstance(v, str):
      return v.lower()
    return v


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

  @field_validator("role", mode="before")
  @classmethod
  def normalize_role(cls, v):
    if isinstance(v, str):
      return v.lower()
    return v


class UserAdminResponse(UserBase):
  id: int
  created_at: datetime

  model_config = {"from_attributes": True}