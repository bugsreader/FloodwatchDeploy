from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponseUser(BaseModel):
    id: int
    name: str
    email: str
    role: str

class LoginResponse(BaseModel):
    message: str
    token: str
    user: LoginResponseUser
