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
    for p in sorted(root.glob("*.pdf")):
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


def ingest_nutrition(data_dir: Path) -> None:
    settings = get_settings()
    embeddings = get_embeddings_model(settings)

    # nutrition 컬렉션을 대상으로 함
    vs = Chroma(
        collection_name="nutrition",
        persist_directory=settings.chroma_persist_dir,
        embedding_function=embeddings,
    )

    all_chunks = []
    all_ids: List[str] = []
    for pdf_path in iter_pdfs(data_dir):
        loader = PyPDFLoader(str(pdf_path))
        docs = loader.load()  # 각 페이지 단위 Document, metadata에 source/page 포함
        chunks = chunk_documents(docs)
        for ch in chunks:
            src = ch.metadata.get("source", str(pdf_path))
            page = int(ch.metadata.get("page", -1))
            uid = make_id(ch.page_content, src, page)
            ch.metadata.setdefault("source", src)
            ch.metadata.setdefault("file_path", str(pdf_path))
            ch.metadata.setdefault("agent", "nutrition")
            all_chunks.append(ch)
            all_ids.append(uid)

    if not all_chunks:
        print("No chunks to ingest.")
        return

    vs.add_documents(documents=all_chunks, ids=all_ids)
    # Chroma 0.5.x는 같은 persist_directory로 재초기화 시 컬렉션이 유지됨
    print(f"Ingested {len(all_chunks)} chunks into collection 'nutrition' at {settings.chroma_persist_dir}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest nutrition PDFs into Chroma (collection: nutrition)")
    parser.add_argument(
        "--data-dir",
        type=str,
        default=None,
        help="PDF 폴더 경로 (기본: 프로젝트 루트의 data/nutrition)",
    )
    args = parser.parse_args()

    # 프로젝트 루트 추정 후 기본 경로 구성
    if args.data_dir:
        data_root = Path(args.data_dir)
    else:
        # 기본: be/data/nutrition
        be_root = Path(__file__).resolve().parents[1]
        data_root = be_root / "data" / "nutrition"

    if not data_root.exists():
        raise FileNotFoundError(f"nutrition 데이터 경로가 존재하지 않습니다: {data_root}")

    ingest_nutrition(data_root)


if __name__ == "__main__":
    main()


