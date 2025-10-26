# BlueBank - Modern Banking Application

A full-stack banking application built with FastAPI, Next.js, and Docker. Features include user authentication, banking operations, and a modern responsive UI with cloud database integration.

## Features

### Core Banking Operations
- User registration and authentication
- Google and Facebook OAuth integration
- Real-time balance display with smooth animations
- Deposit and withdraw funds
- Transfer money between users
- Complete transaction history
- Real-time notifications
- Password recovery via email
- Dark/Light mode with device preference detection

### Technical Features
- **Backend**: FastAPI with Python 3.13
- **Frontend**: Next.js 14 with TypeScript and React 18
- **Database**: PostgreSQL (Azure/AWS RDS compatible)
- **Containerization**: Docker with multi-stage builds
- **Styling**: Tailwind CSS with responsive design
- **Security**: CORS protection, OAuth integration, secure authentication
- **Real-time Updates**: Polling-based balance and notification updates
- **Deployment**: Nginx reverse proxy, production-ready

## Prerequisites

Before running BlueBank, ensure you have the following installed:

### For Docker Deployment (Recommended)
- [Docker](https://www.docker.com/get-started) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (optional, for development)

### For Local Development
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [Python](https://www.python.org/) (version 3.11 or higher)
- [PostgreSQL](https://www.postgresql.org/) (version 13 or higher) - Optional, can use SQLite for development

## Quick Start

### Option 1: Docker Deployment (Production Ready)

```bash
# Pull and run the latest image
docker pull chenhexu/bluebank:latest
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest

# Access the application at http://localhost:8080
```

### Option 2: Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/chenhexu/Bank_Project.git
cd Bank_Project
```

#### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Setup environment variables
cp env.template .env
# Edit .env file with your configuration (see Configuration section below)

# Run the backend server
python -m uvicorn main:app --reload --port 8000
```

#### 3. Frontend Setup (New Terminal)
```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

#### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Configuration

### Environment Variables

Copy `backend/env.template` to `backend/.env` and configure the following:

#### Required Configuration
```env
# Database (choose one)
# For development (SQLite)
DATABASE_URL=sqlite:///./bank.db

# For production (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Application Settings
DEBUG=true
ENVIRONMENT=development
```

#### Optional OAuth Configuration
```env
# Google OAuth (for Google login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8080/oauth-callback

# Facebook OAuth (for Facebook login)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:8080/oauth-callback
```

#### Optional Email Configuration
```env
# Gmail SMTP (for password reset emails)
GMAIL_EMAIL=your_gmail_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
BLUEBANK_EMAIL_FROM=noreply@bluebank.com
```

### OAuth Setup

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:8080/oauth-callback` (development)
   - `https://yourdomain.com/oauth-callback` (production)

#### Facebook OAuth Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure Valid OAuth Redirect URIs:
   - `http://localhost:8080/oauth-callback` (development)
   - `https://yourdomain.com/oauth-callback` (production)

## Development Scripts

### Backend Commands
```bash
# Run backend server
cd backend
python -m uvicorn main:app --reload --port 8000

# Run with debug logging
python -m uvicorn main:app --reload --port 8000 --log-level debug

# Create database tables (if using SQLite)
python -c "from database import create_tables; create_tables()"
```

### Frontend Commands
```bash
# Start development server
cd frontend
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Docker Commands
```bash
# Build local image
docker build -t bluebank .

# Run with docker-compose (development)
docker-compose -f docker/docker-compose.dev.yml up

# Run production container
docker run -d -p 8080:80 --name bluebank bluebank
```

## Project Structure

```
Bank_Project/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application file
│   ├── database.py         # Database configuration
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas
│   ├── auth.py             # Authentication logic
│   ├── requirements.txt    # Python dependencies
│   └── env.template        # Environment template
├── frontend/               # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── package.json       # Node.js dependencies
│   └── tailwind.config.js # Tailwind configuration
├── docker/                # Docker configurations
├── docs/                  # Documentation
├── scripts/               # Deployment scripts
└── README.md             # This file
```

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/facebook` - Facebook OAuth
- `POST /api/forgot-password` - Password reset request
- `POST /api/reset-password` - Password reset confirmation

### Banking Operations
- `GET /api/balance` - Get user balance
- `POST /api/deposit` - Deposit funds
- `POST /api/withdraw` - Withdraw funds
- `POST /api/transfer` - Transfer money
- `GET /api/transactions` - Get transaction history
- `GET /api/notifications` - Get notifications

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/change-password` - Change password

## Deployment

### Production Deployment with Docker

1. **Build and push to registry:**
```bash
docker build -t your-registry/bluebank:latest .
docker push your-registry/bluebank:latest
```

2. **Deploy on server:**
```bash
docker pull your-registry/bluebank:latest
docker run -d -p 80:80 --name bluebank your-registry/bluebank:latest
```

3. **With environment file:**
```bash
docker run -d -p 80:80 --env-file .env --name bluebank your-registry/bluebank:latest
```

### Environment-Specific Configuration

#### Development
- Uses SQLite database by default
- Hot reload enabled
- Debug mode active
- CORS allows localhost origins

#### Production
- Requires PostgreSQL database
- Optimized builds
- Security headers enabled
- HTTPS recommended

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
python -c "from database import engine; print(engine.execute('SELECT 1').scalar())"
```

#### Port Already in Use
```bash
# Kill process on port 8000 (backend)
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:8000 | xargs kill -9
```

#### Docker Issues
```bash
# Clean Docker cache
docker system prune -a

# View container logs
docker logs bluebank

# Access container shell
docker exec -it bluebank /bin/bash
```

### Performance Optimization

- Enable PostgreSQL connection pooling for production
- Use Redis for session storage (optional)
- Configure Nginx caching for static assets
- Enable gzip compression

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the [documentation](docs/)
- Review the API documentation at `/docs` endpoint

## Acknowledgments

- FastAPI for the excellent Python web framework
- Next.js for the React framework
- Tailwind CSS for the utility-first CSS framework
- Docker for containerization
- PostgreSQL for the robust database system