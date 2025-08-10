#!/bin/bash

# BlueBank AWS Elastic Beanstalk Deployment Script
echo "🚀 Starting BlueBank AWS deployment..."

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo "❌ Elastic Beanstalk CLI not found. Installing..."
    pip install awsebcli
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Build and push Docker image
echo "🐳 Building and pushing Docker image..."
docker build -t chenhexu/bluebank:latest .
docker push chenhexu/bluebank:latest

# Initialize EB application if not exists
if [ ! -d ".elasticbeanstalk" ]; then
    echo "📱 Initializing Elastic Beanstalk application..."
    eb init bluebank --platform docker --region us-east-1
fi

# Create environment if not exists
echo "🌍 Creating/updating Elastic Beanstalk environment..."
eb create bluebank-prod --instance-type t3.micro --single-instance

# Deploy the application
echo "🚀 Deploying to Elastic Beanstalk..."
eb deploy

echo "✅ Deployment complete! Your app should be available at:"
eb status | grep CNAME 