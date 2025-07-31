#!/bin/bash

# Start nginx in background
nginx

# Start the backend server
cd /app/backend
uvicorn main:app --host 0.0.0.0 --port 8000 