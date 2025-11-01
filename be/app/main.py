from __future__ import annotations

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from api.request import MessageRequest
from api.response import MessageResponse
from graph.flow import run_qa_flow
from app.routers import dogs_router, chat_router
from app.routers.users import router as users_router
from app.routers.dog_info import router as dog_info_router
from db.database import engine, get_session
from db.models import Base, Dog
from db.models import DogInfoItem
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 앱 시작 시 테이블 초기화
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Shallow Mind API", version="1.0.0", lifespan=lifespan)

# 브라우저 테스트를 위한 CORS 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/v1/api/message", response_model=MessageResponse)
async def message_endpoint(body: MessageRequest, session: AsyncSession = Depends(get_session)) -> MessageResponse:
    try:
        dog_ctx = None
        if body.dog_id is not None:
            dog = (await session.execute(select(Dog).where(Dog.id == body.dog_id))).scalar_one_or_none()
            if dog is not None:
                # 저장된 dog_info (답변 있는 것만)
                info_rows = (
                    await session.execute(
                        select(DogInfoItem).where(
                            DogInfoItem.dog_id == dog.id,
                            (DogInfoItem.answer_text.is_not(None)) & (DogInfoItem.answer_text != ""),
                        )
                    )
                ).scalars().all()
                info_list = [
                    {
                        "category": r.category.value if hasattr(r.category, "value") else str(r.category),
                        "key": r.key,
                        "question": r.question,
                        "answer": r.answer_text,
                        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                    }
                    for r in info_rows
                ]

                dog_ctx = {
                    "id": dog.id,
                    "user_id": dog.user_id,
                    "name": dog.name,
                    "breed": dog.breed,
                    "birth_date": dog.birth_date.isoformat() if dog.birth_date else None,
                    "sex": dog.sex.value if hasattr(dog.sex, "value") else str(dog.sex),
                    "neutered": dog.neutered,
                    "weight_kg": dog.weight_kg,
                    "info": info_list,
                }
        result = await run_qa_flow(body.message, session_id=body.session_id, dog_context=dog_ctx)
        return MessageResponse(
            answer=result.get("answer", ""),
            tasks=result.get("tasks"),
            results=result.get("results"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


# 신규 라우터 등록
app.include_router(dogs_router)
app.include_router(chat_router)
app.include_router(users_router)
app.include_router(dog_info_router)

