@echo off
echo 🚀 Starting BlueBank Docker Setup...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Build and start the containers
echo 📦 Building and starting containers...
docker-compose -f docker/docker-compose.yml up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check if services are running
echo 🔍 Checking service status...
docker-compose -f docker/docker-compose.yml ps

echo.
echo ✅ BlueBank is starting up!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo.
echo 📋 Useful commands:
echo   - View logs: docker-compose -f docker/docker-compose.yml logs -f
echo   - Stop services: docker-compose -f docker/docker-compose.yml down
echo   - Restart services: docker-compose -f docker/docker-compose.yml restart
echo   - Rebuild: docker-compose -f docker/docker-compose.yml up --build -d
echo.
pause 