FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app

RUN pip install --no-cache-dir \
    redis \
    boto3 \
    requests \
    twilio

# Build context is project root, so copy simulator/ contents
COPY simulator/ ./

CMD ["python", "gps_simulator.py"]
