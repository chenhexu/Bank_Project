#!/bin/bash
# BlueBank Deployment Script for AWS Lightsail with HTTPS
echo "🚀 Deploying BlueBank to AWS Lightsail with HTTPS..."

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

# Install Nginx and Certbot for HTTPS
echo "🔒 Installing Nginx and Certbot for HTTPS..."
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Configure Nginx for HTTPS
echo "⚙️ Configuring Nginx for HTTPS..."
sudo tee /etc/nginx/sites-available/bluebank << EOF
server {
    listen 80;
    server_name _;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;
    
    # SSL configuration will be added by Certbot
    
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/bluebank /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

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
  992848511660.dkr.ecr.us-east-1.amazonaws.com/bluebank:latest

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 10

# Check if container is running
echo "✅ Checking deployment status..."
sudo docker ps

# Get the public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo "🎉 BlueBank deployment complete!"
echo "🌐 Your application is available at: http://$PUBLIC_IP"
echo ""
echo "🔒 Now let's enable HTTPS with Let's Encrypt..."
echo "📧 You'll need to provide an email address for SSL certificate notifications"
echo ""

# Prompt for email
read -p "Enter your email address for SSL notifications: " EMAIL

if [ ! -z "$EMAIL" ]; then
    echo "🔐 Generating SSL certificate with Let's Encrypt..."
    sudo certbot --nginx -d $PUBLIC_IP -m $EMAIL --agree-tos --non-interactive
    
    if [ $? -eq 0 ]; then
        echo "✅ HTTPS enabled successfully!"
        echo "🔒 Your secure site: https://$PUBLIC_IP"
        echo "🔄 SSL certificate will auto-renew every 90 days"
    else
        echo "⚠️ SSL certificate generation failed. You can try manually later with:"
        echo "   sudo certbot --nginx -d $PUBLIC_IP"
    fi
else
    echo "⚠️ No email provided. You can enable HTTPS later with:"
    echo "   sudo certbot --nginx -d $PUBLIC_IP"
fi

echo ""
echo "📊 Useful commands:"
echo "   Container logs: sudo docker logs bluebank-app"
echo "   Nginx logs: sudo tail -f /var/log/nginx/access.log"
echo "   SSL status: sudo certbot certificates"
echo "   Test SSL: sudo certbot renew --dry-run" 