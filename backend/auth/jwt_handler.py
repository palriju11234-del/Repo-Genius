"""
JWT Handler — sign and verify session tokens.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from backend.config import settings

ALGORITHM = "HS256"
EXPIRE_DAYS = 7


def create_token(payload: dict[str, Any]) -> str:
    """Create a signed JWT with a 7-day expiry."""
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + timedelta(days=EXPIRE_DAYS)
    data["iat"] = datetime.now(timezone.utc)
    return jwt.encode(data, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any] | None:
    """Decode and verify a JWT. Returns None on any failure."""
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError:
        return None
