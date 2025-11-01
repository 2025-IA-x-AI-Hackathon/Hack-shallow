from __future__ import annotations

import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import get_settings
from services.llm import get_chat_model
from db.models import Dog, User, DogInfoItem, ChatMessage


def _calc_age_years(birth_date) -> Optional[float]:
    try:
        if not birth_date:
            return None
        from datetime import date
        days = (date.today() - birth_date).days
        return round(days / 365.25, 1)
    except Exception:
        return None


async def collect_context(session: AsyncSession, dog_id: int) -> Dict[str, object]:
    dog: Optional[Dog] = (await session.execute(select(Dog).where(Dog.id == dog_id))).scalar_one_or_none()
    if dog is None:
        raise ValueError("Dog not found")
    owner: Optional[User] = (await session.execute(select(User).where(User.id == dog.user_id))).scalar_one_or_none()
    info_items: List[DogInfoItem] = (
        await session.execute(select(DogInfoItem).where(DogInfoItem.dog_id == dog_id))
    ).scalars().all()
    messages: List[ChatMessage] = (
        await session.execute(select(ChatMessage).where(ChatMessage.dog_id == dog_id).order_by(ChatMessage.created_at.asc()))
    ).scalars().all()

    answered_items: List[Dict[str, object]] = []
    missing_items: List[Dict[str, object]] = []
    info_lines: List[str] = []
    info_by_category: Dict[str, List[Dict[str, object]]] = {}
    all_items: List[Dict[str, object]] = []
    for it in info_items:
        row = {
            "category": it.category.value,
            "key": it.key,
            "question": it.question,
            "type": it.question_type.value,
            "answer": it.answer_text,
            "source": it.source,
            "updated_at": it.updated_at.isoformat() if it.updated_at else None,
        }
        all_items.append(row)
        info_by_category.setdefault(it.category.value, []).append(row)
        label = f"{it.category.value}:{it.key}"
        if it.answer_text is None or str(it.answer_text).strip() == "":
            missing_items.append(row)
            info_lines.append(f"- {label}: (미답변)")
        else:
            answered_items.append(row)
            info_lines.append(f"- {label}: {it.answer_text}")

    history_lines: List[str] = []
    for m in messages[-300:]:  # 최근 최대 300개
        who = "사용자" if m.role == "user" else (m.agent or "assistant")
        history_lines.append(f"[{who}] {m.content}")

    history_text = "\n".join(history_lines)
    history_stats = {
        "total": len(messages),
        "range": (
            (messages[0].created_at.isoformat() if messages else None),
            (messages[-1].created_at.isoformat() if messages else None),
        ),
        "user_count": sum(1 for m in messages if m.role == "user"),
        "assistant_count": sum(1 for m in messages if m.role != "user"),
    }

    age_years = _calc_age_years(dog.birth_date)

    return {
        "dog": dog,
        "owner": owner,
        "dog_age_years": age_years,
        "info_text": "\n".join(info_lines),
        "info_answered": answered_items,
        "info_missing": missing_items,
        "info_by_category": info_by_category,
        "dog_info_items": all_items,
        "history_text": history_text,
        "history_stats": history_stats,
        "history_tail": [
            {"role": ("user" if m.role == "user" else (m.agent or "assistant")), "text": m.content, "ts": m.created_at.isoformat()}
            for m in messages[-50:]
        ],
    }


async def generate_markdown(session: AsyncSession, dog_id: int) -> Dict[str, str]:
    settings = get_settings()
    llm = get_chat_model(settings)
    ctx = await collect_context(session, dog_id)
    dog: Dog = ctx["dog"]  # type: ignore
    owner: Optional[User] = ctx["owner"]  # type: ignore
    info_text: str = ctx["info_text"]  # type: ignore
    history_text: str = ctx["history_text"]  # type: ignore
    info_answered = ctx["info_answered"]  # type: ignore
    info_missing = ctx["info_missing"]  # type: ignore
    info_by_category = ctx["info_by_category"]  # type: ignore
    dog_info_items = ctx["dog_info_items"]  # type: ignore
    history_stats = ctx["history_stats"]  # type: ignore
    history_tail = ctx["history_tail"]  # type: ignore
    dog_age_years = ctx.get("dog_age_years")

    system = (
        "당신은 임상 수의사에게 전달할 공식 보고서를 마크다운으로 작성하는 전문가입니다.\n"
        "출력은 반드시 순수 마크다운(.md)이어야 하며, 코드블록은 사용하지 않습니다.\n"
        "요구사항:\n"
        "- 한국어, 전문적/간결/정돈된 구조\n"
        "- 최상단에 제목과 생성시각을 표기\n"
        "- 목차(Links) 포함\n"
        "- 환자 기본정보는 표 형식(키|값)\n"
        "- 필요한 경우 bullet/번호 목록 적극 활용\n"
        "- 근거가 불충분하면 '불충분'으로 표기\n"
        "- 반드시 '위험 신호 감지' 섹션을 포함해 보호자가 인지하지 못할 수 있는 중요한 임상적 시그널을 명시(심각도, 근거, 권고)\n"
    )
    human = (
        f"[제목]\n진료 보고서 - {dog.name} (#{dog.id})\n\n"
        f"[환자 기본정보]\n"
        f"- id: {dog.id}\n- 이름: {dog.name}\n- 견종: {dog.breed}\n- 생년: {dog.birth_date} (추정 나이: {dog_age_years}년)\n- 성별: {dog.sex.value}\n- 중성화: {dog.neutered}\n- 체중(kg): {dog.weight_kg}\n\n"
        f"[보호자]\n- id: {(owner.id if owner else None)}\n- username: {(owner.username if owner else None)}\n\n"
        f"[구조화 정보 요약]\n{info_text}\n\n"
        f"[구조화 정보(세부)]\n- answered: {json.dumps(info_answered, ensure_ascii=False)}\n- missing: {json.dumps(info_missing, ensure_ascii=False)}\n- by_category: {json.dumps(info_by_category, ensure_ascii=False)}\n- dog_info_items(raw): {json.dumps(dog_info_items, ensure_ascii=False)}\n\n"
        f"[히스토리 정보]\n요약대상 총 {history_stats['total']}건, 구간={history_stats['range']}, 사용자={history_stats['user_count']}, 어시스턴트={history_stats['assistant_count']}\n\n"
        f"[히스토리(최근 50건)]\n{history_tail}\n\n"
        f"위 데이터를 바탕으로 아래 형식을 충실히 작성:\n"
        f"1) # 요약(의사 전달용 핵심 5문장)\n"
        f"2) # 환자 기본정보 (표)\n"
        f"3) # 주요 호소/이슈 요약\n"
        f"4) # 행동 관련 관찰\n"
        f"5) # 영양/식이 관련 관찰\n"
        f"6) # 과거 대화에서 드러난 사용자 관심사(요약)\n"
        f"7) # 위험 신호 감지 (보호자가 인지하지 못할 수 있는 시그널)\n   - 심각도(높음/중간/낮음), 근거(인용), 권고(내원/검사/주의)\n"
        f"8) # 검사/추적/치료 계획\n"
        f"9) # 체크리스트 (가정용 지침)\n"
    )
    prompt = [("system", system), ("human", human)]
    raw = await llm.ainvoke(prompt)
    md = (getattr(raw, "content", "") if raw else "").strip()

    # 파일 저장
    be_root = Path(__file__).resolve().parents[1]
    reports_dir = Path(settings.reports_dir)
    if not reports_dir.is_absolute():
        reports_dir = be_root / reports_dir
    reports_dir.mkdir(parents=True, exist_ok=True)
    fname = f"dog_{dog_id}_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}_{uuid.uuid4().hex[:8]}.md"
    fpath = reports_dir / fname
    fpath.write_text(md, encoding="utf-8")

    rel = os.path.relpath(str(fpath), start=str(be_root))
    url_md = f"/static/{rel}"
    return {"filename": fname, "path": str(fpath), "url_md": url_md}


def markdown_to_pdf_bytes(md_text: str) -> bytes:
    """마크다운 → PDF 변환 (한글 폰트 적용)"""
    import markdown as mdmod
    from xhtml2pdf import pisa
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from io import BytesIO

    # 폰트 경로 탐색: 환경변수 > be/fonts 내 후보
    settings = get_settings()
    be_root = Path(__file__).resolve().parents[1]
    candidates = []
    env_font = os.getenv("REPORT_FONT_PATH")
    if env_font:
        candidates.append(Path(env_font))
    fonts_dir = be_root / "fonts"
    candidates.extend([
        fonts_dir / "NotoSansKR-Regular.ttf",
        fonts_dir / "NanumGothic.ttf",
    ])

    font_family = "Helvetica"
    font_css_face = ""
    chosen = None
    for p in candidates:
        if p.exists():
            try:
                pdfmetrics.registerFont(TTFont("KRPrimary", str(p)))
                font_family = "KRPrimary"
                # xhtml2pdf의 @font-face 지원을 위해 절대 경로 사용
                font_css_face = (
                    f"@font-face{{ font-family:'KRPrimary'; src: url('file://{p.as_posix()}'); }}"
                )
                chosen = p
                break
            except Exception:
                continue

    html_body = mdmod.markdown(md_text, extensions=["extra", "sane_lists"])  # 안전한 기본 확장
    # xhtml2pdf CSS 파서는 제한적이므로 규칙을 단순화
    css = (
        f"{font_css_face}\n"
        f"body {{ font-family: '{font_family}', 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif; font-size: 12pt; line-height: 1.6; }}\n"
    )
    html = (
        "<!DOCTYPE html><html lang=\"ko\"><head><meta charset=\"utf-8\"/>"
        f"<style>{css}</style>"
        "</head><body>" + html_body + "</body></html>"
    )

    # 파일/리소스 링크 해석 (주로 file:// 경로 처리)
    def _link_callback(uri, rel):
        if uri.startswith("file://"):
            return uri[7:]
        # /static 경로를 로컬 경로로 매핑
        if uri.startswith("/static/"):
            local = (be_root / uri[len("/static/"):]).resolve()
            return str(local)
        return uri

    out = BytesIO()
    pisa.CreatePDF(src=html, dest=out, link_callback=_link_callback)
    return out.getvalue()


