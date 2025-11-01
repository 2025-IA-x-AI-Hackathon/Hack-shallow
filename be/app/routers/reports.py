from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path

from db.database import get_session
from services.report_md import generate_markdown, markdown_to_pdf_bytes
from core.config import get_settings


router = APIRouter(prefix="/v1", tags=["reports"])


@router.post("/dogs/{dog_id}/reports/md")
async def create_report_md(dog_id: int, session: AsyncSession = Depends(get_session)) -> dict:
    try:
        meta = await generate_markdown(session, dog_id)
        # 미리 PDF URL도 알려주기
        return {"ok": True, **meta, "url_pdf": f"/v1/reports/{meta['filename']}/pdf"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/dogs/{dog_id}/reports")
async def list_reports(dog_id: int) -> list[dict]:
    settings = get_settings()
    be_root = Path(__file__).resolve().parents[2]
    reports_dir = Path(settings.reports_dir)
    if not reports_dir.is_absolute():
        reports_dir = be_root / reports_dir
    if not reports_dir.exists():
        return []
    items = []
    for p in sorted(reports_dir.glob(f"dog_{dog_id}_*.md")):
        rel = p.relative_to(be_root)
        items.append({
            "filename": p.name,
            "url_md": f"/static/{rel.as_posix()}",
            "url_pdf": f"/v1/reports/{p.name}/pdf",
            "modified": p.stat().st_mtime,
        })
    return items


@router.get("/reports/{filename}")
async def get_report_md(filename: str) -> Response:
    settings = get_settings()
    be_root = Path(__file__).resolve().parents[2]
    reports_dir = Path(settings.reports_dir)
    if not reports_dir.is_absolute():
        reports_dir = be_root / reports_dir
    fpath = (reports_dir / filename).resolve()
    if not fpath.exists() or fpath.suffix.lower() != ".md":
        raise HTTPException(status_code=404, detail="Not found")
    return Response(content=fpath.read_text(encoding="utf-8"), media_type="text/markdown; charset=utf-8")


@router.get("/reports/{filename}/pdf")
async def get_report_pdf(filename: str) -> Response:
    settings = get_settings()
    be_root = Path(__file__).resolve().parents[2]
    reports_dir = Path(settings.reports_dir)
    if not reports_dir.is_absolute():
        reports_dir = be_root / reports_dir
    fpath = (reports_dir / filename).resolve()
    if not fpath.exists() or fpath.suffix.lower() != ".md":
        raise HTTPException(status_code=404, detail="Not found")
    md_text = fpath.read_text(encoding="utf-8")
    pdf_bytes = markdown_to_pdf_bytes(md_text)
    return Response(content=pdf_bytes, media_type="application/pdf")


