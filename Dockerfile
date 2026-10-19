# Stage 1: Build Frontend SPA
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend + Frontend Distribution
FROM python:3.12-slim
WORKDIR /app

# Install curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/pyproject.toml ./backend/
RUN pip install --no-cache-dir -e ./backend

# Copy backend source code and migrations
COPY backend/ ./backend/

# Copy local ONNX models
COPY models/ ./models/

# Copy built frontend distribution from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend_dist

# Set production environment variables
ENV APP_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=8000 \
    PORT=8000 \
    STORAGE_ROOT=/app/storage \
    DATABASE_URL=sqlite:////app/data/haven.db \
    AI_MODEL_PATH=/app/models/ai-image-detect-distilled/model_quantized.onnx \
    PYTHONUNBUFFERED=1

# Ensure runtime storage and data directories exist
RUN mkdir -p /app/storage /app/data

EXPOSE 8000

# Start unified application on the port provided by the host environment
CMD ["sh", "-c", "cd backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
