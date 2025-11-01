from __future__ import annotations

import enum
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from typing import Optional, List
from sqlalchemy import UniqueConstraint


class Base(DeclarativeBase):
    pass


class SexEnum(str, enum.Enum):
    male = "male"
    female = "female"
    unknown = "unknown"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dogs: Mapped[List["Dog"]] = relationship("Dog", back_populates="owner", cascade="all, delete-orphan")


class Dog(Base):
    __tablename__ = "dogs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    name: Mapped[str] = mapped_column(String(100))
    breed: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    sex: Mapped[SexEnum] = mapped_column(Enum(SexEnum), default=SexEnum.unknown)
    neutered: Mapped[bool] = mapped_column(Boolean, default=False)
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: Mapped["User"] = relationship("User", back_populates="dogs")
    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage",
        back_populates="dog",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ChatMessage.created_at",
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dog_id: Mapped[int] = mapped_column(ForeignKey("dogs.id", ondelete="CASCADE"), index=True)

    role: Mapped[str] = mapped_column(String(20))  # 'user' | 'assistant'
    content: Mapped[str] = mapped_column(Text)
    agent: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # assistant일 때 사용

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    dog: Mapped["Dog"] = relationship("Dog", back_populates="messages")


class DogInfoCategory(str, enum.Enum):
    diet = "diet"        # 식습관
    behavior = "behavior"  # 행동


class QuestionType(str, enum.Enum):
    text = "text"
    boolean = "boolean"


class DogInfoItem(Base):
    __tablename__ = "dog_info_items"
    __table_args__ = (
        UniqueConstraint("dog_id", "key", name="uq_dog_info_dog_key"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dog_id: Mapped[int] = mapped_column(ForeignKey("dogs.id", ondelete="CASCADE"), index=True)
    category: Mapped[DogInfoCategory] = mapped_column(Enum(DogInfoCategory))
    key: Mapped[str] = mapped_column(String(50))
    question: Mapped[str] = mapped_column(String(255))
    question_type: Mapped[QuestionType] = mapped_column(Enum(QuestionType), default=QuestionType.text)
    answer_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # user|history 등
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dog: Mapped["Dog"] = relationship("Dog")


