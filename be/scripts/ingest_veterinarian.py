from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Iterable, List, Tuple

from tqdm import tqdm
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma

from core.config import get_settings
from services.llm import get_embeddings_model


def iter_json_files(root: Path) -> Iterable[Path]:
    for p in sorted(root.rglob("*.json")):
        if p.is_file():
            yield p


def normalize_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        try:
            return json.dumps(value, ensure_ascii=False)
        except Exception:
            return str(value)
    return str(value)


def build_text_from_record(data: dict) -> Tuple[str, dict]:
    """레코드(JSON)에서 본문 텍스트와 메타데이터를 생성합니다."""
    title = normalize_text(data.get("title"))
    author = normalize_text(data.get("author"))
    publisher = normalize_text(data.get("publisher"))
    department = normalize_text(data.get("department"))
    disease = normalize_text(data.get("disease"))

    header_lines = []
    if title:
        header_lines.append(f"제목: {title}")
    if author:
        header_lines.append(f"저자: {author}")
    if publisher:
        header_lines.append(f"출판: {publisher}")
    if department:
        header_lines.append(f"진료과: {department}")

    header = "\n".join(header_lines).strip()
    body = disease or ""
    text = f"{header}\n\n{body}" if header else body

    metadata = {
        "title": title or None,
        "author": author or None,
        "publisher": publisher or None,
        "department": department or None,
        "agent": "veterinarian",
    }
    return text, metadata


def chunk_documents(docs: List[Document], chunk_size: int = 1200, chunk_overlap: int = 200) -> List[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""],
    )
    return splitter.split_documents(docs)


def make_id(text: str, source: str, idx: int) -> str:
    h = hashlib.sha256()
    h.update(text.encode("utf-8"))
    h.update(str(source).encode("utf-8"))
    h.update(str(idx).encode("utf-8"))
    return h.hexdigest()


def ingest_veterinarian(data_dir: Path) -> None:
    settings = get_settings()
    embeddings = get_embeddings_model(settings)
    vs = Chroma(
        collection_name="veterinarian",
        persist_directory=settings.chroma_persist_dir,
        embedding_function=embeddings,
    )

    print(f"[1/4] 스캔 시작: {data_dir}")
    files = list(iter_json_files(data_dir))
    if not files:
        print("처리할 JSON 파일이 없습니다.")
        return
    print(f"- 발견한 JSON 파일 수: {len(files)}")

    print("[2/4] 문서 로드 및 생성...")
    base_docs: List[Document] = []
    for fp in tqdm(files, desc="loading", unit="file"):
        try:
            raw = json.loads(fp.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"! JSON 파싱 실패: {fp} ({e})")
            continue
        text, meta = build_text_from_record(raw or {})
        if not text.strip():
            continue
        meta.update({
            "source": str(fp),
            "file_path": str(fp),
        })
        base_docs.append(Document(page_content=text, metadata=meta))

    if not base_docs:
        print("로드된 문서가 없습니다.")
        return
    print(f"- 로드된 문서 수: {len(base_docs)}")

    print("[3/4] 청킹 진행 (1200/200)...")
    chunks = chunk_documents(base_docs)
    print(f"- 생성된 청크 수: {len(chunks)}")

    print("[4/4] 임베딩 및 벡터스토어 적재 (배치) ...")
    ids: List[str] = []
    for i, ch in enumerate(chunks):
        src = ch.metadata.get("source") or ch.metadata.get("file_path") or "veterinarian.json"
        ids.append(make_id(ch.page_content, src, i))

    # 배치 크기 조절로 OpenAI 임베딩 토큰 한도를 회피
    batch_size = 64
    total = len(chunks)
    num_batches = (total + batch_size - 1) // batch_size
    for bi in tqdm(range(num_batches), desc="embedding+batches", unit="batch"):
        start = bi * batch_size
        end = min(start + batch_size, total)
        batch_docs = chunks[start:end]
        batch_ids = ids[start:end]
        vs.add_documents(documents=batch_docs, ids=batch_ids)
    print(f"완료: veterinarian 컬렉션에 {len(chunks)}개 청크 적재 (persist: {settings.chroma_persist_dir})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest veterinarian JSONs into Chroma (collection: veterinarian)")
    parser.add_argument(
        "--data-dir",
        type=str,
        default=None,
        help="JSON 루트 디렉터리 (기본: be/data/veterinarian)",
    )
    args = parser.parse_args()

    if args.data_dir:
        data_root = Path(args.data_dir)
    else:
        be_root = Path(__file__).resolve().parents[1]
        data_root = be_root / "data" / "veterinarian"

    if not data_root.exists():
        raise FileNotFoundError(f"veterinarian 데이터 경로가 존재하지 않습니다: {data_root}")

    ingest_veterinarian(data_root)


if __name__ == "__main__":
    main()


