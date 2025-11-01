from __future__ import annotations

import random
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import (
    DogInfoItemRead,
    DogInfoAnswerUpdate,
    DogInfoRandomQuestion,
    DogInfoCategory as SCategory,
    QuestionType as SQuestionType,
)
from db.database import get_session
from db.models import Dog, DogInfoItem, DogInfoCategory, QuestionType, ChatMessage
from services.llm import get_chat_model
from core.config import get_settings


router = APIRouter(prefix="/v1", tags=["dog-info"])


DEFAULT_ITEMS = [
    # 식습관(diet)
    {
        "category": DogInfoCategory.diet,
        "key": "feeding_method",
        "question": "배식 방법은 어떻게 하시나요? (자유급식/시간정해급식 등)",
        "question_type": QuestionType.text,
    },
    {
        "category": DogInfoCategory.diet,
        "key": "favorite_treats",
        "question": "자주 주는 간식이나 선호 간식이 있나요?",
        "question_type": QuestionType.text,
    },
    {
        "category": DogInfoCategory.diet,
        "key": "recent_intake_increase",
        "question": "최근 식사량이 늘었나요?",
        "question_type": QuestionType.boolean,
    },
    # 행동(behavior)
    {
        "category": DogInfoCategory.behavior,
        "key": "bad_habits",
        "question": "최근 보이는 안 좋은 습관이 있나요?",
        "question_type": QuestionType.text,
    },
    {
        "category": DogInfoCategory.behavior,
        "key": "barking",
        "question": "자주 짖나요?",
        "question_type": QuestionType.boolean,
    },
]


async def ensure_defaults(session: AsyncSession, dog_id: int) -> None:
    existing_keys = set(
        (await session.execute(select(DogInfoItem.key).where(DogInfoItem.dog_id == dog_id))).scalars().all()
    )
    created = False
    for item in DEFAULT_ITEMS:
        if item["key"] in existing_keys:
            continue
        session.add(
            DogInfoItem(
                dog_id=dog_id,
                category=item["category"],
                key=item["key"],
                question=item["question"],
                question_type=item["question_type"],
            )
        )
        created = True
    if created:
        await session.commit()


@router.post("/dogs/{dog_id}/info/init", status_code=204, response_class=Response)
async def init_dog_info(dog_id: int, session: AsyncSession = Depends(get_session)) -> Response:
    dog = (await session.execute(select(Dog.id).where(Dog.id == dog_id))).scalar_one_or_none()
    if dog is None:
        raise HTTPException(status_code=404, detail="Dog not found")
    await ensure_defaults(session, dog_id)
    return Response(status_code=204)


@router.get("/dogs/{dog_id}/info", response_model=List[DogInfoItemRead])
async def list_dog_info(
    dog_id: int,
    empty_only: bool = Query(False),
    session: AsyncSession = Depends(get_session),
) -> List[DogInfoItemRead]:
    await ensure_defaults(session, dog_id)
    stmt = select(DogInfoItem).where(DogInfoItem.dog_id == dog_id)
    if empty_only:
        stmt = stmt.where((DogInfoItem.answer_text.is_(None)) | (DogInfoItem.answer_text == ""))
    rows = (await session.execute(stmt)).scalars().all()
    return [DogInfoItemRead.model_validate(r) for r in rows]


@router.get("/dogs/{dog_id}/info/random-unanswered", response_model=DogInfoRandomQuestion)
async def get_random_unanswered(dog_id: int, session: AsyncSession = Depends(get_session)) -> DogInfoRandomQuestion:
    await ensure_defaults(session, dog_id)
    rows = (
        await session.execute(
            select(DogInfoItem).where(
                DogInfoItem.dog_id == dog_id,
                (DogInfoItem.answer_text.is_(None)) | (DogInfoItem.answer_text == ""),
            )
        )
    ).scalars().all()
    if not rows:
        raise HTTPException(status_code=404, detail="모든 항목에 답변이 있습니다")
    item = random.choice(rows)
    return DogInfoRandomQuestion(
        category=SCategory(item.category.value),
        key=item.key,
        question=item.question,
        question_type=SQuestionType(item.question_type.value),
    )


@router.put("/dogs/{dog_id}/info/{key}", response_model=DogInfoItemRead)
async def answer_info(
    dog_id: int,
    key: str,
    body: DogInfoAnswerUpdate,
    session: AsyncSession = Depends(get_session),
) -> DogInfoItemRead:
    row = (
        await session.execute(
            select(DogInfoItem).where(DogInfoItem.dog_id == dog_id, DogInfoItem.key == key)
        )
    ).scalar_one_or_none()
    if row is None:
        await ensure_defaults(session, dog_id)
        row = (
            await session.execute(
                select(DogInfoItem).where(DogInfoItem.dog_id == dog_id, DogInfoItem.key == key)
            )
        ).scalar_one_or_none()
        if row is None:
            raise HTTPException(status_code=404, detail="항목을 찾을 수 없습니다")

    row.answer_text = body.answer
    row.source = body.source or "user"
    row.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(row)
    return DogInfoItemRead.model_validate(row)


@router.post("/dogs/{dog_id}/info/auto-fill-from-history", response_model=List[DogInfoItemRead])
async def autofill_from_history(dog_id: int, session: AsyncSession = Depends(get_session)) -> List[DogInfoItemRead]:
    await ensure_defaults(session, dog_id)
    # 미답변 항목 리스트업
    missing = (
        await session.execute(
            select(DogInfoItem).where(
                DogInfoItem.dog_id == dog_id,
                (DogInfoItem.answer_text.is_(None)) | (DogInfoItem.answer_text == ""),
            )
        )
    ).scalars().all()
    if not missing:
        return []

    # 최근 채팅 히스토리 취합
    messages = (
        await session.execute(
            select(ChatMessage).where(ChatMessage.dog_id == dog_id).order_by(ChatMessage.created_at.asc())
        )
    ).scalars().all()
    text_blocks = []
    for m in messages:
        role = m.role
        who = "사용자" if role == "user" else (m.agent or "assistant")
        text_blocks.append(f"[{who}] {m.content}")
    history_text = "\n".join(text_blocks)[-5000:]

    # LLM으로 추출 지시
    settings = get_settings()
    llm = get_chat_model(settings)
    allowed = [f"{r.category.value}:{r.key}" for r in missing]
    system = (
        "다음은 반려견 주고 받은 대화입니다.\n"
        "가능한 경우 아래 키에 해당하는 정보 값을 JSON으로 추출하세요. 모르면 키를 생략하세요.\n"
        "키는 '카테고리:키' 형식입니다. 예) diet:feeding_method\n"
        f"허용 키 목록: {', '.join(allowed)}\n"
        "출력은 반드시 JSON 객체 하나만: { 'diet:feeding_method': '...' , 'behavior:barking': '예/아니오 또는 true/false' }"
    )
    prompt = [
        ("system", system),
        ("human", history_text or "대화 없음"),
    ]
    raw = await llm.ainvoke(prompt)
    content = getattr(raw, "content", "") if raw else ""
    import json
    extracted = {}
    try:
        extracted = json.loads(content) if isinstance(content, str) else {}
    except Exception:
        extracted = {}

    updated_rows: List[DogInfoItem] = []
    for r in missing:
        key_full = f"{r.category.value}:{r.key}"
        if key_full not in extracted:
            continue
        val = extracted[key_full]
        # boolean 타입 정규화
        if r.question_type == QuestionType.boolean:
            sval = str(val).strip().lower()
            if sval in ("yes", "true", "1", "y", "예", "네"):
                val = "true"
            elif sval in ("no", "false", "0", "n", "아니오", "아니요"):
                val = "false"
            else:
                val = str(val)
        else:
            val = str(val)
        r.answer_text = val
        r.source = "history"
        r.updated_at = datetime.utcnow()
        updated_rows.append(r)

    if updated_rows:
        await session.commit()

    return [DogInfoItemRead.model_validate(r) for r in updated_rows]


