from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

from core.config import get_settings, Settings
from services.llm import get_chat_model
from services.rag import get_registry


def _format_docs(docs) -> str:
    return "\n\n".join(d.page_content for d in docs)


def _format_dog_profile(dog: Optional[Dict[str, Any]]) -> str:
    if not dog:
        return "(강아지 정보 없음)"
    lines = []
    name = dog.get("name")
    if name:
        lines.append(f"이름: {name}")
    breed = dog.get("breed")
    if breed:
        lines.append(f"견종: {breed}")
    sex = dog.get("sex")
    if sex:
        lines.append(f"성별: {sex}")
    birth = dog.get("birth_date")
    if birth:
        lines.append(f"생년월일: {birth}")
    neut = dog.get("neutered")
    if neut is not None:
        lines.append(f"중성화: {'예' if neut else '아니오'}")
    weight = dog.get("weight_kg")
    if weight is not None:
        lines.append(f"체중: {weight} kg")
    return "\n".join(lines) or "(강아지 정보 없음)"


def _format_dog_info_items(dog: Optional[Dict[str, Any]]) -> str:
    if not dog:
        return "(추가 강아지 정보 없음)"
    items = dog.get("info") or []
    if not items:
        return "(추가 강아지 정보 없음)"
    lines = []
    for it in items:
        cat = it.get("category")
        key = it.get("key")
        ans = it.get("answer")
        if ans is None or str(ans).strip() == "":
            continue
        label = f"{cat}:{key}" if cat and key else (key or cat or "항목")
        lines.append(f"- {label}: {ans}")
    return "\n".join(lines) or "(추가 강아지 정보 없음)"

@dataclass
class RAGAgent:
    name: str
    description: str
    retriever: Any
    llm: Any

    def chain(self):
        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "당신은 {agent_name} 분야 전문가입니다. 다음 정보를 우선 활용해 질문에 답하세요.\n"
                    "1) 강아지 프로필\n{dog_profile}\n\n"
                    "2) 저장된 강아지 정보 항목\n{dog_info_items}\n\n"
                    "3) 검색 컨텍스트\n{context}\n\n"
                    "- 프로필과 컨텍스트에 없는 내용은 추측하지 말고 모른다고 답하세요.\n"
                    "- 가능한 간결하고 정확하게 한국어로 답하세요.",
                ),
                ("human", "질문: {question}"),
            ]
        )
        return (
            {
                "question": lambda x: x["question"],
                "agent_name": lambda x: self.name,
                # 검색 컨텍스트: 질문으로 검색
                "context": (lambda x: _format_docs(self.retriever.invoke(x["question"]))),
                # 강아지 프로필: 태스크에 포함된 dog dict 포맷팅
                "dog_profile": (lambda x: _format_dog_profile(x.get("dog"))),
                # 강아지 세부 정보 항목
                "dog_info_items": (lambda x: _format_dog_info_items(x.get("dog"))),
            }
            | prompt
            | self.llm
            | StrOutputParser()
        )

    async def ask(self, payload: Dict[str, Any]) -> str:
        chain = self.chain()
        return await chain.ainvoke(payload)


class AgentManager:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self.llm = get_chat_model(self.settings)
        self.registry = get_registry(self.settings)
        self._agents: Dict[str, RAGAgent] = {}
        self._build_default_agents()

    def _build_default_agents(self) -> None:
        descriptions = {
            "veterinarian": "수의학/질병/약물/응급/검사 결과 해석",
            "behavior": "동물 행동 교정/문제행동 분석/훈련 계획",
            "nutrition": "반려견 영양/식단/사료/간식/영양소/섭취량",
            "report": "요약 보고서 작성/사용자에게 전달할 문서",
        }
        for name in self.settings.agents:
            retriever = self.registry.get_retriever(name)
            self._agents[name] = RAGAgent(
                name=name,
                description=descriptions.get(name, f"{name} 분야 전문가"),
                retriever=retriever,
                llm=self.llm,
            )

    def list_agents(self) -> List[str]:
        return list(self._agents.keys())

    def descriptions(self) -> Dict[str, str]:
        return {name: agent.description for name, agent in self._agents.items()}

    def get(self, name: str) -> RAGAgent:
        if name not in self._agents:
            # 요청 시점에 동적 등록
            retriever = self.registry.get_retriever(name)
            self._agents[name] = RAGAgent(
                name=name,
                description=f"{name} 분야 전문가",
                retriever=retriever,
                llm=self.llm,
            )
        return self._agents[name]

    async def ask_many(self, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        async def _ask_one(t: Dict[str, Any]):
            agent_name = t.get("agent") or t.get("name")
            question = t.get("question") or t.get("sub_question")
            agent = self.get(agent_name)
            started_at = time.time()
            t0 = time.perf_counter()
            answer = await agent.ask({"question": question, "dog": t.get("dog")})
            duration_ms = (time.perf_counter() - t0) * 1000.0
            ended_at = time.time()
            return {
                "agent": agent_name,
                "question": question,
                "answer": answer,
                "duration_ms": duration_ms,
                "started_at": started_at,
                "ended_at": ended_at,
            }

        return await asyncio.gather(*[_ask_one(t) for t in tasks])

