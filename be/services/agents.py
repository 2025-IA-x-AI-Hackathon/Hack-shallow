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


def _display_source(metadata: Dict[str, Any]) -> str:
    """출처 문자열 구성.
    - veterinarian: title, author, publisher 우선
    - 그 외: source 또는 file_path
    """
    agent = (metadata or {}).get("agent")
    if agent == "veterinarian":
        title = (metadata or {}).get("title") or ""
        author = (metadata or {}).get("author") or ""
        publisher = (metadata or {}).get("publisher") or ""
        parts = []
        if title:
            parts.append(str(title))
        tail = " / ".join([p for p in [str(author) if author else "", str(publisher) if publisher else ""] if p])
        if tail:
            parts.append(tail)
        if parts:
            return " — ".join(parts)
    # fallback
    return metadata.get("source") or metadata.get("file_path") or "(unknown)"


def _format_sources(docs) -> str:
    # 고유 출처 목록 정리 (에이전트별 표현 규칙 반영)
    sources = []
    seen = set()
    for d in docs:
        md = getattr(d, "metadata", {}) or {}
        label = _display_source(md)
        if not label:
            continue
        if label not in seen:
            seen.add(label)
            sources.append(label)
    return "\n".join(sources) if sources else "(출처 정보 없음)"


def _docs_for_trace(docs, snippet_len: int = 200):
    items = []
    for d in docs or []:
        md = getattr(d, "metadata", {}) or {}
        label = _display_source(md)
        page = md.get("page")
        text = getattr(d, "page_content", "") or ""
        items.append({
            "source": label,
            "page": int(page) if isinstance(page, int) or (isinstance(page, str) and page.isdigit()) else page,
            "snippet": text[:snippet_len],
        })
    return items


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
        upd = it.get("updated_at")
        if ans is None or str(ans).strip() == "":
            continue
        label = f"{cat}:{key}" if cat and key else (key or cat or "항목")
        suffix = f" (업데이트: {upd})" if upd else ""
        lines.append(f"- {label}: {ans}{suffix}")
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
                    "4) 컨텍스트 출처(파일 경로/이름)\n{sources}\n\n"
                    "- 프로필과 컨텍스트에 없는 내용은 추측하지 말고 모른다고 답하세요.\n"
                    "- 가능한 간결하고 정확하게 한국어로 답하세요.\n"
                ),
                ("human", "질문: {question}"),
            ]
        )
        return (
            {
                "question": lambda x: x["question"],
                "agent_name": lambda x: self.name,
                # docs가 주어지면 사용, 없으면 retriever 호출
                "docs": lambda x: x.get("docs") if x.get("docs") is not None else self.retriever.invoke(x["question"]),
                # 강아지 프로필/세부정보 포맷팅
                "dog_profile": (lambda x: _format_dog_profile(x.get("dog"))),
                "dog_info_items": (lambda x: _format_dog_info_items(x.get("dog"))),
            }
            | RunnablePassthrough.assign(
                context=lambda x: _format_docs(x["docs"]),
                sources=lambda x: _format_sources(x["docs"]),
            )
            | prompt
            | self.llm
            | StrOutputParser()
        )

    async def ask(self, payload: Dict[str, Any]) -> str:
        # 미리 검색 문서를 확보해 trace에도 활용
        docs = self.retriever.invoke(payload["question"])
        chain = self.chain()
        answer = await chain.ainvoke({**payload, "docs": docs})
        return {"answer": answer, "docs": docs}


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
            answer_text = answer.get("answer") if isinstance(answer, dict) else answer
            docs = answer.get("docs") if isinstance(answer, dict) else None
            trace_docs = _docs_for_trace(docs)
            return {
                "agent": agent_name,
                "question": question,
                "answer": answer_text,
                "retrieved_docs": trace_docs,
                "duration_ms": duration_ms,
                "started_at": started_at,
                "ended_at": ended_at,
            }

        return await asyncio.gather(*[_ask_one(t) for t in tasks])

