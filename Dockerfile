# Production Dockerfile for TutorTrace Backend
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt* ./
RUN pip install --no-cache-dir \
    flask \
    flask-cors \
    flask-limiter \
    flask-restx \
    flask-mail \
    python-dotenv \
    textblob \
    psycopg2-binary \
    redis \
    pyjwt \
    scikit-learn \
    pandas \
    numpy \
    joblib \
    openai \
    google-api-python-client \
    gunicorn

# Download NLTK data required by TextBlob
RUN python -m textblob.download_corpora

# Copy application files
COPY . .

# Set non-root user for security
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 5000

# Run with Gunicorn (4 worker threads, production WSGI) supporting dynamic cloud PORT
CMD ["sh", "-c", "gunicorn --workers 4 --bind 0.0.0.0:${PORT:-5000} --timeout 60 app:app"]
