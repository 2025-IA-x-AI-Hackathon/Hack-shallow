from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import UserCreate, UserRead, UserUpdate
from app.dependencies import get_current_user
from db.database import get_session
from db.models import User


router = APIRouter(prefix="/v1", tags=["users"])


@router.post("/users", response_model=UserRead, status_code=201)
async def create_user(
    body: UserCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> UserRead:
    """이 엔드포인트는 더 이상 사용되지 않습니다. /v1/auth/signup을 사용하세요."""
    raise HTTPException(status_code=410, detail="이 엔드포인트는 더 이상 지원되지 않습니다. /v1/auth/signup을 사용하세요.")


@router.get("/users/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> UserRead:
    # 본인 확인
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="본인의 정보만 조회할 수 있습니다")

    user = (await session.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserRead.model_validate(user)


@router.put("/users/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    body: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> UserRead:
    # 본인 확인
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="본인의 정보만 수정할 수 있습니다")

    user = (await session.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if body.username is not None:
        user.username = body.username

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=409, detail="username이 이미 존재합니다")
    await session.refresh(user)
    return UserRead.model_validate(user)


@router.delete("/users/{user_id}", status_code=204, response_class=Response)
async def delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> Response:
    # 본인 확인
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="본인의 계정만 삭제할 수 있습니다")

    user = (await session.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    await session.delete(user)
    await session.commit()
    return Response(status_code=204)


@router.get("/users", response_model=list[UserRead])
async def list_users(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> list[UserRead]:
    # 인증된 사용자만 목록 조회 가능 (본인만 반환)
    return [UserRead.model_validate(current_user)]


