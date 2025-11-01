from datetime import datetime, timedelta
from typing import Optional

import jwt

from core.config import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    """
    프로토타입용: 비밀번호를 평문으로 저장합니다.

    Args:
        password: 평문 비밀번호

    Returns:
        평문 비밀번호 (해싱 없음)
    """
    return password


def verify_password(plain_password: str, stored_password: str) -> bool:
    """
    프로토타입용: 평문 비밀번호를 비교합니다.

    Args:
        plain_password: 입력된 비밀번호
        stored_password: 저장된 비밀번호

    Returns:
        비밀번호가 일치하면 True, 아니면 False
    """
    return plain_password == stored_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT 액세스 토큰을 생성합니다.

    Args:
        data: 토큰에 포함할 데이터 (예: {"sub": "username"})
        expires_delta: 토큰 만료 시간 (기본값: 설정에서 가져옴)

    Returns:
        생성된 JWT 토큰 문자열
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRATION_DAYS)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """
    JWT 토큰을 검증하고 페이로드를 반환합니다.

    Args:
        token: JWT 토큰 문자열

    Returns:
        토큰이 유효하면 페이로드 딕셔너리, 아니면 None
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
