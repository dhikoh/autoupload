# ── AutoPost Hub Backend ──
FROM python:3.12-slim

WORKDIR /app

# Install system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p uploads/proofs data

# Non-root user for security
RUN adduser --disabled-password --gecos "" appuser \
    && chown -R appuser:appuser /app
USER appuser

# Primary worker marker — APScheduler only starts on WORKER_ID=0
ENV WORKER_ID=0

# Expose port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# NOTE: Using 1 worker for SQLite compatibility.
# To use multiple workers with PostgreSQL:
#   Set DATABASE_URL=postgresql://... in env and change --workers to 2 or more.
#   Only WORKER_ID=0 instance will run APScheduler (set WORKER_ID=1,2,... on others).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
