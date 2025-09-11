#!/bin/bash
# Simple BlueBank Deployment Script
echo "🚀 Deploying BlueBank to AWS Lightsail..."

# Update system
sudo apt-get update -y && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install Nginx and Certbot
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Configure Nginx
sudo tee /etc/nginx/sites-available/bluebank << 'EOF'
server {
    listen 80;
    server_name _;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/bluebank /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

# Login to ECR and pull image
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin 992848511660.dkr.ecr.us-east-1.amazonaws.com
sudo docker pull 992848511660.dkr.ecr.us-east-1.amazonaws.com/bluebank:latest

# Stop old containers and run new one
sudo docker stop bluebank-app 2>/dev/null || true
sudo docker rm bluebank-app 2>/dev/null || true

sudo docker run -d \
  --name bluebank-app \
  --restart unless-stopped \
  -p 80:80 \
  -p 8000:8000 \
  992848511660.dkr.ecr.us-east-1.amazonaws.com/bluebank:latest

sleep 10
sudo docker ps

PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "🎉 BlueBank deployed at: http://$PUBLIC_IP"
echo "🔒 To enable HTTPS, run: sudo certbot --nginx -d $PUBLIC_IP" 