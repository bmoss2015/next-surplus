FROM python:3.11-slim-bookworm

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --with-deps installs all Chromium system dependencies automatically,
# keeping this correct across Debian versions without a hand-maintained list.
RUN playwright install --with-deps chromium

COPY . .

# PORT is injected by Railway; default to 8000 locally
ENV PORT=8000

EXPOSE $PORT

CMD uvicorn main:app --host 0.0.0.0 --port $PORT
