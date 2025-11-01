from __future__ import annotations

import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import event


# 기본 경로: 프로젝트 루트의 app.db
DEFAULT_DB_URL = "sqlite+aiosqlite:///" + os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app.db"))


def get_database_url() -> str:
    # 환경변수 SHALLOW_DB_URL이 있으면 우선 사용
    return os.getenv("SHALLOW_DB_URL", DEFAULT_DB_URL)


engine = create_async_engine(get_database_url(), echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    session: AsyncSession = AsyncSessionLocal()
    try:
        yield session
    finally:
        await session.close()


# SQLite 외래키 강제 활성화 (CASCADE 등 동작 위해 필요)
@event.listens_for(engine.sync_engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    except Exception:
        # best-effort
        pass


