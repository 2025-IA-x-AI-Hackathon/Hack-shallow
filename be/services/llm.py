from __future__ import annotations

from typing import Optional

from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from core.config import get_settings, Settings


def get_chat_model(settings: Optional[Settings] = None) -> ChatOpenAI:
    cfg = settings or get_settings()
    return ChatOpenAI(
        api_key=cfg.openai_api_key or None,
        model=cfg.openai_model,
        temperature=cfg.temperature,
    )


def get_embeddings_model(settings: Optional[Settings] = None) -> OpenAIEmbeddings:
    cfg = settings or get_settings()
    return OpenAIEmbeddings(api_key=cfg.openai_api_key or None, model=cfg.embeddings_model)

