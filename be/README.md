# FastAPI 백엔드 (be)

간단한 FastAPI 기본 구조입니다. 로컬 개발 환경에서 바로 실행할 수 있도록 필요한 의존성과 예시 라우터(헬스체크)를 포함합니다.

## 요구사항

- Python 3.11+

## 설치

```bash
cd be
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

## 실행

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

실행 후 문서:

- OpenAPI Docs: http://localhost:8000/docs
- Redoc: http://localhost:8000/redoc
- Health Check: http://localhost:8000/api/v1/health

## 환경변수 설정

`.env` 파일을 루트(`be/`)에 생성하면 자동으로 로드됩니다. 예시는 `env.example` 참고.

예시 키:

- `PROJECT_NAME`, `VERSION`, `HOST`, `PORT`, `ALLOW_ORIGINS`

## 디렉터리 구조

```
be/
  ├─ app/
  │   ├─ api/
  │   │   └─ v1/
  │   │       └─ health.py
  │   ├─ core/
  │   │   └─ config.py
  │   └─ main.py
  ├─ env.example
  └─ requirements.txt
```
