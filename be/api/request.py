from pydantic import BaseModel, Field
from typing import Optional


class MessageRequest(BaseModel):
    message: str = Field(..., min_length=1, description="사용자 질문")
    session_id: Optional[str] = Field(default=None, description="세션 식별자(옵션)")
    dog_id: Optional[int] = Field(default=None, description="대상 강아지 ID(옵션)")

