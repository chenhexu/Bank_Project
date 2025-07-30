# BlueBank PowerShell Setup Script
# For Windows users

Write-Host "🏦 BlueBank Setup Script" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed." -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and wait for it to fully initialize." -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose is available
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose is available: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ docker-compose is not available." -ForegroundColor Red
    Write-Host "Please install Docker Compose or update Docker Desktop." -ForegroundColor Yellow
    exit 1
}

# Create environment file if it doesn't exist
if (-not (Test-Path "backend\.env")) {
    Write-Host "📝 Creating environment file..." -ForegroundColor Yellow
    if (Test-Path "backend\env.template") {
        Copy-Item "backend\env.template" "backend\.env"
        Write-Host "✅ Environment file created from template" -ForegroundColor Green
        Write-Host "💡 You can edit backend\.env to configure email and OAuth settings" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  No env.template found, creating basic .env file" -ForegroundColor Yellow
        @"
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
"@ | Out-File -FilePath "backend\.env" -Encoding UTF8
    }
}

# Build and start the containers
Write-Host "🚀 Building and starting BlueBank containers..." -ForegroundColor Yellow
docker-compose -f docker/docker-compose.yml up --build -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check if services are running
Write-Host "🔍 Checking service status..." -ForegroundColor Yellow
$services = docker-compose -f docker/docker-compose.yml ps
if ($services -match "Up") {
    Write-Host "✅ Services are running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 BlueBank is ready!" -ForegroundColor Green
    Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "📚 API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Useful commands:" -ForegroundColor Yellow
    Write-Host "  - View logs: docker-compose -f docker/docker-compose.yml logs -f" -ForegroundColor White
    Write-Host "  - Stop services: docker-compose -f docker/docker-compose.yml down" -ForegroundColor White
    Write-Host "  - Restart services: docker-compose -f docker/docker-compose.yml restart" -ForegroundColor White
    Write-Host "  - Development mode: docker-compose -f docker/docker-compose.dev.yml up --build -d" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Open http://localhost:3000 in your browser" -ForegroundColor White
    Write-Host "  2. Register a new account" -ForegroundColor White
    Write-Host "  3. Test the banking features" -ForegroundColor White
    Write-Host "  4. Explore the dark mode toggle" -ForegroundColor White
} else {
    Write-Host "❌ Services failed to start properly" -ForegroundColor Red
    Write-Host "📋 Checking logs..." -ForegroundColor Yellow
    docker-compose logs
    exit 1
} 