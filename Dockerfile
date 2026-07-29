FROM python:3.12-slim-bookworm

WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY frontend/ ./frontend/

ENV HOST=0.0.0.0
ENV PORT=8001
EXPOSE 8001

CMD ["sh", "-c", "export HOST=${HOST:-0.0.0.0}; export PORT=${PORT:-8001}; exec python3 -m uvicorn backend.main:app --host \"$HOST\" --port \"$PORT\""]
