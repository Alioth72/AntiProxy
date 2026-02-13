FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8080

ENV DB_PATH=/app/data/bt_checkin.db
ENV API_KEY=change-me
ENV ALLOWED_ORIGINS=*
ENV PORT=8080

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]


