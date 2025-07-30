@echo off
echo 🚀 Starting BlueBank Development Setup...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Build and start the containers in development mode
echo 📦 Building and starting containers in development mode...
docker-compose -f docker/docker-compose.dev.yml up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 15 /nobreak >nul

REM Check if services are running
echo 🔍 Checking service status...
docker-compose -f docker/docker-compose.dev.yml ps

echo.
echo ✅ BlueBank Development is starting up!
echo 🌐 Frontend: http://localhost:3000 (with hot reloading)
echo 🔧 Backend API: http://localhost:8000 (with auto-reload)
echo.
echo 📋 Useful commands:
echo   - View logs: docker-compose -f docker/docker-compose.dev.yml logs -f
echo   - Stop services: docker-compose -f docker/docker-compose.dev.yml down
echo   - Restart services: docker-compose -f docker/docker-compose.dev.yml restart
echo   - Rebuild: docker-compose -f docker/docker-compose.dev.yml up --build -d
echo.
echo 💡 Development mode includes:
echo   - Hot reloading for frontend changes
echo   - Auto-reload for backend changes
echo   - Volume mounts for live code editing
echo.
pause 