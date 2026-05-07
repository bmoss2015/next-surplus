FROM python:3.11-slim

WORKDIR /app

# System libraries required by Playwright Chromium and pdfplumber
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright Chromium browser after Python dependencies
RUN playwright install --with-deps chromium

COPY . .

# PORT is injected by Railway; default to 8000 locally
ENV PORT=8000

EXPOSE $PORT

CMD uvicorn main:app --host 0.0.0.0 --port $PORT
