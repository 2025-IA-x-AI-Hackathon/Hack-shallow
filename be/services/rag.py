from __future__ import annotations

from typing import Dict, List, Optional

from langchain_core.documents import Document

from core.config import get_settings, Settings


class StubRetriever:
    """벡터DB 구축 전까지 사용하는 스텁 리트리버.

    invoke(question: str) -> List[Document]
    """

    def __init__(self, agent_name: str) -> None:
        self.agent_name = agent_name

    def invoke(self, question: str) -> List[Document]:
        # 실제 구현에서는 agent_name 별 vector store에서 검색
        # 예: retriever.get_relevant_documents(question)
        return [
            Document(
                page_content=(
                    f"[{self.agent_name}] 현재는 벡터DB 미구축 상태의 스텁 컨텍스트입니다. "
                    f"질문: {question}"
                )
            )
        ]


class AgentIndexRegistry:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self._retrievers: Dict[str, StubRetriever] = {}
        self._ensure_retrievers()

    def _ensure_retrievers(self) -> None:
        for agent in self.settings.agents:
            self._retrievers[agent] = StubRetriever(agent)

    def get_retriever(self, agent: str):
        if agent not in self._retrievers:
            self._retrievers[agent] = StubRetriever(agent)
        return self._retrievers[agent]


_REGISTRY: Optional[AgentIndexRegistry] = None


def get_registry(settings: Optional[Settings] = None) -> AgentIndexRegistry:
    global _REGISTRY
    if _REGISTRY is None:
        _REGISTRY = AgentIndexRegistry(settings)
    return _REGISTRY

