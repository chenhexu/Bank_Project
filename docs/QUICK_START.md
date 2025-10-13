# Quick Start Guide

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- 4GB+ RAM recommended

## Option 1: Docker (Recommended)

### Run from Docker Hub
```bash
# One command to get started
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest

# Access the application
# Frontend: http://localhost:8080
# API Docs: http://localhost:8080/docs
```

### Stop the application
```bash
docker stop bluebank
docker rm bluebank
```

## Option 2: Local Development

### Step 1: Clone and Setup
```bash
git clone https://github.com/chenhexu/Bank_Project.git
cd Bank_Project
```

### Step 2: Backend Setup
```bash
cd backend
cp env.template .env
# Edit .env with your database and OAuth settings (optional)
python -m uvicorn main:app --reload --port 8000
```

### Step 3: Frontend Setup
```bash
# In another terminal
cd frontend
npm install
npm run dev
```

### Step 4: Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Option 3: Docker Compose

### Development with Hot Reload
```bash
docker-compose -f docker/docker-compose.dev.yml up --build -d
```

### Production Mode
```bash
docker-compose -f docker/docker-compose.yml up --build -d
```

## First Steps

1. **Create Account**: Register with email and password
2. **Test OAuth**: Try Google/Facebook sign-in (if configured)
3. **Banking Operations**: Test deposit, withdraw, and transfer
4. **Explore Features**: Check transaction history and profile

## Configuration

### Environment Variables
Copy `backend/env.template` to `backend/.env` and configure:

```env
# Required
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Optional - OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/oauth-callback

# Optional - Email
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

## Troubleshooting

### Docker Issues
```bash
# Check if Docker is running
docker info

# View container logs
docker logs bluebank

# Restart container
docker restart bluebank
```

### Port Conflicts
```bash
# Check what's using port 8080
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # Linux/macOS

# Use different port
docker run -d -p 8081:80 --name bluebank chenhexu/bluebank:latest
```

### Database Issues
- Verify `DATABASE_URL` in environment variables
- Check network connectivity to database
- Ensure database credentials are correct

## Next Steps

- [Deployment Guide](DEPLOYMENT.md) - Deploy to production
- [Google OAuth Setup](GOOGLE_OAUTH_SETUP.md) - Configure Google sign-in
- [Facebook OAuth Setup](FACEBOOK_OAUTH_SETUP.md) - Configure Facebook sign-in
- [AWS Deployment](AWS_DEPLOYMENT.md) - Deploy to AWS