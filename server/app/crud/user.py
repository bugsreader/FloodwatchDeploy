from sqlalchemy.orm import Session
from typing import Optional
from app.models.user import User
from app.models.role import Role

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_role_by_name(db: Session, name: str) -> Optional[Role]:
    return db.query(Role).filter(Role.name == name).first()

def get_role_by_id(db: Session, role_id: int) -> Optional[Role]:
    return db.query(Role).filter(Role.id == role_id).first()

def get_all_roles(db: Session) -> list[Role]:
    return db.query(Role).all()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    return db.query(User).offset(skip).limit(limit).all()

def get_users_count(db: Session) -> int:
    return db.query(User).count()

def create_user(db: Session, *, name: str, email: str, password_hash: str, role_id: int) -> User:
    db_user = User(
        name=name,
        email=email,
        password=password_hash,
        role_id=role_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, *, db_user: User, name: Optional[str] = None, email: Optional[str] = None, password_hash: Optional[str] = None, role_id: Optional[int] = None) -> User:
    if name:
        db_user.name = name
    if email:
        db_user.email = email
    if password_hash:
        db_user.password = password_hash
    if role_id is not None:
        db_user.role_id = role_id
        
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
        return True
    return False
