# Use official lightweight Python image
FROM python:3.11-slim

# Prevent Python from writing .pyc files & enable unbuffered logging for Cloud Run / Docker
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

# Set container working directory
WORKDIR /app

# Install system dependencies if required (kept minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first for optimal Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create a non-privileged user for enhanced container security
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser

# Copy application source code
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

# Expose service port (Google Cloud Run defaults to 8080)
EXPOSE 8080

# Production launch command with Gunicorn
# Timeout is set to 0 to allow Cloud Run to handle scaling timeouts
CMD exec gunicorn --bind :${PORT:-8080} --workers 1 --threads 8 --timeout 0 main:app
