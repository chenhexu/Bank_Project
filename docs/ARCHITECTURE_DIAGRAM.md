# 🏦 BlueBank Project - System Architecture

## 📊 **High-Level System Overview**

```mermaid
graph TB
    subgraph "🌐 Client Layer"
        WebBrowser[Web Browser]
        MobileBrowser[Mobile Browser]
        DesktopBrowser[Desktop Browser]
    end
    
    subgraph "☁️ Cloud Infrastructure"
        CloudflareCDN[Cloudflare CDN]
        AWSLightsail[AWS Lightsail]
        PostgreSQL[AWS RDS PostgreSQL]
    end
    
    subgraph "🐳 Container Layer"
        NginxProxy[Nginx Reverse Proxy]
        NextjsFrontend[Next.js Frontend]
        FastAPIBackend[FastAPI Backend]
    end
    
    subgraph "🔐 Authentication Providers"
        GoogleOAuth[Google OAuth 2.0]
        FacebookOAuth[Facebook OAuth 2.0]
        EmailPassword[Email/Password]
    end
    
    subgraph "📧 External Services"
        GmailSMTP[Gmail SMTP]
        GoogleConsole[Google Cloud Console]
        MetaDevelopers[Meta for Developers]
    end
    
    %% Client to CDN (bidirectional)
    WebBrowser <--> CloudflareCDN
    MobileBrowser <--> CloudflareCDN
    DesktopBrowser <--> CloudflareCDN
    
    %% CDN to Lightsail (bidirectional)
    CloudflareCDN <--> AWSLightsail
    
    %% Lightsail hosts the container and serves frontend
    AWSLightsail --> NginxProxy
    NginxProxy <--> NextjsFrontend
    
    %% Frontend makes API calls to backend (internal)
    NextjsFrontend <--> FastAPIBackend
    
    %% Backend connects to database (bidirectional)
    FastAPIBackend <--> PostgreSQL
    
    %% Backend connects to external services (bidirectional)
    FastAPIBackend <--> GmailSMTP
    
    %% Frontend OAuth flows (user redirected to providers)
    NextjsFrontend --> GoogleOAuth
    NextjsFrontend --> FacebookOAuth
    
    %% OAuth providers redirect back to frontend
    GoogleOAuth --> NextjsFrontend
    FacebookOAuth --> NextjsFrontend
    
    %% Backend handles authentication
    FastAPIBackend <--> GoogleOAuth
    FastAPIBackend <--> FacebookOAuth
    NextjsFrontend <--> EmailPassword
    EmailPassword <--> FastAPIBackend
    
    %% OAuth providers managed through their consoles
    GoogleOAuth -.-> GoogleConsole
    FacebookOAuth -.-> MetaDevelopers
```

## 🏗️ **Detailed Component Architecture**

### **Frontend Layer (Next.js)**
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  📱 Pages:                                                  │
│  ├── /login          - Authentication                       │
│  ├── /register       - User Registration                    │
│  ├── /oauth-callback - OAuth Redirect Handler              │
│  ├── /balance        - Account Dashboard                    │
│  ├── /deposit        - Money Deposit                        │
│  ├── /withdraw       - Money Withdrawal                     │
│  ├── /transfer       - Money Transfer                       │
│  ├── /history        - Transaction History                  │
│  └── /profile        - User Profile Management              │
│                                                             │
│  🎣 Custom Hooks:                                           │
│  ├── useGoogleAuth   - Google OAuth Integration             │
│  ├── useFacebookAuth - Facebook OAuth Integration           │
│  └── useDarkMode     - Theme Management                     │
│                                                             │
│  🎨 UI Components:                                         │
│  ├── AnimatedDigit   - Balance Animation                    │
│  ├── CounterScroller - Number Scrolling Effect              │
│  └── DarkModeContext - Theme Context Provider               │
└─────────────────────────────────────────────────────────────┘
```

### **Backend Layer (FastAPI)**
```
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                       │
├─────────────────────────────────────────────────────────────┤
│  🔌 API Endpoints:                                         │
│  ├── /api/auth/google      - Google OAuth Handler          │
│  ├── /api/auth/facebook    - Facebook OAuth Handler        │
│  ├── /auth/google/config   - Google OAuth Configuration    │
│  ├── /auth/facebook/config - Facebook OAuth Configuration  │
│  ├── /api/login            - Traditional Login             │
│  ├── /api/register         - User Registration             │
│  ├── /api/profile          - User Profile Management       │
│  ├── /api/setup-password   - Setup Password for OAuth      │
│  ├── /api/change-password  - Change User Password          │
│  ├── /api/balance          - Account Balance               │
│  ├── /api/deposit          - Money Deposit                 │
│  ├── /api/withdraw         - Money Withdrawal              │
│  ├── /api/transfer         - Money Transfer                │
│  └── /api/transactions     - Transaction History           │
│                                                            │
│  🗄️ Core Services:                                         │
│  ├── Authentication        - OAuth + Password Auth         │
│  ├── User Management      - CRUD Operations                │
│  ├── Banking Operations   - Financial Transactions         │
│  ├── Email Service        - SMTP via Gmail                 │
│  └── Security             - Password Hashing, JWT          │
└─────────────────────────────────────────────────────────────┘
```

### **Database Layer (PostgreSQL)**
```
┌─────────────────────────────────────────────────────────────┐
│                Database Schema (PostgreSQL)                 │
├─────────────────────────────────────────────────────────────┤
│  👥 Users Table:                                            │
│  ├── id (Primary Key)                                      │
│  ├── username (Unique)                                     │
│  ├── email (Unique)                                        │
│  ├── hashed_password                                       │
│  ├── display_name                                          │
│  ├── auth_provider         - email/google/facebook         │
│  ├── oauth_id             - OAuth Provider User ID        │
│  ├── is_active                                            │
│  └── is_admin                                             │
│                                                            │
│  💰 Accounts Table:                                        │
│  ├── id (Primary Key)                                      │
│  ├── user_id (Foreign Key)                                 │
│  ├── balance                                               │
│  └── account_type                                         │
│                                                             │
│  💸 Transactions Table:                                    │
│  ├── id (Primary Key)                                      │
│  ├── from_account_id                                       │
│  ├── to_account_id                                         │
│  ├── amount                                                │
│  ├── transaction_type      - deposit/withdraw/transfer     │
│  ├── timestamp                                             │
│  └── status                                               │
│                                                             │
│  🔑 Recovery Codes Table:                                  │
│  ├── id (Primary Key)                                      │
│  ├── user_id (Foreign Key)                                 │
│  ├── code_hash                                            │
│  └── expires_at                                           │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 **Data Flow Architecture**

### **Authentication Flow**
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant O as OAuth Provider

    Note over U,DB: Google/Facebook OAuth Flow
    U->>F: Click OAuth Button
    F->>O: Redirect to OAuth
    O->>F: Return with Code
    F->>B: Send OAuth Code
    B->>O: Verify Token
    O->>B: User Info
    B->>DB: Check/Create User
    DB->>B: User Data
    B->>F: Authentication Success
    F->>U: Redirect to Dashboard

    Note over U,DB: Traditional Login Flow
    U->>F: Enter Email/Password
    F->>B: Send Credentials
    B->>DB: Verify Password
    DB->>B: User Data
    B->>F: Authentication Success
    F->>U: Redirect to Dashboard
```

### **Banking Operations Flow**
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    Note over U,DB: Transaction Flow
    U->>F: Initiate Transaction
    F->>B: Send Transaction Request
    B->>DB: Validate Balance
    B->>DB: Create Transaction Record
    B->>DB: Update Account Balance
    B->>F: Transaction Success
    F->>U: Show Updated Balance
```

## 🐳 **Container Architecture**

### **Docker Container Structure**
```
┌─────────────────────────────────────────────────────────────┐
│                Docker Container (Port 80)                   │
├─────────────────────────────────────────────────────────────┤
│  🚀 Supervisor (Process Manager)                           │
│  ├── Backend Service    - FastAPI on Port 8000            │
│  ├── Frontend Service   - Next.js on Port 3000            │
│  └── Nginx Service      - Reverse Proxy on Port 80        │
│                                                             │
│  🌐 Nginx Configuration:                                    │
│  ├── /api/* → Backend (Port 8000)                         │
│  ├── /* → Frontend (Port 3000)                            │
│  └── Static Files → Frontend Build                         │
│                                                             │
│  🔧 Environment Variables:                                  │
│  ├── DATABASE_URL         - PostgreSQL Connection          │
│  ├── GOOGLE_CLIENT_ID     - OAuth Configuration            │
│  ├── FACEBOOK_APP_ID      - OAuth Configuration            │
│  ├── GMAIL_EMAIL          - SMTP Configuration             │
│  └── ENVIRONMENT          - dev/production                  │
└─────────────────────────────────────────────────────────────┘
```

## 🌍 **Deployment Architecture**

### **Production Environment**
```
┌─────────────────────────────────────────────────────────────┐
│                    Production Stack                         │
├─────────────────────────────────────────────────────────────┤
│  🌐 Domain: bluebank.unifra.org                            │
│                                                             │
│  🛡️ Cloudflare:                                            │
│  ├── CDN & Caching                                         │
│  ├── SSL/TLS Termination                                   │
│  ├── DDoS Protection                                       │
│  └── Global Edge Network                                   │
│                                                             │
│  ☁️ AWS Lightsail:                                         │
│  ├── Virtual Private Server                                │
│  ├── Docker Container                                      │
│  ├── Port 80 (HTTP)                                        │
│  └── Firewall Rules                                        │
│                                                             │
│  🗄️ AWS RDS:                                               │
│  ├── PostgreSQL Database                                   │
│  ├── Automated Backups                                     │
│  ├── Multi-AZ Deployment                                   │
│  └── Security Groups                                       │
└─────────────────────────────────────────────────────────────┘
```

### **Development Environment**
```
┌─────────────────────────────────────────────────────────────┐
│                   Development Stack                         │
├─────────────────────────────────────────────────────────────┤
│  💻 Local Development:                                     │
│  ├── Frontend: npm run dev (Port 3000)                    │
│  ├── Backend: uvicorn main:app --reload (Port 8000)       │
│  └── Database: Local SQLite (Optional)                     │
│                                                             │
│  🐳 Docker Development:                                    │
│  ├── docker-compose.dev.yml                                │
│  ├── Frontend: Port 3000                                   │
│  ├── Backend: Port 8000                                    │
│  └── Nginx: Port 8080                                      │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 **Security Architecture**

### **Authentication & Authorization**
```
┌─────────────────────────────────────────────────────────────┐
│                Security Layers                              │
├─────────────────────────────────────────────────────────────┤
│  🛡️ OAuth 2.0 Security:                                   │
│  ├── Google OAuth          - Verified by Google            │
│  ├── Facebook OAuth        - Verified by Meta              │
│  └── State Validation      - CSRF Protection               │
│                                                             │
│  🔐 Password Security:                                     │
│  ├── bcrypt Hashing        - Salt + Hash                   │
│  ├── Session Management    - sessionStorage                 │
│  └── Password Validation   - Strength Requirements         │
│                                                             │
│  🌐 Network Security:                                       │
│  ├── HTTPS Only            - TLS 1.3                       │
│  ├── CORS Configuration    - Origin Validation             │
│  ├── Rate Limiting         - API Protection                │
│  └── Input Validation      - SQL Injection Prevention      │
└─────────────────────────────────────────────────────────────┘
```

## 📱 **User Experience Flow**

### **Complete User Journey**
```mermaid
journey
    title BlueBank User Experience Flow
    section Registration
      Visit Site: 5: User
      Choose Auth Method: 4: User
      Complete OAuth/Registration: 5: User
      Redirect to Balance: 5: User
    section Banking
      View Balance: 5: User
      Make Transaction: 4: User
      View History: 4: User
      Manage Profile: 3: User
    section Security
      Two-Factor Setup: 4: User
      Password Management: 3: User
      Account Linking: 4: User
```

## 🚀 **Scalability Considerations**

### **Horizontal Scaling Strategy**
```
┌─────────────────────────────────────────────────────────────┐
│                Scalability Architecture                     │
├─────────────────────────────────────────────────────────────┤
│  📈 Load Balancer:                                         │
│  ├── Multiple Container Instances                          │
│  ├── Health Checks                                         │
│  └── Auto-scaling Groups                                   │
│                                                             │
│  🗄️ Database Scaling:                                      │
│  ├── Read Replicas                                         │
│  ├── Connection Pooling                                    │
│  └── Query Optimization                                    │
│                                                             │
│  🚀 Performance:                                            │
│  ├── Redis Caching                                         │
│  ├── CDN for Static Assets                                 │
│  └── API Response Caching                                  │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 **Technology Stack Summary**

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 14.x | React Framework with SSR |
| **Backend** | FastAPI | 0.104.x | Python API Framework |
| **Database** | PostgreSQL | 15.x | Primary Database |
| **Container** | Docker | 24.x | Application Containerization |
| **Proxy** | Nginx | 1.26.x | Reverse Proxy & Load Balancer |
| **Process Manager** | Supervisor | 4.x | Service Management |
| **Authentication** | OAuth 2.0 | - | Google & Facebook Integration |
| **Deployment** | AWS Lightsail | - | Cloud Infrastructure |
| **CDN** | Cloudflare | - | Content Delivery & Security |
| **Email** | Gmail SMTP | - | Transaction Notifications |

## 📋 **API Endpoints Summary**

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `POST` | `/api/register` | User Registration | None |
| `POST` | `/api/login` | User Login | None |
| `POST` | `/api/auth/google` | Google OAuth | Google Token |
| `POST` | `/api/auth/facebook` | Facebook OAuth | Facebook Token |
| `GET` | `/auth/google/config` | Google OAuth Config | None |
| `GET` | `/auth/facebook/config` | Facebook OAuth Config | None |
| `POST` | `/api/profile` | User Profile | Email + Password |
| `POST` | `/api/setup-password` | Setup Password for OAuth | Email + Password |
| `POST` | `/api/change-password` | Change User Password | Email + Password |
| `POST` | `/api/balance` | Account Balance | Email + Password |
| `POST` | `/api/deposit` | Money Deposit | Email + Password |
| `POST` | `/api/withdraw` | Money Withdrawal | Email + Password |
| `POST` | `/api/transfer` | Money Transfer | Email + Password |
| `POST` | `/api/transactions` | Transaction History | Email + Password |

---

*This architecture diagram represents the current state of the BlueBank project as of the latest deployment.*