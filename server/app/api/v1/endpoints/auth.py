from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core import security
from app.crud import user as crud_user
from app.api.deps import get_current_user
from app.schemas.auth import LoginRequest, LoginResponse, LoginResponseUser
from app.schemas.user import UserOut

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = crud_user.get_user_by_email(db, login_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
        
    is_match = security.verify_password(login_data.password, user.password)
    if not is_match:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
        
    # User's role name
    role_name = user.role.name if user.role else "user"
    
    # Generate JWT token
    token = security.create_access_token(subject=user.id, role=role_name)
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": role_name
        }
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, current_user["id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # Attach role_name dynamically for formatting compatibility
    user.role_name = user.role.name if user.role else None
    return user
