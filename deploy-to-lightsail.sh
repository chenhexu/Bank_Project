#!/bin/bash

# BlueBank Deployment Script for AWS Lightsail
echo "🚀 Deploying BlueBank to AWS Lightsail..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Install AWS CLI
echo "🔑 Installing AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Login to ECR
echo "🔐 Logging into Amazon ECR..."
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin 992848511660.dkr.ecr.us-east-1.amazonaws.com

# Pull the BlueBank image
echo "📥 Pulling BlueBank Docker image..."
sudo docker pull 992848511660.dkr.ecr.us-east-1.amazonaws.com/bluebank:latest

# Stop any existing containers
echo "🛑 Stopping existing containers..."
sudo docker stop bluebank-app 2>/dev/null || true
sudo docker rm bluebank-app 2>/dev/null || true

# Run the BlueBank application
echo "🚀 Starting BlueBank application..."
sudo docker run -d \
  --name bluebank-app \
  --restart unless-stopped \
  -p 80:80 \
  -p 8000:8000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e GMAIL_EMAIL="$GMAIL_EMAIL" \
  -e GMAIL_APP_PASSWORD="$GMAIL_APP_PASSWORD" \
  992848511660.dkr.ecr.us-east-1.amazonaws.com/bluebank:latest

# Check if container is running
echo "✅ Checking deployment status..."
sudo docker ps

echo "🎉 BlueBank deployment complete!"
echo "🌐 Your application should be available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "📊 Container logs: sudo docker logs bluebank-app" 