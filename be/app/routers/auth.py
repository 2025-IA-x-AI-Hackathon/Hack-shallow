from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.schemas import UserSignupRequest, UserLoginRequest, TokenResponse, UserRead
from app.utils.auth import hash_password, verify_password, create_access_token
from db.database import get_session
from db.models import User

router = APIRouter(prefix="/v1/auth", tags=["인증"])


@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def signup(
    request: UserSignupRequest,
    db: AsyncSession = Depends(get_session)
):
    """
    새로운 사용자를 등록합니다.

    Args:
        request: 회원가입 요청 (username, password)
        db: 데이터베이스 세션

    Returns:
        생성된 사용자 정보

    Raises:
        HTTPException: 사용자명이 이미 존재하는 경우
    """
    # 사용자명 중복 체크
    result = await db.execute(select(User).where(User.username == request.username))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 존재하는 사용자명입니다"
        )

    # 비밀번호 해싱
    hashed_password = hash_password(request.password)

    # 새 사용자 생성
    new_user = User(
        username=request.username,
        hashed_password=hashed_password
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post("/login", response_model=TokenResponse)
async def login(
    request: UserLoginRequest,
    db: AsyncSession = Depends(get_session)
):
    """
    사용자 로그인 후 JWT 토큰을 발급합니다.

    Args:
        request: 로그인 요청 (username, password)
        db: 데이터베이스 세션

    Returns:
        JWT 액세스 토큰

    Raises:
        HTTPException: 사용자명 또는 비밀번호가 올바르지 않은 경우
    """
    # 사용자 조회
    result = await db.execute(select(User).where(User.username == request.username))
    user = result.scalar_one_or_none()

    # 사용자가 없거나 비밀번호가 일치하지 않으면 에러
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자명 또는 비밀번호가 올바르지 않습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # JWT 토큰 생성 (사용자 ID를 subject로 사용)
    access_token = create_access_token(data={"sub": user.id})

    return TokenResponse(access_token=access_token, token_type="bearer")
