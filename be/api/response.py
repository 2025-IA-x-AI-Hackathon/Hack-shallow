from pydantic import BaseModel, Field
from typing import Any, Optional, List, Dict


class MessageResponse(BaseModel):
    answer: str = Field(..., description="최종 종합 답변")
    tasks: Optional[List[Dict[str, Any]]] = Field(default=None, description="계획된 서브태스크 정보(디버그용)")
    results: Optional[List[Dict[str, Any]]] = Field(default=None, description="에이전트별 실행 결과 목록")

