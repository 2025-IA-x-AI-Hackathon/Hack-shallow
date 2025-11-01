from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
from typing import Iterable, List

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from core.config import get_settings
from services.llm import get_embeddings_model
from langchain_community.vectorstores import Chroma


def iter_pdfs(root: Path) -> Iterable[Path]:
    for p in sorted(root.rglob("*.pdf")):
        if p.is_file():
            yield p


def chunk_documents(docs, chunk_size: int = 1200, chunk_overlap: int = 200):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""],
    )
    return splitter.split_documents(docs)


def make_id(text: str, source: str, page: int) -> str:
    h = hashlib.sha256()
    h.update(text.encode("utf-8"))
    h.update(str(source).encode("utf-8"))
    h.update(str(page).encode("utf-8"))
    return h.hexdigest()


def ingest_behavior(data_dir: Path) -> None:
    settings = get_settings()
    embeddings = get_embeddings_model(settings)

    vs = Chroma(
        collection_name="behavior",
        persist_directory=settings.chroma_persist_dir,
        embedding_function=embeddings,
    )

    print(f"[1/4] 스캔 시작: {data_dir}")
    files = list(iter_pdfs(data_dir))
    if not files:
        print("처리할 PDF가 없습니다.")
        return
    print(f"- 발견한 PDF 파일 수: {len(files)}")

    print("[2/4] PDF 로드...")
    all_chunks = []
    all_ids: List[str] = []
    for pdf_path in files:
        loader = PyPDFLoader(str(pdf_path))
        docs = loader.load()  # 페이지 단위 Document
        print(f"  - {pdf_path.name}: {len(docs)} pages")
        chunks = chunk_documents(docs)
        for ch in chunks:
            src = ch.metadata.get("source", str(pdf_path))
            page = int(ch.metadata.get("page", -1))
            uid = make_id(ch.page_content, src, page)
            ch.metadata.setdefault("source", src)
            ch.metadata.setdefault("file_path", str(pdf_path))
            ch.metadata.setdefault("agent", "behavior")
            all_chunks.append(ch)
            all_ids.append(uid)

    if not all_chunks:
        print("No chunks to ingest.")
        return

    print(f"[3/4] 청킹 완료: {len(all_chunks)} chunks")
    print("[4/4] 임베딩 및 벡터스토어 적재...")
    vs.add_documents(documents=all_chunks, ids=all_ids)
    print(f"완료: behavior 컬렉션에 {len(all_chunks)}개 청크 적재 (persist: {settings.chroma_persist_dir})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest behavior PDFs into Chroma (collection: behavior)")
    parser.add_argument(
        "--data-dir",
        type=str,
        default=None,
        help="PDF 폴더 경로 (기본: be/data/behavior)",
    )
    args = parser.parse_args()

    if args.data_dir:
        data_root = Path(args.data_dir)
    else:
        be_root = Path(__file__).resolve().parents[1]
        data_root = be_root / "data" / "behavior"

    if not data_root.exists():
        raise FileNotFoundError(f"behavior 데이터 경로가 존재하지 않습니다: {data_root}")

    ingest_behavior(data_root)


if __name__ == "__main__":
    main()


