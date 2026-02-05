FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu


RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /install

COPY requirements.txt .

RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir --prefer-binary --no-compile -r requirements.txt \
    && find /install -name "tests" -type d -exec rm -rf {} + \
    && find /install -name "__pycache__" -type d -exec rm -rf {} +

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HF_HOME=/app/hf_cache \
    TRANSFORMERS_OFFLINE=1 \
    VOSK_MODEL_PATH=/app/vosk-model-small-en-us-0.15

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    unzip \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /install /usr/local

COPY backend ./backend


RUN curl -L -o /tmp/vosk.zip https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip \
    && unzip /tmp/vosk.zip -d /app \
    && rm /tmp/vosk.zip


RUN python - <<EOF
from sentence_transformers import SentenceTransformer
SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", device="cpu")
EOF

RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser /app

USER appuser

EXPOSE 8000

CMD ["gunicorn", "backend.run:app", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "2", "--timeout", "180"]