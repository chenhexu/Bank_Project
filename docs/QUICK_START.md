# 🚀 Quick Start Guide

## For New Users

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- 4GB+ RAM recommended

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd Bank_Project
```

### Step 2: Start the Application

**Windows:**
```bash
# One-command setup
start.bat

# Or use PowerShell
.\setup.ps1
```

**Linux/Mac:**
```bash
# Make scripts executable
chmod +x start.sh setup.sh

# One-command setup
./start.sh
```

### Step 3: Access the Application
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Documentation**: http://localhost:8000/docs

### Step 4: Create Your First Account
1. Open http://localhost:3000
2. Click "Sign up"
3. Register with your email and password
4. Start using the banking features!

## Troubleshooting

### If Docker isn't running:
```bash
# Start Docker Desktop first, then run:
docker-compose up --build -d
```

### If ports are in use:
```bash
# Stop existing containers
docker-compose down

# Start fresh
docker-compose up --build -d
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Development Mode
For development with hot reloading:
```bash
docker-compose -f docker-compose.dev.yml up --build -d
```

## Stop the Application
```bash
docker-compose down
``` 