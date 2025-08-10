# 📁 Project Structure

```
Bank_Project/
├── 📁 backend/                 # FastAPI backend application
│   ├── main.py                # Main FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Backend container configuration
│   ├── .env                  # Environment variables (auto-created)
│   └── .env.example         # Environment template
│
├── 📁 frontend/              # Next.js frontend application
│   ├── app/                  # Next.js app directory
│   ├── components/           # Reusable React components
│   ├── contexts/            # React context providers
│   ├── public/              # Static assets
│   ├── package.json         # Node.js dependencies
│   └── Dockerfile           # Frontend container configuration
│
├── 📁 docker/               # Docker configuration files
│   ├── docker-compose.yml   # Production Docker setup
│   └── docker-compose.dev.yml # Development Docker setup
│
├── 📁 scripts/              # Automation scripts
│   ├── start.bat           # Windows startup script
│   ├── start.sh            # Linux/Mac startup script
│   ├── start-dev.bat       # Windows development script
│   ├── setup.ps1           # PowerShell setup script
│   ├── setup.sh            # Linux/Mac setup script
│   ├── deploy-aws.ps1      # PowerShell AWS deployment script
│   └── deploy-aws.sh       # Linux/Mac AWS deployment script
│
├── 📁 docs/                 # Documentation
│   ├── DEPLOYMENT.md        # Deployment instructions
│   ├── AWS_DEPLOYMENT.md    # AWS Elastic Beanstalk deployment guide
│   ├── AWS_SETUP_CHECKLIST.md # AWS setup checklist
│   └── QUICK_START.md       # Quick start guide
│
├── 📁 .ebextensions/        # AWS Elastic Beanstalk configuration
│   ├── 01_environment.config # Environment and system settings
│   ├── 02_application.config # Application-specific settings
│   └── 03_platform.config   # Platform-specific settings
├── 📁 .elasticbeanstalk/    # Elastic Beanstalk application config
│   └── config.yml           # EB application configuration
├── 📄 README.md             # Main project documentation
├── 📄 PROJECT_STRUCTURE.md  # This file
├── 📄 package.json          # Project metadata and scripts
└── 📄 .gitignore           # Git ignore rules
```

## 🚀 Quick Commands

### Start the Application
```bash
# Windows
scripts/start.bat

# Linux/Mac
chmod +x scripts/start.sh
./scripts/start.sh

# Using npm
npm start
```

### Development Mode
```bash
# Windows
scripts/start-dev.bat

# Using npm
npm run dev
```

### AWS Cloud Deployment
```bash
# Windows (PowerShell)
.\scripts\deploy-aws.ps1

# Linux/Mac
chmod +x scripts/deploy-aws.sh
./scripts/deploy-aws.sh
```

### Stop the Application
```bash
# Using npm
npm run stop

# Direct Docker
docker-compose -f docker/docker-compose.yml down
```

## 📋 File Purposes

### Core Application
- **backend/**: FastAPI backend with banking logic
- **frontend/**: Next.js frontend with React components

### Configuration
- **docker/**: Docker Compose configurations
- **scripts/**: Automation scripts for different platforms
- **.ebextensions/**: AWS Elastic Beanstalk configuration files
- **.elasticbeanstalk/**: Elastic Beanstalk application settings

### Documentation
- **docs/**: Detailed guides and setup instructions
- **README.md**: Main project overview
- **PROJECT_STRUCTURE.md**: This structure guide

### Environment
- **.env files**: Environment variables (not in version control)
- **.env.example**: Template for environment setup 