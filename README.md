# BlueBank - Modern Banking Application

A full-stack banking application built with FastAPI, Next.js, and Docker. Features include user authentication, banking operations, and a modern responsive UI with AWS cloud database integration.

## 🌟 Features

### ☁️ Cloud-Ready Architecture
- **AWS RDS PostgreSQL** database for shared data access
- **AWS Lightsail** deployment with Cloudflare security
- **Cross-device transfers** - send money between different users anywhere
- **Real-time synchronization** - all users see consistent data
- **Production-grade security** with Cloudflare protection

### 🛡️ Security & Infrastructure
- **Cloudflare CDN** with DDoS protection and WAF
- **Custom domain**: `bluebank.unifra.org`
- **SSL/TLS encryption** for all communications
- **IP whitelisting** for enhanced security
- **Health monitoring** and automatic recovery

### 🚀 Quick Start

#### Live Demo
Visit **[bluebank.unifra.org](https://bluebank.unifra.org)** to try the application immediately.

#### Docker Deployment
```bash
# Run locally using Docker Hub
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest

# Access at http://localhost:8080
```

#### Local Development
```bash
# Clone the repository
git clone https://github.com/chenhexu/Bank_Project.git
cd Bank_Project

# Backend
cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (in another terminal)
cd frontend && npm run dev
```

## 🏗️ Architecture

### Technology Stack
- **Backend**: FastAPI with Python
- **Frontend**: Next.js with TypeScript
- **Database**: AWS RDS PostgreSQL
- **Infrastructure**: AWS Lightsail + Cloudflare
- **Containerization**: Docker with multi-stage builds
- **Styling**: Tailwind CSS with dark mode support

### Core Features

#### Authentication & Security
- Email/password registration and login
- **Google OAuth integration** for seamless sign-in
- **Facebook OAuth integration** for social authentication
- Password recovery via email notifications
- Session management with secure authentication
- CORS protection for API endpoints

#### Banking Operations
- Real-time balance display with animated counters
- Deposit and withdraw funds with validation
- Transfer money between users with instant notifications
- Complete transaction history with detailed records
- Insufficient funds protection and error handling

#### User Experience
- Modern responsive design optimized for all devices
- Dark mode support with user preference persistence
- Animated balance transitions and notifications
- Real-time updates without page refreshes
- Mobile-friendly interface with touch support

## 📁 Project Structure

```
Bank_Project/
├── backend/                 # FastAPI backend application
│   ├── main.py             # Main application with API endpoints
│   ├── requirements.txt    # Python dependencies
│   └── schemas.py          # Pydantic models
├── frontend/               # Next.js frontend application
│   ├── app/               # Next.js 13+ app directory
│   │   ├── login/         # Authentication pages
│   │   ├── balance/       # Account balance page
│   │   ├── deposit/       # Deposit funds page
│   │   ├── withdraw/      # Withdraw funds page
│   │   ├── transfer/      # Transfer money page
│   │   └── history/       # Transaction history page
│   ├── components/        # Reusable React components
│   ├── contexts/          # React contexts (DarkMode)
│   └── package.json       # Node.js dependencies
├── scripts/                # Deployment and setup scripts
├── docs/                   # Documentation files
├── Dockerfile              # Multi-stage Docker build
├── nginx.conf              # Nginx reverse proxy configuration
├── start.sh               # Container startup script
└── README.md              # This documentation
```

## 🐳 Docker Commands

### Using Docker Hub Image
```bash
# Pull latest image
docker pull chenhexu/bluebank:latest

# Run container
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest

# View logs
docker logs bluebank

# Stop and remove
docker stop bluebank && docker rm bluebank
```

### Building from Source
```bash
# Build image
docker build -t bluebank:local .

# Run locally built image
docker run -d -p 8080:80 --name bluebank-local bluebank:local
```

### Development with Hot Reload
```bash
# Start development environment
docker-compose -f docker/docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker/docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.dev.yml down
```

## 🌐 API Documentation

### Authentication Endpoints
- `POST /register` - User registration
- `POST /login` - User authentication
- `POST /forgot-password` - Request password recovery
- `POST /reset-password` - Reset password with recovery code

### OAuth Authentication
- `POST /auth/google` - Google OAuth authentication
- `GET /auth/google/config` - Google OAuth configuration
- `POST /auth/facebook` - Facebook OAuth authentication  
- `GET /auth/facebook/config` - Facebook OAuth configuration

### Banking Endpoints
- `POST /deposit` - Deposit funds to account
- `POST /withdraw` - Withdraw funds from account
- `POST /transfer` - Transfer money between users
- `POST /balance` - Get current account balance
- `POST /transactions` - Get transaction history
- `POST /profile` - Get user profile information

### System Endpoints
- `GET /` - Health check and system status
- `GET /user-count` - Get total registered users
- `GET /docs` - Interactive API documentation (Swagger UI)

## ⚙️ Configuration

### Environment Variables
```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Email Configuration (for notifications)
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
SENDGRID_API_KEY=your-sendgrid-key

# Google OAuth Configuration (optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://bluebank.unifra.org/auth/google/callback

# Application Settings
ENVIRONMENT=production
CORS_ORIGINS=["http://localhost:3000", "https://bluebank.unifra.org"]
```

### Setup Instructions
1. Copy `backend/env.template` to `backend/.env`
2. Update the environment variables with your configuration
3. **For Google OAuth**: Follow the [Google OAuth Setup Guide](docs/GOOGLE_OAUTH_SETUP.md)
4. **For Facebook OAuth**: Follow the [Facebook OAuth Setup Guide](docs/FACEBOOK_OAUTH_SETUP.md)
5. For local development, the application will create default settings

## 🚀 Deployment

### Production Deployment (AWS Lightsail)
The application is currently deployed on AWS Lightsail with:
- **Domain**: `bluebank.unifra.org`
- **SSL**: Cloudflare managed certificates
- **Security**: IP whitelisting for Cloudflare traffic only
- **Database**: AWS RDS PostgreSQL
- **CDN**: Cloudflare with caching and DDoS protection

### Self-Hosting Options
1. **Docker Compose**: For simple multi-container deployment
2. **AWS ECS**: For container orchestration at scale
3. **Google Cloud Run**: For serverless container deployment
4. **DigitalOcean**: For cost-effective VPS hosting
5. **Azure Container Instances**: For cloud container deployment

## 🧪 Testing

### Manual Testing Workflow
1. **Registration**: Create new user accounts
2. **Authentication**: Test login/logout functionality
3. **Banking Operations**: Test deposit, withdraw, and transfer
4. **Cross-User Transfers**: Test money transfers between accounts
5. **Password Recovery**: Test forgot password flow
6. **UI/UX**: Test dark mode, responsive design, animations

### Multi-Device Testing
1. Access the application from different devices/browsers
2. Register different user accounts
3. Test real-time transfer functionality
4. Verify data consistency across sessions

### API Testing
- Visit the `/docs` endpoint for interactive Swagger documentation
- Use the built-in API testing interface
- Test all endpoints with various input scenarios

## 🔧 Troubleshooting

### Common Issues

**Container won't start**
```bash
# Check logs for errors
docker logs bluebank

# Verify Docker is running
docker info

# Rebuild container
docker rm bluebank
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest
```

**Port conflicts**
```bash
# Check what's using port 8080
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # Linux/macOS

# Use different port
docker run -d -p 8081:80 --name bluebank chenhexu/bluebank:latest
```

**Database connection issues**
- Verify `DATABASE_URL` environment variable is set correctly
- Check network connectivity to database server
- Ensure database credentials are valid

## 📊 Monitoring & Health Checks

The application includes built-in health monitoring:
- **Health Endpoint**: `GET /` returns system status
- **Database Status**: Automatic connection health checks
- **User Metrics**: Track total registered users
- **Error Logging**: Comprehensive application logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper testing
4. Commit changes: `git commit -m "Add feature description"`
5. Push to branch: `git push origin feature-name`
6. Submit a pull request with detailed description

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For issues and questions:
1. Check the application logs: `docker logs bluebank`
2. Review the troubleshooting section above
3. Verify your environment configuration
4. Check the GitHub issues page for known problems

---

**Built with ❤️ using FastAPI, Next.js, Docker, PostgreSQL, and AWS**

**Docker Hub**: `chenhexu/bluebank:latest` | **Live Demo**: [bluebank.unifra.org](https://bluebank.unifra.org)