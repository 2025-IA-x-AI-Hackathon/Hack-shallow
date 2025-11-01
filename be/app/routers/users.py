from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import UserCreate, UserRead, UserUpdate
from db.database import get_session
from db.models import User


router = APIRouter(prefix="/v1", tags=["users"])


@router.post("/users", response_model=UserRead, status_code=201)
async def create_user(body: UserCreate, session: AsyncSession = Depends(get_session)) -> UserRead:
    user = User(username=body.username)
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=409, detail="username이 이미 존재합니다")
    await session.refresh(user)
    return UserRead.model_validate(user)


@router.get("/users/{user_id}", response_model=UserRead)
async def get_user(user_id: int, session: AsyncSession = Depends(get_session)) -> UserRead:
    user = (await session.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserRead.model_validate(user)


@router.put("/users/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    body: UserUpdate,
    session: AsyncSession = Depends(get_session),
) -> UserRead:
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
async def delete_user(user_id: int, session: AsyncSession = Depends(get_session)) -> Response:
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
) -> list[UserRead]:
    stmt = select(User).limit(limit).offset(offset)
    users = (await session.execute(stmt)).scalars().all()
    return [UserRead.model_validate(u) for u in users]


