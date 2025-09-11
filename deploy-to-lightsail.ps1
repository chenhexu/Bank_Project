# BlueBank Deployment Script for AWS Lightsail
Write-Host "🚀 Deploying BlueBank to AWS Lightsail..." -ForegroundColor Green

# Get the instance details
Write-Host "📋 Getting instance details..." -ForegroundColor Yellow
$instance = aws lightsail get-instances --query "instances[0]" --output json | ConvertFrom-Json

if (-not $instance) {
    Write-Host "❌ No running instances found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found instance: $($instance.name) at $($instance.publicIpAddress)" -ForegroundColor Green

# Create a deployment script for the instance
Write-Host "📝 Creating deployment script..." -ForegroundColor Yellow
$deploymentScript = @"
#!/bin/bash
# BlueBank Deployment Script
echo '🚀 Deploying BlueBank to AWS Lightsail...'

# Update system
echo '📦 Updating system packages...'
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Docker
echo '🐳 Installing Docker...'
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository 'deb [arch=amd64] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable'
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Install AWS CLI
echo '🔑 Installing AWS CLI...'
curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'
unzip awscliv2.zip
sudo ./aws/install

# Login to ECR
echo '🔐 Logging into Amazon ECR...'
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin 992848511660.dkr.ecr.us-east-1.amazonaws.com

# Pull the BlueBank image
echo '📥 Pulling BlueBank Docker image...'
sudo docker pull 992848511660.dkr.ecr.us-east-1.amazonaws.com/bluebank:latest

# Stop any existing containers
echo '🛑 Stopping existing containers...'
sudo docker stop bluebank-app 2>/dev/null || true
sudo docker rm bluebank-app 2>/dev/null || true

# Run the BlueBank application
echo '🚀 Starting BlueBank application...'
sudo docker run -d \
  --name bluebank-app \
  --restart unless-stopped \
  -p 80:80 \
  -p 8000:8000 \
  992848511660.dkr.ecr.us-east-1.amazonaws.com/bluebank:latest

# Check if container is running
echo '✅ Checking deployment status...'
sudo docker ps

echo '🎉 BlueBank deployment complete!'
echo '🌐 Your application should be available at: http://$($instance.publicIpAddress)'
echo '📊 Container logs: sudo docker logs bluebank-app'
"@

# Save the script to a file
$deploymentScript | Out-File -FilePath "deploy-script.sh" -Encoding UTF8

Write-Host "✅ Deployment script created: deploy-script.sh" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy deploy-script.sh to your Lightsail instance" -ForegroundColor White
Write-Host "2. SSH into your instance: ssh -i lightsail-key.pem ubuntu@$($instance.publicIpAddress)" -ForegroundColor White
Write-Host "3. Run: chmod +x deploy-script.sh && ./deploy-script.sh" -ForegroundColor White
Write-Host "4. Your app will be available at: http://$($instance.publicIpAddress)" -ForegroundColor White 