# BlueBank AWS Elastic Beanstalk Deployment Script (PowerShell)
Write-Host "🚀 Starting BlueBank AWS deployment..." -ForegroundColor Green

# Check if EB CLI is installed
try {
    $ebVersion = eb --version
    Write-Host "✅ Elastic Beanstalk CLI found: $ebVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Elastic Beanstalk CLI not found. Installing..." -ForegroundColor Yellow
    pip install awsebcli
}

# Check if AWS credentials are configured
try {
    $caller = aws sts get-caller-identity
    Write-Host "✅ AWS credentials configured" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Build and push Docker image
Write-Host "🐳 Building and pushing Docker image..." -ForegroundColor Yellow
docker build -t chenhexu/bluebank:latest .
docker push chenhexu/bluebank:latest

# Initialize EB application if not exists
if (-not (Test-Path ".elasticbeanstalk")) {
    Write-Host "📱 Initializing Elastic Beanstalk application..." -ForegroundColor Yellow
    eb init bluebank --platform docker --region us-east-1
}

# Create environment if not exists
Write-Host "🌍 Creating/updating Elastic Beanstalk environment..." -ForegroundColor Yellow
eb create bluebank-prod --instance-type t3.micro --single-instance

# Deploy the application
Write-Host "🚀 Deploying to Elastic Beanstalk..." -ForegroundColor Yellow
eb deploy

Write-Host "✅ Deployment complete! Your app should be available at:" -ForegroundColor Green
eb status | Select-String "CNAME" 