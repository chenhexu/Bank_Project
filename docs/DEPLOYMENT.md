# Deployment Guide

This guide covers deploying BlueBank in various environments, from local development to production cloud deployment.

## Prerequisites

- Docker installed and running
- Git (for cloning the repository)
- 4GB+ RAM recommended

## Local Development

### Quick Start
```bash
# Clone the repository
git clone https://github.com/chenhexu/Bank_Project.git
cd Bank_Project

# Run with Docker
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest
```

### Manual Setup
```bash
# Backend
cd backend
cp env.template .env
# Edit .env with your configuration
python -m uvicorn main:app --reload --port 8000

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## Docker Deployment

### Using Docker Hub (Recommended)
```bash
# Pull and run latest image
docker pull chenhexu/bluebank:latest
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest

# With custom environment file
docker run -d -p 8080:80 --name bluebank --env-file ~/bluebank.env chenhexu/bluebank:latest
```

### Building from Source
```bash
# Build image
docker build -t bluebank:local .

# Run locally built image
docker run -d -p 8080:80 --name bluebank-local bluebank:local
```

### Docker Compose
```bash
# Development
docker-compose -f docker/docker-compose.dev.yml up --build -d

# Production
docker-compose -f docker/docker-compose.yml up --build -d
```

## Cloud Deployment

### AWS Lightsail (Current Production)

1. **Launch Lightsail Instance**
   - Choose Ubuntu 20.04 LTS
   - $5/month plan minimum
   - Configure firewall (ports 22, 80, 443)

2. **Install Docker**
   ```bash
   sudo apt update && sudo apt upgrade -y
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

3. **Deploy Application**
   ```bash
   # Create environment file
   cat > ~/bluebank.env << 'EOF'
   DATABASE_URL=postgresql://postgres:password@your-rds-endpoint:5432/postgres?sslmode=require
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=https://yourdomain.com/oauth-callback
   FACEBOOK_APP_ID=your-facebook-app-id
   FACEBOOK_APP_SECRET=your-facebook-app-secret
   FACEBOOK_REDIRECT_URI=https://yourdomain.com/oauth-callback
   ENVIRONMENT=production
   DEBUG=false
   EOF

   # Run container
   sudo docker run -d --name bluebank -p 80:80 --env-file ~/bluebank.env chenhexu/bluebank:latest
   ```

### AWS EC2

1. **Launch EC2 Instance**
   - Ubuntu 20.04 LTS
   - t3.medium or larger
   - Configure security groups (ports 22, 80, 443)

2. **Install Docker**
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker $USER
   ```

3. **Deploy Application**
   ```bash
   git clone https://github.com/chenhexu/Bank_Project.git
   cd Bank_Project
   # Configure environment and run
   docker run -d -p 80:80 --name bluebank --env-file ~/bluebank.env chenhexu/bluebank:latest
   ```

### DigitalOcean Droplet

1. **Create Droplet**
   - Ubuntu 20.04
   - Basic plan ($12/month minimum)
   - Add SSH key

2. **Deploy Application**
   ```bash
   # SSH into droplet
   ssh root@your-droplet-ip
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Deploy BlueBank
   docker run -d -p 80:80 --name bluebank --env-file ~/bluebank.env chenhexu/bluebank:latest
   ```

## Production Configuration

### Environment Variables
Create production environment file:

```env
# Database (use PostgreSQL for production)
DATABASE_URL=postgresql://user:password@your-rds-endpoint:5432/database?sslmode=require

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/oauth-callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=https://yourdomain.com/oauth-callback

# Email Configuration
GMAIL_EMAIL=your-production-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Application Settings
ENVIRONMENT=production
DEBUG=false
```

### SSL/HTTPS Setup

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Get SSL Certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Database Setup

The application uses AWS RDS PostgreSQL by default. For custom PostgreSQL:

1. **Add PostgreSQL service to docker-compose.yml**
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

2. **Update DATABASE_URL**
   ```env
   DATABASE_URL=postgresql://bluebank:your-secure-password@postgres:5432/bluebank
   ```

## Monitoring & Logging

### Basic Monitoring
```bash
# Check container status
docker ps

# View logs
docker logs bluebank

# Monitor resources
docker stats bluebank
```

### Health Checks
```bash
# Check application health
curl http://localhost/api/health

# Check database connection
curl http://localhost/api/user-count
```

## Security Best Practices

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
   docker pull chenhexu/bluebank:latest
   docker stop bluebank
   docker rm bluebank
   docker run -d -p 80:80 --name bluebank --env-file ~/bluebank.env chenhexu/bluebank:latest
   ```

3. **Backup Strategy**
   ```bash
   # Backup application
   tar -czf bluebank-backup-$(date +%Y%m%d).tar.gz .
   ```

## Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   # Check logs
   docker logs bluebank
   
   # Check if Docker is running
   docker info
   ```

2. **Port conflicts**
   ```bash
   # Check what's using ports
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :443
   ```

3. **Database connection issues**
   - Verify `DATABASE_URL` environment variable
   - Check network connectivity to database
   - Ensure database credentials are valid

4. **OAuth not working**
   - Verify redirect URIs match exactly
   - Check client ID and secret
   - Ensure domain is configured in OAuth providers

### Performance Tuning

1. **Database optimization**
   ```sql
   -- Add indexes
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_transactions_username ON transactions(username);
   ```

2. **Application optimization**
   - Use production database (AWS RDS)
   - Enable SSL/TLS
   - Configure proper CORS origins

## CI/CD Pipeline

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
          docker stop bluebank
          docker rm bluebank
          docker run -d -p 80:80 --name bluebank --env-file ~/bluebank.env chenhexu/bluebank:latest
```

## Support

For deployment issues:
1. Check logs: `docker logs bluebank`
2. Verify configuration: Check environment variables
3. Restart services: `docker restart bluebank`
4. Clean rebuild: `docker stop bluebank && docker rm bluebank && docker run -d -p 80:80 --name bluebank --env-file ~/bluebank.env chenhexu/bluebank:latest`