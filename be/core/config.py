from __future__ import annotations

import json
from typing import List, Optional, Union

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import os


class Settings(BaseSettings):
    load_dotenv(override=True)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        case_sensitive=False,
    )

    openai_api_key: str = Field(default="", validation_alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", validation_alias="OPENAI_MODEL")
    embeddings_model: str = Field(
        default="text-embedding-3-small", validation_alias="EMBEDDINGS_MODEL"
    )
    agents: Union[str, List[str]] = Field(
        default_factory=lambda: ["veterinarian", "behavior", "nutrition", "report"],
        validation_alias="AGENTS",
    )
    temperature: float = Field(default=0.2, validation_alias="TEMPERATURE")
    max_subtasks: int = Field(default=4, validation_alias="MAX_SUBTASKS")

    @field_validator("agents", mode="before")
    @classmethod
    def _parse_agents(cls, v):
        # 허용 입력: 리스트, JSON 문자열, 콤마 구분 문자열
        if v is None or isinstance(v, list):
            return v or ["veterinarian", "behavior", "nutrition", "report"]
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return ["veterinarian", "behavior", "nutrition", "report"]
            if s.startswith("["):
                try:
                    loaded = json.loads(s)
                    if isinstance(loaded, list):
                        return [str(x).strip() for x in loaded if str(x).strip()]
                except Exception:
                    pass
            return [part.strip() for part in s.split(",") if part.strip()]
        return v


def get_settings() -> Settings:
    return Settings()

