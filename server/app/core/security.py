import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt, JWTError
from app.core.config import settings

ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as e:
        print(f"[Security] Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def parse_duration(duration_str: str) -> timedelta:
    """
    Parses a Node.js-style expiration string (like '1h', '2d', '30m') to a timedelta.
    Defaults to 1 hour if parsing fails.
    """
    try:
        if duration_str.endswith("h"):
            return timedelta(hours=int(duration_str[:-1]))
        elif duration_str.endswith("d"):
            return timedelta(days=int(duration_str[:-1]))
        elif duration_str.endswith("m"):
            return timedelta(minutes=int(duration_str[:-1]))
        elif duration_str.endswith("s"):
            return timedelta(seconds=int(duration_str[:-1]))
        else:
            return timedelta(hours=int(duration_str))
    except ValueError:
        return timedelta(hours=1)

def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expires_in = parse_duration(settings.JWT_EXPIRES_IN)
        expire = datetime.utcnow() + expires_in
        
    to_encode = {
        "exp": expire,
        "id": int(subject) if str(subject).isdigit() else subject,
        "role": role
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        decoded_token = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        return decoded_token
    except JWTError:
        return None
