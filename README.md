# BlueBank - Modern Banking Application

A full-stack banking application built with FastAPI, Next.js, and Docker. Features include user authentication, banking operations, and a modern responsive UI with cloud database integration.

## Screenshots

### Home Page
![Home Page](docs/screenshots/home.png)

### Login Page
![Login Page](docs/screenshots/login.png)

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

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

```mermaid
graph TD
    ROOT[Bank_Project/]
    
    ROOT --> BACKEND[backend/]
    ROOT --> FRONTEND[frontend/]
    ROOT --> DOCKER[docker/]
    ROOT --> DOCS[docs/]
    ROOT --> SCRIPTS[scripts/]
    ROOT --> CONFIG_FILES[Configuration Files]
    
    BACKEND --> BE_MAIN[main.py - FastAPI application]
    BACKEND --> BE_DB[database.py - DB connection]
    BACKEND --> BE_MODELS[models.py - SQLAlchemy models]
    BACKEND --> BE_SCHEMAS[schemas.py - Pydantic schemas]
    BACKEND --> BE_AUTH[auth.py - Authentication]
    BACKEND --> BE_REQ[requirements.txt - Dependencies]
    BACKEND --> BE_ENV[env.template - Environment template]
    BACKEND --> BE_DOCKERFILE[Dockerfile - Backend container]
    BACKEND --> BE_DATA[data/ - Database files]
    
    FRONTEND --> FE_APP[app/ - Next.js App Router]
    FRONTEND --> FE_COMPONENTS[components/ - React components]
    FRONTEND --> FE_CONTEXTS[contexts/ - React contexts]
    FRONTEND --> FE_PUBLIC[public/ - Static assets]
    FRONTEND --> FE_PACKAGE[package.json - Dependencies]
    FRONTEND --> FE_TAILWIND[tailwind.config.js - Styling]
    FRONTEND --> FE_TSCONFIG[tsconfig.json - TypeScript config]
    FRONTEND --> FE_DOCKERFILE[Dockerfile - Frontend container]
    
    FE_APP --> APP_LOGIN[login/ - Login page]
    FE_APP --> APP_REGISTER[register/ - Registration page]
    FE_APP --> APP_BALANCE[balance/ - Dashboard page]
    FE_APP --> APP_TRANSFER[transfer/ - Transfer page]
    FE_APP --> APP_DEPOSIT[deposit/ - Deposit page]
    FE_APP --> APP_WITHDRAW[withdraw/ - Withdraw page]
    FE_APP --> APP_PROFILE[profile/ - Profile page]
    FE_APP --> APP_HISTORY[history/ - Transaction history]
    FE_APP --> APP_AUTH[auth/ - OAuth callbacks]
    FE_APP --> APP_LAYOUT[layout.js - Root layout]
    FE_APP --> APP_HOME[page.js - Home page]
    FE_APP --> APP_GLOBALS[globals.css - Global styles]
    
    FE_COMPONENTS --> COMP_ANIMATED[AnimatedDigit.tsx]
    FE_COMPONENTS --> COMP_COUNTER[CounterScroller.tsx]
    FE_COMPONENTS --> COMP_DIGIT[DigitScroller.tsx]
    
    FE_CONTEXTS --> CTX_DARK[DarkModeContext.tsx]
    
    DOCKER --> DOCKER_COMPOSE[docker-compose.yml]
    DOCKER --> DOCKER_DEV[docker-compose.dev.yml]
    
    DOCS --> DOCS_AWS[AWS_DEPLOYMENT.md]
    DOCS --> DOCS_SETUP[AWS_SETUP_CHECKLIST.md]
    DOCS --> DOCS_DEPLOY[DEPLOYMENT.md]
    DOCS --> DOCS_QUICK[QUICK_START.md]
    DOCS --> DOCS_SCREENSHOTS[screenshots/]
    
    SCRIPTS --> SCRIPTS_SETUP[setup.ps1 / setup.sh]
    SCRIPTS --> SCRIPTS_START[start.bat / start.sh]
    SCRIPTS --> SCRIPTS_DEPLOY[deploy-aws.ps1 / deploy-aws.sh]
    
    CONFIG_FILES --> CONF_README[README.md]
    CONFIG_FILES --> CONF_ARCH[ARCHITECTURE.md]
    CONFIG_FILES --> CONF_DOCKER_README[DOCKER_README.md]
    CONFIG_FILES --> CONF_PROJECT[PROJECT_STRUCTURE.md]
    CONFIG_FILES --> CONF_NGINX[nginx.conf]
    CONFIG_FILES --> CONF_DOCKERFILE[Dockerfile - Multi-stage build]
    CONFIG_FILES --> CONF_GITIGNORE[.gitignore]
    
    style ROOT fill:#e1f5ff
    style BACKEND fill:#fff3e0
    style FRONTEND fill:#f3e5f5
    style DOCKER fill:#e8f5e9
    style DOCS fill:#fff9c4
    style SCRIPTS fill:#fce4ec
    style CONFIG_FILES fill:#e0f2f1
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