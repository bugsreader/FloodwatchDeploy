from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: str

class UserUpdate(BaseModel):
    name: str
    email: str
    password: Optional[str] = Field(None, min_length=6)

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role_id: Optional[int] = None
    role_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RoleOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class UserCreateAdmin(UserBase):
    password: str = Field(..., min_length=6)
    role_id: int

class UserUpdateAdmin(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    role_id: Optional[int] = None

class UserListResponse(BaseModel):
    users: list[UserOut]
    total: int
