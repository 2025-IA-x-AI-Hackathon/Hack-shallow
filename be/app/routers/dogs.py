from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import DogCreate, DogRead, DogUpdate
from db.database import get_session
from db.models import Dog, User, SexEnum


router = APIRouter(prefix="/v1", tags=["dogs"])


@router.post("/dogs", response_model=DogRead, status_code=201)
async def create_dog(body: DogCreate, session: AsyncSession = Depends(get_session)) -> DogRead:
    # 필요 시 사용자 스텁 생성(없으면)
    user = (await session.execute(select(User).where(User.id == body.user_id))).scalar_one_or_none()
    if user is None:
        user = User(id=body.user_id, username=None)
        session.add(user)

    dog = Dog(
        user_id=body.user_id,
        name=body.name,
        breed=body.breed,
        birth_date=body.birth_date,
        sex=SexEnum(body.sex),
        neutered=body.neutered,
        weight_kg=body.weight_kg,
    )
    session.add(dog)
    await session.commit()
    await session.refresh(dog)
    return DogRead.model_validate(dog)


@router.get("/dogs/{dog_id}", response_model=DogRead)
async def get_dog(dog_id: int, session: AsyncSession = Depends(get_session)) -> DogRead:
    dog = (await session.execute(select(Dog).where(Dog.id == dog_id))).scalar_one_or_none()
    if dog is None:
        raise HTTPException(status_code=404, detail="Dog not found")
    return DogRead.model_validate(dog)


@router.put("/dogs/{dog_id}", response_model=DogRead)
async def update_dog(
    dog_id: int,
    body: DogUpdate,
    session: AsyncSession = Depends(get_session),
) -> DogRead:
    dog = (await session.execute(select(Dog).where(Dog.id == dog_id))).scalar_one_or_none()
    if dog is None:
        raise HTTPException(status_code=404, detail="Dog not found")

    if body.name is not None:
        dog.name = body.name
    if body.breed is not None:
        dog.breed = body.breed
    if body.birth_date is not None:
        dog.birth_date = body.birth_date
    if body.sex is not None:
        dog.sex = SexEnum(body.sex)
    if body.neutered is not None:
        dog.neutered = body.neutered
    if body.weight_kg is not None:
        dog.weight_kg = body.weight_kg

    await session.commit()
    await session.refresh(dog)
    return DogRead.model_validate(dog)


@router.delete("/dogs/{dog_id}", status_code=204, response_class=Response)
async def delete_dog(dog_id: int, session: AsyncSession = Depends(get_session)) -> Response:
    dog = (await session.execute(select(Dog).where(Dog.id == dog_id))).scalar_one_or_none()
    if dog is None:
        raise HTTPException(status_code=404, detail="Dog not found")
    await session.delete(dog)
    await session.commit()
    return Response(status_code=204)


@router.get("/users/{user_id}/dogs", response_model=list[DogRead])
async def list_user_dogs(
    user_id: int,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
) -> list[DogRead]:
    stmt = select(Dog).where(Dog.user_id == user_id).limit(limit).offset(offset)
    dogs = (await session.execute(stmt)).scalars().all()
    return [DogRead.model_validate(d) for d in dogs]


