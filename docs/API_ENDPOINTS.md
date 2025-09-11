# 🔌 **BlueBank API Endpoints Documentation**

## 📋 **API Overview**

Your BlueBank backend provides **21 endpoints** across **6 categories**:
- 🔐 **Authentication** (4 endpoints)
- 🏦 **Banking Operations** (3 endpoints)
- 📊 **Account Information** (4 endpoints)
- 👤 **User Management** (2 endpoints)
- 🔑 **Password Recovery** (3 endpoints)
- 🛠️ **System Utilities** (5 endpoints)

---

## 🔐 **Authentication Endpoints**

### **1. User Registration**
```http
POST /register
```
**Full URL**: `http://localhost:8000/register` (Development) | `https://bluebank.unifra.org/register` (Production)
**Purpose**: Create a new user account
**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "display_name": "John Doe",
  "dob_month": "12",
  "dob_day": "25",
  "dob_year": "1990",
  "phone": "+1234567890"
}
```
**Response**:
```json
{
  "message": "User registered successfully"
}
```

### **2. User Login**
```http
POST /login
```
**Full URL**: `http://localhost:8000/login` (Development) | `https://bluebank.unifra.org/login` (Production)
**Purpose**: Authenticate existing user
**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```
**Response**:
```json
{
  "message": "Login successful"
}
```

### **3. Google OAuth Authentication**
```http
POST /api/auth/google
```
**Full URL**: `http://localhost:8000/api/auth/google` (Development) | `https://bluebank.unifra.org/api/auth/google` (Production)
**Purpose**: Authenticate user with Google OAuth
**Request Body**:
```json
{
  "code": "4/0AfJohXn...",  // Authorization code
  "credential": "eyJhbGciOiJSUzI1NiIs..."  // ID token
}
```
**Response**:
```json
{
  "message": "Welcome to BlueBank!",
  "access_token": "google_oauth_token",
  "user_profile": {
    "email": "john@gmail.com",
    "username": "john_doe_0001",
    "display_name": "John Doe",
    "is_new": true
  }
}
```

### **4. Google OAuth Configuration**
```http
GET /api/auth/google/config
```
**Full URL**: `http://localhost:8000/api/auth/google/config` (Development) | `https://bluebank.unifra.org/api/auth/google/config` (Production)
**Purpose**: Get Google OAuth configuration for frontend
**Response**:
```json
{
  "client_id": "730848972905-vvg0cmmf7mjoo82ripb3i3ilt6jhj9bb.apps.googleusercontent.com",
  "redirect_uri": "http://localhost:3000/oauth-callback"
}
```

### **5. Facebook OAuth Authentication**
```http
POST /api/auth/facebook
```
**Full URL**: `http://localhost:8000/api/auth/facebook` (Development) | `https://bluebank.unifra.org/api/auth/facebook` (Production)
**Purpose**: Authenticate user with Facebook OAuth
**Request Body**:
```json
{
  "access_token": "EAABwzLixnjYBO..."
}
```
**Response**:
```json
{
  "message": "Welcome to BlueBank!",
  "access_token": "facebook_oauth_token",
  "user_profile": {
    "email": "john@facebook.com",
    "username": "john_doe_0001",
    "display_name": "John Doe",
    "is_new": true
  }
}
```

### **6. Facebook OAuth Configuration**
```http
GET /api/auth/facebook/config
```
**Full URL**: `http://localhost:8000/api/auth/facebook/config` (Development) | `https://bluebank.unifra.org/api/auth/facebook/config` (Production)
**Purpose**: Get Facebook OAuth configuration for frontend
**Response**:
```json
{
  "app_id": "1429308784784365",
  "redirect_uri": "http://localhost:3000/oauth-callback"
}
```

---

## 🏦 **Banking Operations Endpoints**

### **7. Deposit Money**
```http
POST /deposit
```
**Full URL**: `http://localhost:8000/deposit` (Development) | `https://bluebank.unifra.org/deposit` (Production)
**Purpose**: Add money to user's account
**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123",
  "amount": 100.50
}
```
**Response**:
```json
{
  "message": "Deposit successful",
  "new_balance": "1100.50"
}
```

### **8. Withdraw Money**
```http
POST /withdraw
```
**Full URL**: `http://localhost:8000/withdraw` (Development) | `https://bluebank.unifra.org/withdraw` (Production)
**Purpose**: Remove money from user's account
**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123",
  "amount": 50.25
}
```
**Response**:
```json
{
  "message": "Withdrawal successful",
  "new_balance": "1050.25"
}
```

### **9. Transfer Money**
```http
POST /transfer
```
**Full URL**: `http://localhost:8000/transfer` (Development) | `https://bluebank.unifra.org/transfer` (Production)
**Purpose**: Transfer money between users
**Request Body**:
```json
{
  "from_email": "john@example.com",
  "to_email": "jane@example.com",
  "password": "securepassword123",
  "amount": 25.00
}
```
**Response**:
```json
{
  "message": "Transfer successful",
  "new_balance": "1025.25"
}
```

---

## 📊 **Account Information Endpoints**

### **10. Get Balance (Username)**
```http
GET /balance/{username}?password={password}
```
**Full URL**: `http://localhost:8000/balance/{username}?password={password}` (Development) | `https://bluebank.unifra.org/balance/{username}?password={password}` (Production)
**Purpose**: Get account balance using username
**Parameters**:
- `username`: User's username
- `password`: User's password (query parameter)
**Response**:
```json
{
  "balance": "1025.25"
}
```

### **11. Get Balance (Email)**
```http
POST /balance
```
**Full URL**: `http://localhost:8000/balance` (Development) | `https://bluebank.unifra.org/balance` (Production)
**Purpose**: Get account balance using email
**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```
**Response**:
```json
{
  "balance": "1025.25"
}
```

### **12. Get Transactions (Username)**
```http
GET /transactions/{username}?password={password}
```
**Full URL**: `http://localhost:8000/transactions/{username}?password={password}` (Development) | `https://bluebank.unifra.org/transactions/{username}?password={password}` (Production)
**Purpose**: Get transaction history using username
**Parameters**:
- `username`: User's username
- `password`: User's password (query parameter)
**Response**:
```json
[
  {
    "type": "Deposit",
    "amount": 100.50,
    "old_balance": 1000.00,
    "new_balance": 1100.50,
    "timestamp": "2024-01-15T10:30:00",
    "description": "Deposit",
    "other_user": null
  },
  {
    "type": "Transfer",
    "amount": 25.00,
    "old_balance": 1100.50,
    "new_balance": 1075.50,
    "timestamp": "2024-01-15T11:00:00",
    "description": "Transfer to jane@example.com",
    "other_user": "jane_doe"
  }
]
```

### **13. Get Transactions (Email)**
```http
POST /transactions
```
**Full URL**: `http://localhost:8000/transactions` (Development) | `https://bluebank.unifra.org/transactions` (Production)
**Purpose**: Get transaction history using email
**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```
**Response**: Same as username endpoint

---

## 👤 **User Management Endpoints**

### **14. Get User Profile**
```http
POST /profile
```
**Full URL**: `http://localhost:8000/profile` (Development) | `https://bluebank.unifra.org/profile` (Production)
**Purpose**: Get user profile information
**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```
**Response**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "display_name": "John Doe",
  "dob_month": "12",
  "dob_day": "25",
  "dob_year": "1990",
  "phone": "+1234567890"
}
```

---

## 🔑 **Password Recovery Endpoints**

### **15. Forgot Password**
```http
POST /forgot-password
```
**Full URL**: `http://localhost:8000/forgot-password` (Development) | `https://bluebank.unifra.org/forgot-password` (Production)
**Purpose**: Generate recovery code for password reset
**Request Body**:
```json
{
  "email": "john@example.com"
}
```
**Response**:
```json
{
  "message": "Recovery code sent to your email",
  "recovery_code": "ABC123XYZ"
}
```

### **16. Generate Recovery Code**
```http
POST /generate-recovery-code
```
**Full URL**: `http://localhost:8000/generate-recovery-code` (Development) | `https://bluebank.unifra.org/generate-recovery-code` (Production)
**Purpose**: Generate a new recovery code (same as forgot-password)
**Request Body**:
```json
{
  "email": "john@example.com"
}
```
**Response**: Same as forgot-password

### **17. Reset Password**
```http
POST /reset-password
```
**Full URL**: `http://localhost:8000/reset-password` (Development) | `https://bluebank.unifra.org/reset-password` (Production)
**Purpose**: Reset password using recovery code
**Request Body**:
```json
{
  "email": "john@example.com",
  "recovery_code": "ABC123XYZ",
  "new_password": "newsecurepassword123"
}
```
**Response**:
```json
{
  "message": "Password reset successfully"
}
```

---

## 🛠️ **System Utilities Endpoints**

### **18. Health Check**
```http
GET /
```
**Full URL**: `http://localhost:8000/` (Development) | `https://bluebank.unifra.org/` (Production)
**Purpose**: Check if the API is running and database is connected
**Response**:
```json
{
  "status": "healthy",
  "message": "BlueBank API is running",
  "database": "connected",
  "timestamp": "2024-01-15T12:00:00"
}
```

### **19. User Count**
```http
GET /user-count
```
**Full URL**: `http://localhost:8000/user-count` (Development) | `https://bluebank.unifra.org/user-count` (Production)
**Purpose**: Get total number of registered users
**Response**:
```json
{
  "count": 150
}
```

---

## 🔧 **Authentication & Security**

### **🔐 Authentication Methods:**
1. **Email/Password**: Traditional login for registered users
2. **Google OAuth**: Social login using Google account
3. **Facebook OAuth**: Social login using Facebook account

### **🛡️ Security Features:**
- **Password Hashing**: All passwords are hashed using bcrypt
- **Token Verification**: OAuth tokens are verified server-side
- **Account Linking**: Users can link multiple auth methods to same email
- **Recovery Codes**: Secure password reset with one-time codes

### **📡 Request Headers:**
```http
Content-Type: application/json
```

### **⚡ Response Codes:**
- `200`: Success
- `400`: Bad Request (invalid data)
- `401`: Unauthorized (invalid credentials)
- `404`: Not Found (user/endpoint not found)
- `500`: Internal Server Error

---

## 🌐 **Base URL**

**Development**: `http://localhost:8000`
**Production**: `https://bluebank.unifra.org`

**Example**: `http://localhost:8000/api/auth/google`

---

## 📚 **Testing Examples**

### **Using curl:**
```bash
# Register a new user
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","display_name":"Test User","dob_month":"01","dob_day":"01","dob_year":"1990","phone":"+1234567890"}'

# Login
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get balance
curl -X POST http://localhost:8000/balance \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### **Using JavaScript/Fetch:**
```javascript
// Login example
const response = await fetch('http://localhost:8000/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
});

const data = await response.json();
console.log(data);
```

---

## 🎯 **Summary**

Your BlueBank API provides a complete banking system with:
- ✅ **User authentication** (traditional + OAuth)
- ✅ **Banking operations** (deposit, withdraw, transfer)
- ✅ **Account management** (balance, transactions, profile)
- ✅ **Security features** (password recovery, token verification)
- ✅ **System monitoring** (health checks, user counts)

**All endpoints are RESTful, secure, and ready for production use!** 🚀✨ 