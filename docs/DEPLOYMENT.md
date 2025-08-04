# 🚀 BlueBank Deployment Guide

This guide covers deploying BlueBank in various environments, from local development to production cloud deployment.

## 📋 Prerequisites

- Docker Desktop installed and running
- Git (for cloning the repository)
- 4GB+ RAM recommended

## 🏠 Local Development

### Quick Start (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd Bank_Project

# One-click setup
# Windows:
run.bat

# Linux/Mac:
chmod +x run.sh
./run.sh
```

### Manual Setup
```bash
# Production mode
docker-compose up --build -d

# Development mode (with hot reloading)
docker-compose -f docker-compose.dev.yml up --build -d
```

## ☁️ Cloud Deployment

### Option 1: Docker Compose on VPS

1. **Prepare your server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Deploy the application**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd Bank_Project
   
   # Configure environment
   cp backend/env.template backend/.env
   nano backend/.env  # Edit with your settings
   
   # Start services
   docker-compose up --build -d
   ```

3. **Set up reverse proxy (nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /api {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Option 2: AWS EC2

1. **Launch EC2 instance**
   - Choose Ubuntu 20.04 LTS
   - t3.medium or larger
   - Configure security groups (ports 22, 80, 443)

2. **Install Docker**
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker $USER
   ```

3. **Deploy application**
   ```bash
   git clone <repository-url>
   cd Bank_Project
   cp backend/env.template backend/.env
   # Edit backend/.env with production settings
   docker-compose up --build -d
   ```

### Option 3: Google Cloud Platform

1. **Create Compute Engine instance**
   ```bash
   gcloud compute instances create bluebank \
     --zone=us-central1-a \
     --machine-type=e2-medium \
     --image-family=ubuntu-2004-lts \
     --image-project=ubuntu-os-cloud
   ```

2. **Install and deploy**
   ```bash
   # SSH into instance
   gcloud compute ssh bluebank --zone=us-central1-a
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Deploy application
   git clone <repository-url>
   cd Bank_Project
   docker-compose up --build -d
   ```

### Option 4: DigitalOcean Droplet

1. **Create droplet**
   - Choose Ubuntu 20.04
   - Basic plan ($12/month minimum)
   - Add SSH key

2. **Deploy application**
   ```bash
   # SSH into droplet
   ssh root@your-droplet-ip
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Deploy BlueBank
   git clone <repository-url>
   cd Bank_Project
   docker-compose up --build -d
   ```

## 🔐 Production Configuration

### Environment Variables
Create `backend/.env` with production settings:

```env
# Database (use PostgreSQL for production)
DATABASE_URL="postgresql://user:password@localhost/bluebank"

# Email Configuration
GMAIL_EMAIL="your-production-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"

# OAuth (if using)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# Application Settings
DEBUG=false
ENVIRONMENT=production
```

### SSL/HTTPS Setup

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Get SSL certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Database Setup

The application uses AWS PostgreSQL cloud database by default. For production deployments, you can use the same cloud database or set up your own PostgreSQL instance:

1. **Using the cloud database (recommended)**
   ```env
   DATABASE_URL=postgresql://postgres:UxI:dxl81yG]uBK:rU<U<sUdm5EZ@bluebank-db.ca76eoy2kz8t.us-east-1.rds.amazonaws.com:5432/postgres
   ```

2. **For custom PostgreSQL setup, add PostgreSQL service to docker-compose.yml**
   ```yaml
   services:
     postgres:
       image: postgres:13
       environment:
         POSTGRES_DB: bluebank
         POSTGRES_USER: bluebank
         POSTGRES_PASSWORD: your-secure-password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"
   ```

3. **Update backend requirements.txt**
   ```
   psycopg2-binary==2.9.5
   ```

## 📊 Monitoring & Logging

### Basic Monitoring
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Monitor resources
docker stats
```

### Advanced Monitoring
1. **Prometheus + Grafana**
   ```yaml
   # Add to docker-compose.yml
   prometheus:
     image: prom/prometheus
     ports:
       - "9090:9090"
   
   grafana:
     image: grafana/grafana
     ports:
       - "3001:3000"
   ```

2. **ELK Stack for logging**
   ```yaml
   elasticsearch:
     image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
   
   logstash:
     image: docker.elastic.co/logstash/logstash:7.17.0
   
   kibana:
     image: docker.elastic.co/kibana/kibana:7.17.0
   ```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy BlueBank

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /path/to/bluebank
          git pull
          docker-compose down
          docker-compose up --build -d
```

## 🛡️ Security Best Practices

1. **Firewall Configuration**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

2. **Regular Updates**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Update Docker images
   docker-compose pull
   docker-compose up -d
   ```

3. **Backup Strategy**
   ```bash
   # Backup database
   docker-compose exec postgres pg_dump -U bluebank bluebank > backup.sql
   
   # Backup application
   tar -czf bluebank-backup-$(date +%Y%m%d).tar.gz .
   ```

## 📈 Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml
services:
  frontend:
    deploy:
      replicas: 3
  
  backend:
    deploy:
      replicas: 3
```

### Load Balancer
```nginx
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

upstream frontend {
    server frontend1:3000;
    server frontend2:3000;
    server frontend3:3000;
}
```

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using ports
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :443
   ```

2. **Docker daemon issues**
   ```bash
   # Restart Docker
   sudo systemctl restart docker
   ```

3. **Disk space**
   ```bash
   # Clean up Docker
   docker system prune -a
   ```

### Performance Tuning

1. **Database optimization**
   ```sql
   -- Add indexes
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_transactions_username ON transactions(username);
   ```

2. **Application optimization**
   ```python
   # Add caching
   from fastapi_cache import FastAPICache
   from fastapi_cache.backends.redis import RedisBackend
   ```

## 📞 Support

For deployment issues:
1. Check logs: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Restart services: `docker-compose restart`
4. Clean rebuild: `docker-compose down && docker-compose up --build -d`

---

**Happy deploying! 🚀** 