#!/bin/bash

echo "🚀 Starting BlueBank Docker Setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build and start the containers
echo "📦 Building and starting containers..."
docker-compose -f docker/docker-compose.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose -f docker/docker-compose.yml ps

echo "✅ BlueBank is starting up!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo ""
echo "📋 Useful commands:"
echo "  - View logs: docker-compose -f docker/docker-compose.yml logs -f"
echo "  - Stop services: docker-compose -f docker/docker-compose.yml down"
echo "  - Restart services: docker-compose -f docker/docker-compose.yml restart"
echo "  - Rebuild: docker-compose -f docker/docker-compose.yml up --build -d" 