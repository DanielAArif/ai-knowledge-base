from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserAdminResponse, UserAdminUpdate
from app.core.security import get_current_admin_user

router = APIRouter(
    prefix="/admin/users",
    tags=["Admin - User Management"]
)

# 1. Get All Users (Dengan Pagination & Fitur Search)
@router.get("/", response_model=List[UserAdminResponse])
def get_all_users(
    skip: int = Query(0, ge=0, description="Jumlah data yang dilewati"),
    limit: int = Query(20, ge=1, le=100, description="Maksimal data yang diambil"),
    search: Optional[str] = Query(None, description="Cari nama atau email"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) | (User.full_name.ilike(f"%{search}%"))
        )
        
    return query.offset(skip).limit(limit).all()


# 2. Get User Detail by ID
@router.get("/{user_id}", response_model=UserAdminResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan."
        )
    return user


# 3. Update User Data / Role (Ubah Nama, Role, dll)
@router.put("/{user_id}", response_model=UserAdminResponse)
def update_user_by_admin(
    user_id: int,
    user_in: UserAdminUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan."
        )

    # Mencegah admin penurunan role akunnya sendiri
    if user.id == admin.id and user_in.role is not None and user_in.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Anda tidak dapat mengubah role Admin Anda sendiri menjadi non-admin."
        )

    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.role is not None:
        user.role = user_in.role

    db.commit()
    db.refresh(user)
    return user


# 4. Delete User Account
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_by_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan."
        )

    # Mencegah admin menghapus akunnya sendiri
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Anda tidak dapat menghapus akun Admin Anda sendiri."
        )

    db.delete(user)
    db.commit()
    return None