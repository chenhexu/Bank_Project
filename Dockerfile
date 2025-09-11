# Multi-stage Dockerfile for BlueBank
FROM node:18 AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
# Do not bake API base into image; default to window.location.origin at runtime
RUN npm run build

# Backend stage
FROM python:3.11-slim AS backend-builder

WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

# Final stage
FROM python:3.11-slim

# Install nginx, nodejs, supervisor, and backend dependencies
RUN apt-get update && apt-get install -y nginx nodejs npm supervisor && \
    pip install uvicorn && \
    mkdir -p /var/log/supervisor

# Copy backend requirements and install dependencies
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy frontend build
COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/.next/static
COPY --from=frontend-builder /app/frontend/public /app/frontend/public

# Copy backend
COPY --from=backend-builder /app/backend /app/backend

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

WORKDIR /app

EXPOSE 80 8000

CMD ["/start.sh"] 