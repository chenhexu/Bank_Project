# BlueBank Architecture Documentation

## Overview

BlueBank is a modern, full-stack banking application built with a microservices-inspired architecture using FastAPI for the backend, Next.js for the frontend, and PostgreSQL for data persistence. The application is containerized with Docker and designed for cloud deployment with horizontal scaling capabilities.

## System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile Browser]
    end
    
    subgraph "Load Balancer & Reverse Proxy"
        NGINX[Nginx<br/>Port 80/443]
    end
    
    subgraph "Frontend Layer"
        NEXTJS[Next.js Frontend<br/>Port 3000]
        STATIC[Static Assets<br/>Images, CSS, JS]
    end
    
    subgraph "Backend Layer"
        API[FastAPI Backend<br/>Port 8000]
        AUTH[Authentication Service]
        BANKING[Banking Operations]
        NOTIFICATIONS[Notification System]
    end
    
    subgraph "External Services"
        GOOGLE[Google OAuth]
        FACEBOOK[Facebook OAuth]
        GMAIL[Gmail SMTP]
    end
    
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL Database<br/>Azure/AWS RDS)]
        CACHE[Local Storage<br/>Browser Cache]
    end
    
    subgraph "Container Orchestration"
        DOCKER[Docker Container]
    end
    
    WEB --> NGINX
    MOBILE --> NGINX
    NGINX --> NEXTJS
    NGINX --> API
    NEXTJS --> API
    NEXTJS --> CACHE
    
    API --> AUTH
    API --> BANKING
    API --> NOTIFICATIONS
    
    AUTH --> GOOGLE
    AUTH --> FACEBOOK
    NOTIFICATIONS --> GMAIL
    
    API --> POSTGRES
    
    NEXTJS -.-> DOCKER
    API -.-> DOCKER
    NGINX -.-> DOCKER
```

## Component Architecture

### Frontend Architecture (Next.js)

```mermaid
graph TD
    subgraph "Next.js App Router"
        LAYOUT[Root Layout<br/>app/layout.js]
        HOME[Home Page<br/>app/page.js]
        LOGIN[Login Page<br/>app/login/page.tsx]
        REGISTER[Register Page<br/>app/register/page.tsx]
        BALANCE[Balance Page<br/>app/balance/page.tsx]
        TRANSFER[Transfer Page<br/>app/transfer/page.tsx]
        PROFILE[Profile Page<br/>app/profile/page.tsx]
    end
    
    subgraph "Components"
        ANIMATED[AnimatedDigit.tsx]
        COUNTER[CounterScroller.tsx]
        DIGIT[DigitScroller.tsx]
    end
    
    subgraph "Contexts"
        DARKMODE[DarkModeContext.tsx]
    end
    
    subgraph "Styling"
        TAILWIND[Tailwind CSS]
        GLOBALS[globals.css]
    end
    
    LAYOUT --> HOME
    LAYOUT --> LOGIN
    LAYOUT --> REGISTER
    LAYOUT --> BALANCE
    LAYOUT --> TRANSFER
    LAYOUT --> PROFILE
    
    BALANCE --> ANIMATED
    BALANCE --> COUNTER
    ANIMATED --> DIGIT
    
    LAYOUT --> DARKMODE
    
    HOME --> TAILWIND
    LOGIN --> TAILWIND
    REGISTER --> TAILWIND
    BALANCE --> TAILWIND
    TRANSFER --> TAILWIND
    PROFILE --> TAILWIND
    
    TAILWIND --> GLOBALS
```

### Backend Architecture (FastAPI)

```mermaid
graph TD
    subgraph "FastAPI Application"
        MAIN[main.py<br/>FastAPI App]
        ROUTES[API Routes]
        MIDDLEWARE[CORS Middleware]
    end
    
    subgraph "Authentication Layer"
        AUTH_MODULE[auth.py]
        JWT[JWT Tokens]
        OAUTH[OAuth Handlers]
    end
    
    subgraph "Data Layer"
        MODELS[models.py<br/>SQLAlchemy Models]
        SCHEMAS[schemas.py<br/>Pydantic Schemas]
        DATABASE[database.py<br/>DB Connection]
    end
    
    subgraph "Business Logic"
        USER_MGMT[User Management]
        BANKING_OPS[Banking Operations]
        TRANSACTION_LOG[Transaction Logging]
        NOTIFICATION_SVC[Notification Service]
    end
    
    MAIN --> ROUTES
    MAIN --> MIDDLEWARE
    ROUTES --> AUTH_MODULE
    AUTH_MODULE --> JWT
    AUTH_MODULE --> OAUTH
    
    ROUTES --> USER_MGMT
    ROUTES --> BANKING_OPS
    ROUTES --> TRANSACTION_LOG
    ROUTES --> NOTIFICATION_SVC
    
    USER_MGMT --> MODELS
    BANKING_OPS --> MODELS
    TRANSACTION_LOG --> MODELS
    NOTIFICATION_SVC --> MODELS
    
    MODELS --> DATABASE
    ROUTES --> SCHEMAS
```

## Data Flow Architecture

### User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant G as Google OAuth
    participant D as Database
    
    U->>F: Login Request
    F->>A: POST /api/login
    A->>D: Validate Credentials
    D-->>A: User Data
    A-->>F: JWT Token
    F->>F: Store Token (localStorage)
    F-->>U: Redirect to Dashboard
    
    Note over U,D: OAuth Flow
    U->>F: Google Login
    F->>G: OAuth Request
    G-->>F: Authorization Code
    F->>A: POST /api/auth/google
    A->>G: Exchange Code for Token
    G-->>A: User Profile
    A->>D: Create/Update User
    D-->>A: User ID
    A-->>F: JWT Token
    F-->>U: Redirect to Dashboard
```

### Banking Transaction Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant D as Database
    participant N as Notification System
    
    U->>F: Transfer Money
    F->>A: POST /api/transfer
    A->>A: Validate JWT Token
    A->>D: Check Sender Balance
    D-->>A: Balance Data
    A->>A: Validate Transaction
    A->>D: Begin Transaction
    A->>D: Debit Sender Account
    A->>D: Credit Receiver Account
    A->>D: Log Transaction
    A->>D: Commit Transaction
    D-->>A: Success
    A->>N: Create Notification
    A-->>F: Transaction Success
    F->>F: Update Local State
    F->>F: Trigger Balance Refresh
    F-->>U: Success Message
    
    Note over F: Real-time Updates
    F->>F: Poll Balance (3s interval)
    F->>A: GET /api/balance
    A->>D: Fetch Current Balance
    D-->>A: Balance Data
    A-->>F: Updated Balance
    F->>F: Animate Balance Change
```

## Key Design Patterns

### 1. Repository Pattern (Backend)
- **Models**: SQLAlchemy ORM models define database schema
- **Database Layer**: Centralized database connection and session management
- **Business Logic**: Separated from data access logic

### 2. Component-Based Architecture (Frontend)
- **Reusable Components**: AnimatedDigit, CounterScroller for UI consistency
- **Context API**: DarkModeContext for global state management
- **Page-Based Routing**: Next.js App Router for navigation

### 3. Middleware Pattern
- **CORS Middleware**: Cross-origin request handling
- **Authentication Middleware**: JWT token validation
- **Error Handling**: Centralized exception handling

### 4. Observer Pattern (Frontend)
- **Storage Events**: Cross-tab communication for balance updates
- **Polling System**: Regular API calls for real-time data
- **State Management**: React hooks for component state

## Security Architecture

### Authentication & Authorization

```mermaid
graph TD
    subgraph "Authentication Methods"
        EMAIL[Email/Password]
        GOOGLE[Google OAuth 2.0]
        FACEBOOK[Facebook OAuth]
    end
    
    subgraph "Token Management"
        JWT[JWT Tokens]
        REFRESH[Refresh Tokens]
        STORAGE[localStorage]
    end
    
    subgraph "Authorization"
        MIDDLEWARE[Auth Middleware]
        VALIDATION[Token Validation]
        PERMISSIONS[User Permissions]
    end
    
    subgraph "Security Measures"
        CORS[CORS Protection]
        HTTPS[HTTPS Encryption]
        VALIDATION_RULES[Input Validation]
        SQL_INJECTION[SQL Injection Prevention]
    end
    
    EMAIL --> JWT
    GOOGLE --> JWT
    FACEBOOK --> JWT
    
    JWT --> STORAGE
    REFRESH --> STORAGE
    
    STORAGE --> MIDDLEWARE
    MIDDLEWARE --> VALIDATION
    VALIDATION --> PERMISSIONS
    
    CORS --> HTTPS
    HTTPS --> VALIDATION_RULES
    VALIDATION_RULES --> SQL_INJECTION
```

### Data Protection
- **Password Hashing**: bcrypt with salt
- **JWT Tokens**: Secure token-based authentication
- **HTTPS Encryption**: TLS 1.3 for data in transit
- **Input Validation**: Pydantic schemas for request validation
- **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries

## Database Schema

### Core Entities

```mermaid
erDiagram
    USERS {
        int id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        string phone
        decimal balance
        datetime created_at
        datetime updated_at
        boolean is_active
        string oauth_provider
        string oauth_id
    }
    
    TRANSACTIONS {
        int id PK
        int sender_id FK
        int receiver_id FK
        decimal amount
        string transaction_type
        string description
        datetime created_at
        string status
    }
    
    NOTIFICATIONS {
        int id PK
        int user_id FK
        string message
        string type
        boolean is_read
        datetime created_at
    }
    
    PASSWORD_RESETS {
        int id PK
        int user_id FK
        string token
        datetime expires_at
        datetime created_at
        boolean used
    }
    
    USERS ||--o{ TRANSACTIONS : "sender"
    USERS ||--o{ TRANSACTIONS : "receiver"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ PASSWORD_RESETS : "requests"
```

## Deployment Architecture

### Containerization Strategy

```mermaid
graph TB
    subgraph "Docker Multi-Stage Build"
        STAGE1[Stage 1: Frontend Build<br/>Node.js 18-alpine]
        STAGE2[Stage 2: Backend Setup<br/>Python 3.13-slim]
        STAGE3[Stage 3: Production<br/>Nginx + Python]
    end
    
    subgraph "Production Container"
        NGINX_PROD[Nginx<br/>Static Files + Proxy]
        FASTAPI_PROD[FastAPI<br/>Gunicorn + Uvicorn]
        SUPERVISOR[Supervisor<br/>Process Management]
    end
    
    subgraph "External Dependencies"
        DB_CLOUD[Cloud Database<br/>Azure PostgreSQL]
        OAUTH_SERVICES[OAuth Providers]
        EMAIL_SERVICE[Email Service]
    end
    
    STAGE1 --> STAGE2
    STAGE2 --> STAGE3
    STAGE3 --> NGINX_PROD
    STAGE3 --> FASTAPI_PROD
    STAGE3 --> SUPERVISOR
    
    FASTAPI_PROD --> DB_CLOUD
    FASTAPI_PROD --> OAUTH_SERVICES
    FASTAPI_PROD --> EMAIL_SERVICE
```

### Cloud Deployment Options

1. **AWS Lightsail**: Simple VPS deployment
2. **Azure Container Instances**: Serverless containers
3. **Docker Hub**: Container registry
4. **AWS RDS / Azure PostgreSQL**: Managed database

## Performance Considerations

### Frontend Optimizations
- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component
- **Static Generation**: Pre-built pages where possible
- **Client-Side Caching**: localStorage for user data
- **Debounced API Calls**: Prevent excessive requests

### Backend Optimizations
- **Database Connection Pooling**: SQLAlchemy connection pool
- **Async Operations**: FastAPI async/await support
- **Response Caching**: HTTP caching headers
- **Database Indexing**: Optimized queries with indexes
- **Pagination**: Large dataset handling

### Real-Time Features
- **Polling Strategy**: 3-second intervals for balance updates
- **Event-Driven Updates**: Storage events for cross-tab sync
- **Optimistic UI**: Immediate UI updates before server confirmation

## Monitoring & Logging

### Application Logging
```python
# Backend logging configuration
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Key Metrics to Monitor
- **Response Times**: API endpoint performance
- **Error Rates**: 4xx/5xx HTTP responses
- **Database Performance**: Query execution times
- **User Activity**: Login/transaction patterns
- **Resource Usage**: CPU/Memory utilization

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: No server-side sessions
- **Database Scaling**: Read replicas for heavy read operations
- **Load Balancing**: Multiple container instances
- **CDN Integration**: Static asset delivery

### Vertical Scaling
- **Resource Optimization**: Container resource limits
- **Database Tuning**: Connection pool sizing
- **Caching Strategy**: Redis for session storage (future)

## Future Enhancements

### Technical Improvements
1. **Microservices**: Split into dedicated services (Auth, Banking, Notifications)
2. **Message Queue**: Redis/RabbitMQ for async processing
3. **WebSocket**: Real-time notifications without polling
4. **API Gateway**: Centralized API management
5. **Monitoring**: Prometheus + Grafana integration

### Feature Enhancements
1. **Mobile App**: React Native implementation
2. **Advanced Analytics**: Transaction insights and reporting
3. **Multi-Currency**: International banking support
4. **Loan System**: Credit and loan management
5. **Investment Platform**: Stock/crypto trading integration

## Conclusion

BlueBank's architecture is designed for scalability, maintainability, and security. The separation of concerns between frontend and backend, combined with modern containerization and cloud deployment strategies, provides a solid foundation for a production banking application.

The use of industry-standard technologies (FastAPI, Next.js, PostgreSQL) ensures long-term maintainability and developer familiarity. The security-first approach with OAuth integration, JWT tokens, and input validation provides the necessary protection for financial data.

The real-time features and responsive design create an excellent user experience, while the modular architecture allows for easy feature additions and scaling as the application grows.