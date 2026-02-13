# Dockerfile
# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies AND build tools needed by some Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application's code from the host to the container at /app
COPY . .

# Create directories for uploads and models if they are needed
RUN mkdir -p uploads logs models

# Set environment variables for Flask
ENV FLASK_APP=app.py
ENV FLASK_DEBUG=false
ENV HOST=0.0.0.0
ENV PORT=8080

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Health check to ensure the container is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Define the command to run the application
CMD ["python", "app.py"]