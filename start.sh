#!/bin/bash

# Start nginx in background
nginx

# Start the Next.js frontend server
cd /app/frontend
PORT=3000 HOSTNAME=127.0.0.1 node server.js &

# Start the backend server
cd /app/backend
uvicorn main:app --host 0.0.0.0 --port 8000 