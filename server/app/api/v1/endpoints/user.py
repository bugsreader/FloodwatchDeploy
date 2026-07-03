from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, get_current_admin
from app.crud import user as crud_user
from app.services import user_service
from app.core import security
from app.schemas.user import UserOut, UserUpdate, UserCreateAdmin, UserUpdateAdmin, RoleOut, UserListResponse

router = APIRouter()

@router.get("/myprofile", response_model=UserOut)
def get_my_profile(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, current_user["id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    user.role_name = user.role.name if user.role else None
    return user

@router.put("/myprofile", response_model=UserOut)
def update_my_profile(
    user_in: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated_user = user_service.update_user_profile(db, user_id=current_user["id"], user_in=user_in)
    
    # Return formatted UserOut
    updated_user.role_name = updated_user.role.name if updated_user.role else None
    return updated_user

@router.get("/roles", response_model=list[RoleOut])
def get_roles(db: Session = Depends(get_db), current_admin: dict = Depends(get_current_admin)):
    return crud_user.get_all_roles(db)

@router.get("/", response_model=UserListResponse)
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    users = crud_user.get_users(db, skip=skip, limit=limit)
    total = crud_user.get_users_count(db)
    
    for user in users:
        user.role_name = user.role.name if user.role else None
        
    return {"users": users, "total": total}

@router.post("/", response_model=UserOut)
def create_user(
    user_in: UserCreateAdmin,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    existing_user = crud_user.get_user_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already in use"
        )
        
    password_hash = security.get_password_hash(user_in.password)
    new_user = crud_user.create_user(
        db,
        name=user_in.name,
        email=user_in.email,
        password_hash=password_hash,
        role_id=user_in.role_id
    )
    new_user.role_name = new_user.role.name if new_user.role else None
    return new_user

@router.put("/{user_id}", response_model=UserOut)
def update_user_admin(
    user_id: int,
    user_in: UserUpdateAdmin,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    db_user = crud_user.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if user_in.email and user_in.email != db_user.email:
        existing_user = crud_user.get_user_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already in use"
            )
            
    password_hash = None
    if user_in.password:
        password_hash = security.get_password_hash(user_in.password)
        
    updated_user = crud_user.update_user(
        db,
        db_user=db_user,
        name=user_in.name,
        email=user_in.email,
        password_hash=password_hash,
        role_id=user_in.role_id
    )
    updated_user.role_name = updated_user.role.name if updated_user.role else None
    return updated_user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    if user_id == 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete the main system administrator account."
        )
        
    if user_id == current_admin.get("id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot delete your own account."
        )
        
    db_user = crud_user.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if db_user.role and db_user.role.name == "Admin" and current_admin.get("id") != 1:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the main admin can delete other administrators."
        )

    crud_user.delete_user(db, user_id)
    return {"message": "User deleted successfully"}
