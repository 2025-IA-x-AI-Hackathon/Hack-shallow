from __future__ import annotations

from typing import Optional

from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from core.config import get_settings, Settings


def get_chat_model(settings: Optional[Settings] = None) -> ChatOpenAI:
    cfg = settings or get_settings()
    if not cfg.openai_api_key or not cfg.openai_api_key.strip():
        raise RuntimeError("OPENAI_API_KEY가 설정되지 않았습니다. .env에 OPENAI_API_KEY를 지정하세요.")
    return ChatOpenAI(
        api_key=cfg.openai_api_key or None,
        model=cfg.openai_model,
        temperature=cfg.temperature,
    )


def get_embeddings_model(settings: Optional[Settings] = None) -> OpenAIEmbeddings:
    cfg = settings or get_settings()
    return OpenAIEmbeddings(api_key=cfg.openai_api_key or None, model=cfg.embeddings_model)

