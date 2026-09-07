FROM python:3.12-slim

WORKDIR /app

# Install dependencies first so this layer is cached across code changes
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app — flat structure, so this is just the files at the root
COPY main.py .
COPY model.joblib .

# Render (and most PaaS hosts) inject $PORT at runtime; 8000 is the local default
EXPOSE 8000
ENV PORT=8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
