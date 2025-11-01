PROJECT_NAME := shallow-mind
IMAGE        ?= $(PROJECT_NAME):latest
ENV_FILE     ?= .env
PORT         ?= 8000
MESSAGE      ?= 안녕하세요

.PHONY: help venv install run run-dev docker-build docker-run docker-run-dev docker-stop docker-rebuild clean call front

help:
	@echo "Available targets:"
	@echo "  venv            - Create local Python virtualenv (.venv)"
	@echo "  install         - Install Python dependencies into .venv"
	@echo "  run             - Run FastAPI locally via uvicorn"
	@echo "  run-dev         - Run FastAPI locally with hot reload"
	@echo "  docker-build    - Build Docker image ($(IMAGE))"
	@echo "  docker-run      - Run container with --env-file $(ENV_FILE) and port $(PORT)"
	@echo "  docker-run-dev  - Run container with bind mount and --reload for dev"
	@echo "  docker-stop     - Stop running container(s) derived from $(IMAGE)"
	@echo "  docker-rebuild  - Stop, build, and run the Docker image"
	@echo "  clean           - Remove .venv and __pycache__"
	@echo "  call            - Sample curl call to /v1/api/message"
	@echo "  front           - Open test frontend (frontend.html)"

venv:
	python3 -m venv .venv

install: venv
	./.venv/bin/pip install --upgrade pip
	./.venv/bin/pip install -r requirements.txt

run:
	./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $(PORT)

run-dev:
	./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $(PORT) --reload \
	  --reload-dir app --reload-dir api --reload-dir services --reload-dir graph --reload-dir core

docker-build:
	docker build -t $(IMAGE) .

docker-run:
	docker run --rm --env-file $(ENV_FILE) -p $(PORT):8000 $(IMAGE)

docker-run-dev:
	docker run --rm --env-file $(ENV_FILE) -p $(PORT):8000 \
	  -v $(PWD):/app $(IMAGE) \
	  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload \
	  --reload-dir app --reload-dir api --reload-dir services --reload-dir graph --reload-dir core

docker-stop:
	@docker ps -q --filter ancestor=$(IMAGE) | xargs -r docker stop

docker-rebuild: docker-stop docker-build docker-run

clean:
	rm -rf .venv
	find . -type d -name __pycache__ -exec rm -rf {} +

call:
	@curl -sS -X POST http://localhost:$(PORT)/v1/api/message \
	  -H 'Content-Type: application/json' \
	  -d '{"message":"$(MESSAGE)"}' | jq .

front:
	@echo "Opening frontend.html..."
	@open frontend.html

