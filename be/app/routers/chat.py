from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import ChatMessageCreate, ChatMessageRead
from db.database import get_session
from db.models import ChatMessage, Dog


router = APIRouter(prefix="/v1", tags=["chat"])


@router.post("/dogs/{dog_id}/chat/messages", response_model=ChatMessageRead, status_code=201)
async def create_chat_message(
    dog_id: int,
    body: ChatMessageCreate,
    session: AsyncSession = Depends(get_session),
) -> ChatMessageRead:
    dog = (await session.execute(select(Dog).where(Dog.id == dog_id))).scalar_one_or_none()
    if dog is None:
        raise HTTPException(status_code=404, detail="Dog not found")

    if body.role == "assistant" and (body.agent is None or not body.agent.strip()):
        raise HTTPException(status_code=400, detail="assistant 메시지는 agent가 필요합니다")

    msg = ChatMessage(
        dog_id=dog_id,
        role=body.role,
        content=body.content,
        agent=body.agent,
    )
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    return ChatMessageRead.model_validate(msg)


@router.get("/dogs/{dog_id}/chat/messages", response_model=list[ChatMessageRead])
async def list_chat_messages(
    dog_id: int,
    limit: int = Query(100, ge=1, le=500),
    before: datetime | None = Query(None, description="이 시간 이전 메시지까지 조회"),
    since: datetime | None = Query(None, description="이 시간 이후 메시지만 조회"),
    session: AsyncSession = Depends(get_session),
) -> list[ChatMessageRead]:
    dog = (await session.execute(select(Dog.id).where(Dog.id == dog_id))).scalar_one_or_none()
    if dog is None:
        raise HTTPException(status_code=404, detail="Dog not found")

    stmt = select(ChatMessage).where(ChatMessage.dog_id == dog_id)
    if since is not None:
        stmt = stmt.where(ChatMessage.created_at >= since)
    if before is not None:
        stmt = stmt.where(ChatMessage.created_at < before)
    stmt = stmt.order_by(ChatMessage.created_at.asc()).limit(limit)

    messages = (await session.execute(stmt)).scalars().all()
    return [ChatMessageRead.model_validate(m) for m in messages]


