#!/bin/bash

# BlueBank Universal Setup Script
# Works on Linux, Mac, and Windows (with WSL)

set -e  # Exit on any error

echo "🏦 BlueBank Setup Script"
echo "=========================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running."
    echo "Please start Docker Desktop and wait for it to fully initialize."
    exit 1
fi

echo "✅ Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not available."
    echo "Please install Docker Compose or update Docker Desktop."
    exit 1
fi

echo "✅ Docker Compose is available"

# Create environment file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating environment file..."
    if [ -f "backend/env.template" ]; then
        cp backend/env.template backend/.env
        echo "✅ Environment file created from template"
        echo "💡 You can edit backend/.env to configure email and OAuth settings"
    else
        echo "⚠️  No env.template found, creating basic .env file"
        cat > backend/.env << EOF
# BlueBank Environment Configuration
# Edit this file to configure your settings

# Email Configuration (Optional)
GMAIL_EMAIL="your_gmail_email@gmail.com"
GMAIL_APP_PASSWORD="your_gmail_app_password_here"

# Database Configuration
DATABASE_URL="sqlite:///./bank_users.db"

# Application Settings
DEBUG=true
ENVIRONMENT=development
EOF
    fi
fi

# Build and start the containers
echo "🚀 Building and starting BlueBank containers..."
docker-compose -f docker/docker-compose.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check if services are running
echo "🔍 Checking service status..."
if docker-compose -f docker/docker-compose.yml ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🎉 BlueBank is ready!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📚 API Documentation: http://localhost:8000/docs"
    echo ""
    echo "📋 Useful commands:"
    echo "  - View logs: docker-compose -f docker/docker-compose.yml logs -f"
    echo "  - Stop services: docker-compose -f docker/docker-compose.yml down"
    echo "  - Restart services: docker-compose -f docker/docker-compose.yml restart"
    echo "  - Development mode: docker-compose -f docker/docker-compose.dev.yml up --build -d"
    echo ""
    echo "💡 Next steps:"
    echo "  1. Open http://localhost:3000 in your browser"
    echo "  2. Register a new account"
    echo "  3. Test the banking features"
    echo "  4. Explore the dark mode toggle"
else
    echo "❌ Services failed to start properly"
    echo "📋 Checking logs..."
    docker-compose logs
    exit 1
fi 