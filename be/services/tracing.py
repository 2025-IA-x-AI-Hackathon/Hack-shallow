from __future__ import annotations

import os
import time
import uuid
from typing import Any, Dict

try:
    import orjson as _json
except Exception:  # pragma: no cover
    import json as _json  # type: ignore


TRACES_DIR = "traces"


def ensure_traces_dir() -> None:
    os.makedirs(TRACES_DIR, exist_ok=True)


def default_trace_envelope() -> Dict[str, Any]:
    return {
        "trace_id": str(uuid.uuid4()),
        "created_at": time.time(),
        "steps": {},
    }


def write_trace(trace: Dict[str, Any]) -> str:
    ensure_traces_dir()
    trace_id = trace.get("trace_id") or str(uuid.uuid4())
    ts = trace.get("created_at") or time.time()
    # 파일명: <epoch>_<trace_id>.json
    filename = f"{int(ts)}_{trace_id}.json"
    path = os.path.join(TRACES_DIR, filename)

    try:
        if _json.__name__ == "orjson":
            data = _json.dumps(trace)
            with open(path, "wb") as f:
                f.write(data)
        else:
            with open(path, "w", encoding="utf-8") as f:
                _json.dump(trace, f, ensure_ascii=False, indent=2)  # type: ignore
    except Exception:
        # 트레이스 저장 실패는 기능에 영향 주지 않도록 무시
        return ""
    return path

