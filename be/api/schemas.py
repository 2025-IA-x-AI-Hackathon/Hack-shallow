from __future__ import annotations

from datetime import date, datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field, field_validator
from enum import Enum as PyEnum


# User reference (간단 참조용)
class UserRef(BaseModel):
    id: int = Field(..., description="사용자 식별자")


# User 스키마
class UserCreate(BaseModel):
    username: str | None = Field(default=None, max_length=100)


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, max_length=100)


class UserRead(BaseModel):
    id: int
    username: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# 인증 스키마
class UserSignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=100, description="사용자명 (3-100자)")
    password: str = Field(..., min_length=6, description="비밀번호 (최소 6자)")


class UserLoginRequest(BaseModel):
    username: str = Field(..., description="사용자명")
    password: str = Field(..., description="비밀번호")


class TokenResponse(BaseModel):
    access_token: str = Field(..., description="JWT 액세스 토큰")
    token_type: str = Field(default="bearer", description="토큰 타입")


# DogInfo 스키마
class DogInfoCategory(str, PyEnum):
    diet = "diet"
    behavior = "behavior"


class QuestionType(str, PyEnum):
    text = "text"
    boolean = "boolean"


class DogInfoItemRead(BaseModel):
    id: int
    dog_id: int
    category: DogInfoCategory
    key: str
    question: str
    question_type: QuestionType
    answer_text: str | None
    source: str | None
    updated_at: datetime

    class Config:
        from_attributes = True


class DogInfoAnswerUpdate(BaseModel):
    answer: str = Field(..., min_length=1)
    source: str | None = Field(default="user")


class DogInfoRandomQuestion(BaseModel):
    category: DogInfoCategory
    key: str
    question: str
    question_type: QuestionType


# Dog 스키마
class DogBase(BaseModel):
    name: str = Field(..., min_length=1)
    breed: Optional[str] = Field(default=None)
    birth_date: Optional[date] = Field(default=None)
    sex: Literal["male", "female", "unknown"] = Field(default="unknown")
    neutered: bool = Field(default=False)
    weight_kg: Optional[float] = Field(default=None, ge=0)


class DogCreate(DogBase):
    pass


class DogUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    birth_date: Optional[date] = None
    sex: Optional[Literal["male", "female", "unknown"]] = None
    neutered: Optional[bool] = None
    weight_kg: Optional[float] = Field(default=None, ge=0)


class DogRead(DogBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @field_validator("sex", mode="before")
    @classmethod
    def _sex_to_value(cls, v):
        # SQLAlchemy Enum(SexEnum) -> string
        if isinstance(v, PyEnum):
            return v.value
        return v


# Chat 메시지 스키마
class ChatMessageCreate(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1)
    agent: Optional[str] = Field(default=None, description="assistant일 때 사용")


class ChatMessageRead(BaseModel):
    id: int
    dog_id: int
    role: Literal["user", "assistant"]
    content: str
    agent: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


