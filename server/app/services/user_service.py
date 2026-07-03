import re
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core import security
from app.crud import user as crud_user
from app.models.user import User
from app.schemas.user import UserUpdate

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

def validate_profile_update(db: Session, user_id: int, user_in: UserUpdate) -> None:
    if not user_in.name or not user_in.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name and email are required"
        )
    
    if not EMAIL_REGEX.match(user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
        
    existing_user = crud_user.get_user_by_email(db, user_in.email)
    if existing_user and existing_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already in use"
        )

def update_user_profile(db: Session, user_id: int, user_in: UserUpdate) -> User:
    db_user = crud_user.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    validate_profile_update(db, user_id, user_in)
    
    password_hash = None
    if user_in.password:
        if len(user_in.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters"
            )
        password_hash = security.get_password_hash(user_in.password)
        
    return crud_user.update_user(
        db,
        db_user=db_user,
        name=user_in.name,
        email=user_in.email,
        password_hash=password_hash
    )
