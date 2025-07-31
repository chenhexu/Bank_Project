# 🏦 BlueBank - Modern Banking Application

A full-stack banking application built with FastAPI, Next.js, and Docker. Features include user authentication, banking operations, OAuth integration, and a modern responsive UI.

## 🚀 Quick Start (Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- 4GB+ RAM recommended

### One-Command Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/bluebank.git
cd bluebank

# 2. Start the application
# Windows:
scripts/start.bat

# Linux/Mac:
chmod +x scripts/start.sh
./scripts/start.sh

# Or using npm:
npm start
```

### Access the Application
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Documentation**: http://localhost:8000/docs

### First Time Setup
1. Open http://localhost:3000
2. Click "Sign up" to create your first account
3. Start using the banking features!

## 📋 Features

### 🔐 Authentication
- Email/password registration and login
- Google OAuth integration
- Facebook OAuth integration
- Password recovery via email
- Session management

### 💰 Banking Operations
- Real-time balance display with animated counter
- Deposit funds
- Withdraw funds (with insufficient funds protection)
- Transfer money between users
- Complete transaction history
- Real-time notifications

### 🎨 User Experience
- Modern responsive design with Tailwind CSS
- Dark mode support
- Animated balance transitions
- Mobile-friendly interface
- Real-time updates

### 🔧 Technical Features
- FastAPI backend with automatic API documentation
- Next.js frontend with TypeScript
- SQLite database with Docker volume persistence
- Email notifications (Gmail/SendGrid)
- Health checks and monitoring
- Hot reloading for development

## 🛠️ Development Setup

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

## 🔧 Configuration

### Environment Variables
The application will automatically create a `.env` file on first run, but you can configure it manually:

```bash
# Copy the environment template
cp backend/.env.example backend/.env

# Edit the file with your settings
# See backend/.env.example for all available options
```

### Optional Features Setup
- **Email Recovery**: Configure Gmail credentials in `backend/.env`
- **OAuth Login**: Configure Google/Facebook app credentials in `backend/.env`
- **Database**: SQLite database is created automatically

### Optional Features
- **Email Notifications**: Configure Gmail or SendGrid for password recovery
- **OAuth**: Set up Google and Facebook OAuth for social login
- **Database**: SQLite is used by default, can be changed to PostgreSQL

## 📁 Project Structure

```
Bank_Project/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile         # Backend container
│   ├── env.template       # Environment template
│   └── Api_Key.env        # Environment variables
├── frontend/               # Next.js frontend
│   ├── app/               # Next.js pages
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── package.json       # Node.js dependencies
│   └── Dockerfile         # Frontend container
├── docker-compose.yml     # Production setup
├── docker-compose.dev.yml # Development setup
├── start.bat             # Windows startup script
├── start-dev.bat         # Windows dev startup script
├── start.sh              # Linux/Mac startup script
└── README.md             # This file
```

## 🐳 Docker Commands

### Production
```bash
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart
docker-compose restart
```

### Development
```bash
# Build and start with hot reloading
docker-compose -f docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## 🔍 Troubleshooting

### Common Issues

1. **Docker not running**
   ```bash
   # Start Docker Desktop and wait for it to fully initialize
   docker info
   ```

2. **Ports already in use**
   ```bash
   # Check what's using the ports
   netstat -ano | findstr :3000
   netstat -ano | findstr :8000
   ```

3. **Build fails**
   ```bash
   # Clean up and rebuild
   docker-compose down
   docker system prune -f
   docker-compose up --build -d
   ```

4. **Frontend can't connect to backend**
   - Check if both services are running: `docker-compose ps`
   - Verify backend health: `curl http://localhost:8000/`
   - Check logs: `docker-compose logs backend`

### Health Checks
```bash
# Check backend health
curl http://localhost:8000/

# Check container status
docker-compose ps
```

## 🚀 Deployment

### Local Production
```bash
# Use production configuration
docker-compose up --build -d
```

### Cloud Deployment
1. **Update environment variables** for production
2. **Set up SSL certificates** for HTTPS
3. **Configure reverse proxy** (nginx)
4. **Set up monitoring** and logging
5. **Use production database** (PostgreSQL recommended)

## 📊 API Endpoints

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

## 🧪 Testing

### Manual Testing
1. Register a new account at http://localhost:3000/register
2. Test banking operations (deposit, withdraw, transfer)
3. Try OAuth login options
4. Test password recovery
5. Explore dark mode toggle

### API Testing
- Visit http://localhost:8000/docs for interactive API documentation
- Use the built-in Swagger UI to test endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter issues:

1. **Check the logs**: `docker-compose logs -f`
2. **Verify Docker**: `docker info`
3. **Check resources**: `docker stats`
4. **Restart services**: `docker-compose restart`
5. **Clean rebuild**: `docker-compose down && docker-compose up --build -d`

## 🎉 Success!

Once everything is running:
- Register a new account
- Test the banking features
- Try the OAuth login options
- Explore the dark mode toggle
- Check out the transaction history

Happy banking! 🏦

---

**Made with ❤️ using FastAPI, Next.js, and Docker** 