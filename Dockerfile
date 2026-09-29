# Multi-stage Dockerfile for SIH 26067 OceanIQ
# -------------------------------------------------------------
# Stage 1: Build Vite Frontend Assets
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Python Backend & Runtime
FROM python:3.13-slim
WORKDIR /app

# System dependencies for scientific packages & netCDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnetcdf-dev \
    libhdf5-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend code & pre-loaded data
COPY backend ./backend

# Copy built frontend production bundle
COPY --from=frontend-builder /app/dist ./dist

# Set environment
ENV PORT=8000
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend:/app

EXPOSE 8000

# Start FastAPI backend
CMD ["sh", "-c", "python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port ${PORT:-8000}"]
