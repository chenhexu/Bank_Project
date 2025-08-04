# BlueBank - Modern Banking Application

A full-stack banking application built with FastAPI, Next.js, and Docker. Features include user authentication, banking operations, OAuth integration, and a modern responsive UI. **Now with AWS PostgreSQL cloud database for cross-computer transfers!**

## 🌟 New Features (Latest Update)

### ☁️ Cloud Database Integration
- **AWS RDS PostgreSQL** database for shared data across computers
- **Cross-computer transfers** - send money between different devices
- **Real-time synchronization** - all users see the same data
- **Scalable architecture** - ready for production deployment

### 🔄 Cross-Computer Testing
```bash
# Computer 1 (Your computer)
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest

# Computer 2 (Dad's computer)
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest

# Both computers will share the same database and can transfer money between each other!
```

## Quick Start

### Option 1: Docker Hub (Recommended)
```bash
# Run directly from Docker Hub
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest

# Access the application
open http://localhost:8080
```

### Option 2: Different Port (if port 80 is busy)
```bash
# Run on port 8080
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest

# Access the application
open http://localhost:8080
```

### Option 3: Start Existing Container
```bash
# If container already exists but is stopped
docker start bluebank

# Access the application
open http://localhost:8080
```

### Option 4: Remove and Recreate Container
```bash
# Remove old container and create fresh one
docker rm -f bluebank
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest

# Access the application
open http://localhost:8080
```

### Option 5: Local Development
```bash
# 1. Clone the repository
git clone https://github.com/chenhexu/Bank_Project.git
cd Bank_Project

# 2. Start the application
# Windows:
scripts/start.bat

# Linux/Mac:
chmod +x scripts/start.sh
./scripts/start.sh

# Or using npm:
npm start
```

### Option 6: Using npm Scripts
```bash
# If you have the project locally
npm start
```

### Access the Application
- **Frontend**: http://localhost:3000 (local) or http://localhost:8080 (Docker Hub)
- **Backend API**: http://localhost:8000 (local) or http://localhost:8080/api/ (Docker Hub)
- **API Documentation**: http://localhost:8000/docs

### Useful Commands
```bash
# Check if container is running
docker ps

# View application logs
docker logs bluebank

# Stop the application
docker stop bluebank

# Remove container completely
docker rm -f bluebank

# Check all containers (including stopped)
docker ps -a
```

### First Time Setup
1. Open the application URL
2. Click "Sign up" to create your first account
3. Start using the banking features!

## Features

### Authentication
- Email/password registration and login
- Google OAuth integration
- Facebook OAuth integration
- Password recovery via email
- Session management

### Banking Operations
- Real-time balance display with animated counter
- Deposit funds
- Withdraw funds (with insufficient funds protection)
- **Transfer money between users** (now works across different computers!)
- Complete transaction history
- Real-time notifications with sender/recipient info
- **Cross-computer synchronization** via cloud database

### User Experience
- Modern responsive design with Tailwind CSS
- Dark mode support with persistence
- Animated balance transitions
- Mobile-friendly interface
- Real-time updates
- Notification system for transfers

### Technical Features
- FastAPI backend with automatic API documentation
- Next.js frontend with TypeScript
- **AWS PostgreSQL cloud database** for cross-computer access
- Email notifications (Gmail/SendGrid)
- Health checks and monitoring
- Hot reloading for development
- Single Docker image deployment
- **Cloud-ready architecture** for production scaling

## Docker Deployment

### Single Image (Production Ready)
```bash
# Pull from Docker Hub
docker pull chenhexu/bluebank:latest

# Run the application (uses cloud database by default)
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest

# Access at http://localhost:8080

# For cross-computer testing, run on multiple computers:
# Computer 1: docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest
# Computer 2: docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest
# Both will share the same cloud database!
```

### Multi-Container Development
```bash
# Start with hot reloading
docker-compose -f docker/docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker/docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.dev.yml down
```

## Development Setup

### Option 1: Docker Development (Recommended)
```bash
# Start with hot reloading
docker-compose -f docker/docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker/docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.dev.yml down
```

### Option 2: Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## Configuration

### Environment Variables
The application will automatically create a `.env` file on first run, but you can configure it manually:

```bash
# Copy the environment template
cp backend/env.template backend/.env

# Edit the file with your settings
# See backend/env.template for all available options
```

### Required Environment Variables
```env
# Email Configuration (for password recovery)
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# OAuth Configuration (optional)
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Database (Cloud PostgreSQL by default)
DATABASE_URL=postgresql://postgres:UxI:dxl81yG]uBK:rU<U<sUdm5EZ@bluebank-db.ca76eoy2kz8t.us-east-1.rds.amazonaws.com:5432/postgres
```

## Project Structure

```
Bank_Project/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables
│   └── .env.example       # Environment template
├── frontend/               # Next.js frontend
│   ├── app/               # Next.js pages
│   ├── contexts/          # React contexts (DarkMode)
│   ├── package.json       # Node.js dependencies
│   └── phone-input-custom.css # Custom styling
├── docker/                 # Docker configuration
│   ├── docker-compose.yml # Production setup
│   └── docker-compose.dev.yml # Development setup
├── scripts/                # Automation scripts
│   ├── start.bat          # Windows startup
│   ├── start.sh           # Linux/Mac startup
│   └── setup.ps1          # PowerShell setup
├── docs/                   # Documentation
│   ├── DEPLOYMENT.md      # Deployment guide
│   ├── GOOGLE_OAUTH_SETUP.md # OAuth setup
│   └── QUICK_START.md     # Quick start guide
├── Dockerfile              # Single image build
├── nginx.conf              # Nginx configuration
├── start.sh               # Container startup script
└── README.md              # This file
```

## Docker Commands

### Production (Single Image)
```bash
# Build single image
docker build -t bluebank:latest .

# Run single container
docker run -d -p 80:80 --name bluebank bluebank:latest

# Stop container
docker stop bluebank
docker rm bluebank
```

### Development (Multi-Container)
```bash
# Build and start
docker-compose -f docker/docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker/docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.dev.yml down
```

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```bash
   # Start Docker Desktop and wait for it to fully initialize
   docker info
   ```

2. **Ports already in use**
   ```bash
   # Check what's using the ports
   netstat -ano | findstr :80
   netstat -ano | findstr :3000
   netstat -ano | findstr :8000
   ```

3. **Build fails**
   ```bash
   # Clean up and rebuild
   docker system prune -f
   docker build -t bluebank:latest .
   ```

4. **Container won't start**
   ```bash
   # Check logs
   docker logs bluebank-single
   
   # Remove and recreate
   docker rm bluebank-single
   docker run -d -p 80:80 --name bluebank-single bluebank:latest
   ```

### Health Checks
```bash
# Check if container is running
docker ps

# Check container logs
docker logs bluebank-single

# Test the application
curl http://localhost
```

## Deployment

### Docker Hub Deployment
```bash
# Build and tag
docker build -t bluebank:latest .
docker tag bluebank:latest chenhexu/bluebank:latest

# Push to Docker Hub
docker push chenhexu/bluebank:latest
```

### Cloud Deployment
1. **Google Cloud Run**: Perfect for serverless deployment
2. **AWS ECS**: For container orchestration
3. **Azure Container Instances**: For simple container deployment
4. **DigitalOcean App Platform**: For easy deployment

### Environment Setup for Production
```bash
# Set production environment variables
export ENVIRONMENT=production
export DATABASE_URL=your-production-database-url
export GMAIL_EMAIL=your-production-email
export GMAIL_APP_PASSWORD=your-production-app-password
```

## API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login
- `POST /google-auth` - Google OAuth
- `POST /facebook-auth` - Facebook OAuth

### Banking Operations
- `POST /deposit` - Deposit funds
- `POST /withdraw` - Withdraw funds
- `POST /transfer` - Transfer between users
- `POST /balance` - Get account balance
- `POST /transactions` - Get transaction history

### User Management
- `POST /profile` - Get user profile
- `POST /generate-recovery-code` - Password recovery
- `POST /reset-password` - Reset password

## Testing

### Manual Testing
1. Register a new account
2. Test banking operations (deposit, withdraw, transfer)
3. Try OAuth login options (Google, Facebook)
4. Test password recovery
5. Explore dark mode toggle
6. Test notification system

### Cross-Computer Testing
1. **Run BlueBank on two different computers**
2. **Register accounts on both computers**
3. **Transfer money between computers**
4. **Verify both computers see the same data**
5. **Test real-time synchronization**

```bash
# Computer 1: Register user A
# Computer 2: Register user B
# Transfer from A to B - both computers will see the transaction!
```

### API Testing
- Visit http://localhost:8000/docs for interactive API documentation
- Use the built-in Swagger UI to test endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter issues:

1. **Check the logs**: `docker logs bluebank-single`
2. **Verify Docker**: `docker info`
3. **Check resources**: `docker stats`
4. **Restart container**: `docker restart bluebank-single`
5. **Clean rebuild**: `docker rm bluebank-single && docker run -d -p 80:80 --name bluebank-single bluebank:latest`

## Success!

Once everything is running:
- Register a new account
- Test the banking features
- Try the OAuth login options
- Explore the dark mode toggle
- Check out the transaction history
- Test the notification system
- **Test cross-computer transfers!**

### 🎉 Cross-Computer Transfer Success!
- ✅ **Cloud database**: AWS PostgreSQL
- ✅ **Shared data**: All computers see the same users
- ✅ **Real-time transfers**: Money moves between computers instantly
- ✅ **Scalable**: Ready for production deployment

Happy banking!

---

**Made with ❤️ using FastAPI, Next.js, Docker, and AWS PostgreSQL**

**Available on Docker Hub**: `chenhexu/bluebank:latest`

**Latest Update**: Cloud database migration for cross-computer transfers! 🚀 