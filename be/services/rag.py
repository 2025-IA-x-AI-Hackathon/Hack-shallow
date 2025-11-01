from __future__ import annotations

from typing import Dict, Optional

from langchain_community.vectorstores import Chroma
from langchain_core.vectorstores import VectorStoreRetriever

from core.config import get_settings, Settings
from services.llm import get_embeddings_model


class AgentIndexRegistry:
    """에이전트별로 분리된 Chroma 컬렉션을 관리하고 retriever를 제공합니다.

    - 컬렉션 네임: agent 이름 그대로 사용 (e.g. "veterinarian", "behavior", "nutrition")
    - 퍼시스트 경로: settings.chroma_persist_dir
    - 임베딩: OpenAIEmbeddings (services.llm.get_embeddings_model)
    """

    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self._retrievers: Dict[str, VectorStoreRetriever] = {}
        self._ensure_retrievers()

    def _build_retriever(self, agent_name: str) -> VectorStoreRetriever:
        embeddings = get_embeddings_model(self.settings)
        vs = Chroma(
            collection_name=agent_name,
            persist_directory=self.settings.chroma_persist_dir,
            embedding_function=embeddings,
        )
        # 기본 k 값은 필요시 환경설정으로 확장 가능
        return vs.as_retriever(search_kwargs={"k": 4})

    def _ensure_retrievers(self) -> None:
        for agent in self.settings.agents:
            self._retrievers[agent] = self._build_retriever(agent)

    def get_retriever(self, agent: str) -> VectorStoreRetriever:
        if agent not in self._retrievers:
            self._retrievers[agent] = self._build_retriever(agent)
        return self._retrievers[agent]


_REGISTRY: Optional[AgentIndexRegistry] = None


def get_registry(settings: Optional[Settings] = None) -> AgentIndexRegistry:
    global _REGISTRY
    if _REGISTRY is None:
        _REGISTRY = AgentIndexRegistry(settings)
    return _REGISTRY

