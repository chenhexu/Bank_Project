# BlueBank - Modern Banking Application

A full-stack banking application built with FastAPI, Next.js, and Docker. Features include user authentication, banking operations, and a modern responsive UI with AWS cloud database integration.

## Features

### Core Banking Operations
- User registration and authentication
- Google and Facebook OAuth integration
- Real-time balance display
- Deposit and withdraw funds
- Transfer money between users
- Complete transaction history
- Password recovery via email

### Technical Features
- **Backend**: FastAPI with Python
- **Frontend**: Next.js with TypeScript
- **Database**: AWS RDS PostgreSQL
- **Containerization**: Docker with multi-stage builds
- **Styling**: Tailwind CSS with dark mode support
- **Security**: CORS protection, secure authentication

## Quick Start

### Using Docker (Recommended)
```bash
# Run the application using Docker Hub
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest

# Access at http://localhost:8080
```

### Local Development
```bash
# Clone the repository
git clone https://github.com/chenhexu/Bank_Project.git
cd Bank_Project

# Backend setup
cd backend
cp env.template .env
# Edit .env with your configuration
python -m uvicorn main:app --reload --port 8000

# Frontend setup (in another terminal)
cd frontend
npm install
npm run dev
```

## Configuration

### Environment Variables
Copy `backend/env.template` to `backend/.env` and configure:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/oauth-callback

# Facebook OAuth (optional)
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:8080/oauth-callback

# Email (optional)
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Application
ENVIRONMENT=development
DEBUG=true
```

## Project Structure

```
Bank_Project/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── auth.py             # Authentication logic
│   ├── database.py         # Database connection
│   ├── requirements.txt    # Python dependencies
│   └── env.template        # Environment template
├── frontend/               # Next.js frontend
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   └── utils/             # Utility functions
├── docs/                   # Documentation
├── scripts/                # Setup and deployment scripts
├── Dockerfile              # Multi-stage Docker build
├── nginx.conf              # Nginx configuration
└── README.md              # This file
```

## API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User authentication
- `POST /forgot-password` - Password recovery
- `POST /reset-password` - Reset password

### OAuth
- `POST /auth/google` - Google OAuth
- `GET /auth/google/config` - Google OAuth config
- `POST /auth/facebook` - Facebook OAuth
- `GET /auth/facebook/config` - Facebook OAuth config

### Banking
- `POST /deposit` - Deposit funds
- `POST /withdraw` - Withdraw funds
- `POST /transfer` - Transfer money
- `POST /balance` - Get balance
- `POST /transactions` - Get transaction history
- `POST /profile` - Get user profile

### System
- `GET /` - Health check
- `GET /docs` - API documentation

## Deployment

### Docker Hub
```bash
# Pull and run
docker pull chenhexu/bluebank:latest
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest
```

### Building from Source
```bash
# Build image
docker build -t bluebank:local .

# Run locally
docker run -d -p 8080:80 --name bluebank-local bluebank:local
```

### Production Deployment
For production deployment, see the [Deployment Guide](docs/DEPLOYMENT.md).

## Development

### Prerequisites
- Python 3.8+
- Node.js 16+
- Docker (optional)

### Setup
1. Clone the repository
2. Copy `backend/env.template` to `backend/.env`
3. Configure environment variables
4. Start backend: `cd backend && python -m uvicorn main:app --reload`
5. Start frontend: `cd frontend && npm run dev`

### Testing
- Backend API: http://localhost:8000/docs
- Frontend: http://localhost:3000

## Troubleshooting

### Common Issues

**Container won't start**
```bash
docker logs bluebank
```

**Port conflicts**
```bash
# Use different port
docker run -d -p 8081:80 --name bluebank chenhexu/bluebank:latest
```

**Database connection issues**
- Verify `DATABASE_URL` in environment variables
- Check network connectivity
- Ensure database credentials are correct

## Documentation

- [Quick Start Guide](docs/QUICK_START.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [AWS Deployment](docs/AWS_DEPLOYMENT.md)
- [Google OAuth Setup](docs/GOOGLE_OAUTH_SETUP.md)
- [Facebook OAuth Setup](docs/FACEBOOK_OAUTH_SETUP.md)

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
1. Check application logs: `docker logs bluebank`
2. Review the troubleshooting section
3. Verify environment configuration
4. Check GitHub issues

---

**Docker Hub**: `chenhexu/bluebank:latest` | **Live Demo**: [bluebank.tarch.ca](https://bluebank.tarch.ca)