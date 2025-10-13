# Project Structure

```
Bank_Project/
├── backend/                 # FastAPI backend application
│   ├── main.py             # Main FastAPI application with API endpoints
│   ├── models.py           # Database models and schemas
│   ├── schemas.py          # Pydantic request/response models
│   ├── auth.py             # Authentication and OAuth logic
│   ├── database.py         # Database connection and configuration
│   ├── requirements.txt    # Python dependencies
│   ├── env.template        # Environment variables template
│   └── Dockerfile          # Backend container configuration
│
├── frontend/               # Next.js frontend application
│   ├── app/               # Next.js 13+ app directory
│   │   ├── login/         # Authentication pages
│   │   ├── register/      # User registration
│   │   ├── balance/       # Account balance and dashboard
│   │   ├── deposit/       # Deposit funds page
│   │   ├── withdraw/      # Withdraw funds page
│   │   ├── transfer/      # Transfer money page
│   │   ├── history/       # Transaction history page
│   │   ├── profile/       # User profile page
│   │   └── oauth-callback/ # OAuth callback handler
│   ├── components/        # Reusable React components
│   │   ├── AnimatedDigit.tsx
│   │   ├── CounterScroller.tsx
│   │   └── DigitScroller.tsx
│   ├── contexts/          # React context providers
│   │   └── DarkModeContext.tsx
│   ├── utils/             # Utility functions
│   │   └── sessionManager.ts
│   ├── public/            # Static assets
│   ├── package.json       # Node.js dependencies
│   └── next.config.mjs    # Next.js configuration
│
├── docs/                  # Documentation
│   ├── QUICK_START.md     # Quick start guide
│   ├── DEPLOYMENT.md      # Deployment instructions
│   ├── AWS_DEPLOYMENT.md  # AWS deployment guide
│   ├── GOOGLE_OAUTH_SETUP.md # Google OAuth setup
│   ├── FACEBOOK_OAUTH_SETUP.md # Facebook OAuth setup
│   ├── AWS_SETUP_CHECKLIST.md # AWS setup checklist
│   └── OAUTH_CONNECTION_DIAGRAM.md # OAuth flow diagram
│
├── scripts/               # Automation scripts
│   ├── start.bat          # Windows startup script
│   ├── start.sh           # Linux/Mac startup script
│   ├── start-dev.bat      # Windows development script
│   ├── setup.ps1          # PowerShell setup script
│   ├── setup.sh           # Linux/Mac setup script
│   ├── deploy-aws.ps1     # PowerShell AWS deployment
│   └── deploy-aws.sh      # Linux/Mac AWS deployment
│
├── docker/                # Docker configuration files
│   ├── docker-compose.yml # Production Docker setup
│   └── docker-compose.dev.yml # Development Docker setup
│
├── .ebextensions/         # AWS Elastic Beanstalk configuration
│   ├── 01_environment.config
│   ├── 02_application.config
│   └── 03_platform.config
│
├── .elasticbeanstalk/     # Elastic Beanstalk application config
│   └── config.yml
│
├── Dockerfile             # Multi-stage Docker build
├── nginx.conf             # Nginx reverse proxy configuration
├── supervisord.conf       # Process management configuration
├── start.sh              # Container startup script
├── env.production.template # Production environment template
├── package.json          # Project metadata and scripts
├── README.md             # Main project documentation
├── PROJECT_STRUCTURE.md  # This file
└── .gitignore           # Git ignore rules
```

## Quick Commands

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

### Docker Commands
```bash
# Run from Docker Hub
docker run -d -p 8080:80 --name bluebank chenhexu/bluebank:latest

# Build from source
docker build -t bluebank:local .

# View logs
docker logs bluebank
```

### AWS Cloud Deployment
```bash
# Windows (PowerShell)
.\scripts\deploy-aws.ps1

# Linux/Mac
chmod +x scripts/deploy-aws.sh
./scripts/deploy-aws.sh
```

## File Purposes

### Core Application
- **backend/**: FastAPI backend with banking logic, OAuth, and database operations
- **frontend/**: Next.js frontend with React components and modern UI

### Configuration
- **docker/**: Docker Compose configurations for development and production
- **scripts/**: Automation scripts for different platforms and deployment
- **.ebextensions/**: AWS Elastic Beanstalk configuration files
- **.elasticbeanstalk/**: Elastic Beanstalk application settings

### Documentation
- **docs/**: Detailed guides, setup instructions, and deployment documentation
- **README.md**: Main project overview and quick start guide
- **PROJECT_STRUCTURE.md**: This structure guide

### Environment
- **env.template**: Template for environment setup (copy to .env)
- **env.production.template**: Production environment template
- **.env files**: Environment variables (not in version control)

### Infrastructure
- **Dockerfile**: Multi-stage Docker build for production deployment
- **nginx.conf**: Nginx reverse proxy configuration
- **supervisord.conf**: Process management for containerized services
- **start.sh**: Container entrypoint script