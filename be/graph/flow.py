from __future__ import annotations

import asyncio
from typing import Any, Dict, List, TypedDict, Optional
import time
import uuid

from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import START, END, StateGraph

from core.config import get_settings
from services.agents import AgentManager
from services.llm import get_chat_model


class AgentUse(BaseModel):
    agent: str = Field(..., description="에이전트 이름 (예: veterinarian, behavior, nutrition, report)")
    use: bool = Field(..., description="이 에이전트를 사용할지 여부")
    reason: Optional[str] = Field(default=None, description="선택/비선택 사유")


class Plan(BaseModel):
    agents: List[AgentUse] = Field(default_factory=list)


class QAState(TypedDict, total=False):
    user_question: str
    session_id: Optional[str]
    dog_context: Optional[Dict[str, Any]]
    tasks: List[Dict[str, Any]]
    task_results: List[Dict[str, Any]]
    final_answer: str
    trace: Dict[str, Any]


async def plan_node(state: QAState) -> QAState:
    settings = get_settings()
    manager = AgentManager(settings)
    model = get_chat_model(settings)

    # timing
    start_ts = time.time()
    t0 = time.perf_counter()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "당신은 아래 에이전트들의 설명을 바탕으로, 원문 질문에 대해 각 에이전트가 필요한지 깐깐하게 판단합니다.\n"
                "- 출력은 JSON 스키마(Plan)로, agents:[{{agent, use, reason}}] 형태로 반환하세요.\n"
                "- 선택된 에이전트에게는 원문 질문 그대로 전달됩니다.\n"
                "- 불필요하면 use=false로 명시하고 간략한 이유를 남기세요.\n"
                "에이전트 후보와 설명(JSON): {agent_descriptions}",
            ),
            ("human", "원 질문: {question}"),
        ]
    )

    structured = model.with_structured_output(Plan)
    chain = prompt | structured
    plan: Plan = await chain.ainvoke(
        {
            "question": state["user_question"],
            "agent_descriptions": manager.descriptions(),
            "max_subtasks": settings.max_subtasks,
        }
    )

    # 선택된 에이전트에게 원문 질문 + dog_context 전달
    chosen = [au for au in plan.agents if au.use]
    tasks = [
        {"agent": au.agent, "question": state["user_question"], "dog": state.get("dog_context")} for au in chosen
    ]
    duration_ms = (time.perf_counter() - t0) * 1000.0
    trace = state.get("trace", {})
    trace.setdefault("steps", {})["plan"] = {
        "started_at": start_ts,
        "duration_ms": duration_ms,
        "num_agents_selected": len(chosen),
        "selected_agents": [au.agent for au in chosen],
        "raw_plan": plan.dict(),
    }
    return {**state, "tasks": tasks, "trace": trace}


async def execute_node(state: QAState) -> QAState:
    settings = get_settings()
    manager = AgentManager(settings)
    tasks = state.get("tasks", [])
    start_ts = time.time()
    t0 = time.perf_counter()
    results = await manager.ask_many(tasks)
    duration_ms = (time.perf_counter() - t0) * 1000.0

    trace = state.get("trace", {})
    trace.setdefault("steps", {})["execute"] = {
        "started_at": start_ts,
        "duration_ms": duration_ms,
        "results": results,
    }
    return {**state, "task_results": list(results), "trace": trace}


# aggregate_node 제거 (요청에 따라 통합 LLM 생략)


def build_graph():
    graph = StateGraph(QAState)
    graph.add_node("plan", plan_node)
    graph.add_node("execute", execute_node)

    graph.add_edge(START, "plan")
    graph.add_edge("plan", "execute")
    graph.add_edge("execute", END)

    return graph.compile()


_GRAPH = None


def get_graph():
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = build_graph()
    return _GRAPH


from services.tracing import default_trace_envelope, write_trace


async def run_qa_flow(question: str, session_id: Optional[str] = None, dog_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    graph = get_graph()
    trace_env = default_trace_envelope()
    trace_env.update({
        "request": {"question": question, "session_id": session_id, "dog_context": dog_context},
    })
    state: QAState = {"user_question": question, "session_id": session_id, "dog_context": dog_context, "trace": trace_env}
    started_at = time.time()
    t0 = time.perf_counter()
    out = await graph.ainvoke(state)
    total_ms = (time.perf_counter() - t0) * 1000.0
    out_trace = out.get("trace", trace_env)
    out_trace["total_duration_ms"] = total_ms
    out_trace["finished_at"] = time.time()
    write_trace(out_trace)
    return {
        "answer": "",  # 집계 없음: 에이전트별 결과만 제공
        "tasks": out.get("tasks", []),
        "results": out.get("task_results", []),
    }

