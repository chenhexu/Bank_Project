# 🛡️ BlueBank Security Enhancement & Penetration Testing Guide

## 🎯 **For Your Friend (The Ethical Hacker)**

Your friend testing your security is **excellent practice**! Here's what they should focus on:

---

## 🚨 **Critical Vulnerabilities to Test**

### **1. Authentication Bypass Attempts**
```bash
# Test these attack vectors:

# SQL Injection on Login
POST /api/login
{
  "email": "admin'--",
  "password": "anything"
}

# OR try:
{
  "email": "' OR '1'='1",
  "password": "' OR '1'='1"
}

# Brute Force Login (no rate limiting currently)
for i in {1..1000}; do
  curl -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"password'$i'"}'
done
```

### **2. Input Validation Bypass**
```bash
# XSS Attempts
POST /api/register
{
  "email": "test@test.com",
  "display_name": "<script>alert('XSS')</script>",
  "username": "<img src=x onerror=alert('XSS')>",
  "password": "test123"
}

# Large Number Attacks
POST /api/deposit
{
  "email": "user@test.com",
  "password": "password",
  "amount": 999999999999999999999
}

# Negative Amount Bypass
POST /api/withdraw
{
  "email": "user@test.com", 
  "password": "password",
  "amount": -1000
}
```

### **3. Authorization Bypass**
```bash
# Test accessing other users' data
GET /api/transactions/other_username?password=wrong_password

# Test transferring with manipulated session
POST /api/transfer
{
  "from_email": "victim@test.com",
  "to_email": "attacker@test.com",
  "password": "guessed_password",
  "amount": 1000
}
```

### **4. Session Manipulation** 
```javascript
// In browser console, try manipulating session:
sessionStorage.setItem("email", "admin@bluebank.com");
sessionStorage.setItem("password", "GOOGLE_OAUTH_USER_NO_PASSWORD");

// Then try accessing protected pages
window.location.href = "/balance";
```

### **5. API Enumeration**
```bash
# Try accessing undocumented endpoints
GET /api/admin
GET /api/users
GET /api/config
GET /api/debug
GET /.env
GET /api/internal
```

---

## 🔧 **Security Improvements We Should Implement**

### **1. Rate Limiting (Critical)**
```python
# Add to backend/requirements.txt
slowapi==0.1.9

# Add to main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add to login endpoint
@limiter.limit("5/minute")  # 5 attempts per minute
@app.post("/login")
def login(request: Request, user: LoginRequest):
    # existing code
```

### **2. Input Sanitization**
```python
# Add HTML sanitization
from html import escape
import re

def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS"""
    if not text:
        return text
    # Remove HTML tags and escape special characters
    text = re.sub(r'<[^>]*>', '', text)
    text = escape(text)
    return text.strip()

# Apply to all user inputs
display_name = sanitize_input(user.display_name)
```

### **3. Amount Validation**
```python
# Enhanced validation in banking operations
def validate_amount(amount: Decimal) -> Decimal:
    """Validate transaction amount"""
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if amount > 1000000:  # Max $1M per transaction
        raise HTTPException(status_code=400, detail="Amount exceeds maximum limit")
    # Check for decimal precision (max 2 decimal places)
    if amount.as_tuple().exponent < -2:
        raise HTTPException(status_code=400, detail="Amount has too many decimal places")
    return amount
```

### **4. Session Security**
```python
# Add JWT tokens instead of plain session storage
from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key-here"  # Use proper secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

### **5. CORS Security**
```python
# Fix CORS to be restrictive
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8080", 
        "https://bluebank.unifra.org"
    ],  # Specific origins only
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Only needed methods
    allow_headers=["Content-Type", "Authorization"],  # Specific headers
)
```

---

## 🕵️ **Advanced Security Tests**

### **1. Business Logic Attacks**
```bash
# Test race conditions (rapid concurrent requests)
# Transfer money while simultaneously withdrawing
curl -X POST http://localhost:8000/api/transfer & \
curl -X POST http://localhost:8000/api/withdraw &

# Test double spending
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/transfer \
    -H "Content-Type: application/json" \
    -d '{"from_email":"user@test.com","to_email":"attacker@test.com","password":"password","amount":100}' &
done
```

### **2. OAuth Security**
```bash
# Test OAuth token manipulation
# Intercept Google/Facebook tokens and modify them
# Test token replay attacks
# Test with expired tokens
```

### **3. Database Security**
```bash
# Test for information disclosure
# Time-based attacks to enumerate users
# Test password reset vulnerabilities
```

---

## 🛡️ **Quick Security Fixes to Implement Now**

### **1. Add Rate Limiting** (5 minutes)
```python
# Add to main.py imports:
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

# Add after app creation:
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add to sensitive endpoints:
@limiter.limit("5/minute")  # 5 login attempts per minute
@app.post("/login")
def login(request: Request, user: LoginRequest):
```

### **2. Fix CORS** (2 minutes)
```python
# Replace allow_origins=["*"] with:
allow_origins=[
    "http://localhost:3000",
    "http://localhost:8080",
    "https://bluebank.unifra.org"
],
```

### **3. Add Input Validation** (10 minutes)
```python
# Add validation to all Pydantic models:
from pydantic import validator
import re

class User(BaseModel):
    email: str
    display_name: str
    username: str
    password: str
    
    @validator('display_name', 'username')
    def validate_text_fields(cls, v):
        # Remove HTML tags and limit length
        v = re.sub(r'<[^>]*>', '', v)
        if len(v) > 100:
            raise ValueError('Text too long')
        return v.strip()
```

---

## 🎯 **Testing Tools for Your Friend**

### **Automated Security Testing:**
```bash
# Install OWASP ZAP for automated scanning
# Install Burp Suite Community for manual testing
# Use SQLMap for SQL injection testing
# Use Nikto for web vulnerability scanning
```

### **Manual Testing Checklist:**
- [ ] SQL Injection on all forms
- [ ] XSS on all input fields  
- [ ] CSRF attacks
- [ ] Session fixation
- [ ] Brute force authentication
- [ ] Business logic flaws
- [ ] Information disclosure
- [ ] File upload vulnerabilities (if any)
- [ ] API rate limiting
- [ ] OAuth flow manipulation

---

## 📊 **Security Monitoring**

### **What to Monitor:**
```python
# Add security logging
import logging
security_logger = logging.getLogger("security")

# Log suspicious activities:
security_logger.warning(f"Multiple failed login attempts from {client_ip}")
security_logger.error(f"SQL injection attempt detected: {request_data}")
security_logger.info(f"Large transaction attempted: {amount} by {user_email}")
```

---

## 🎉 **Why This is Great**

Having your friend test your security is **excellent** because:

1. **Free Penetration Testing** - Professional pen tests cost $5k-$50k
2. **Learning Experience** - You'll learn about real vulnerabilities  
3. **Safe Environment** - Better to find issues now than in production
4. **Builds Security Mindset** - Makes you think like an attacker

---

## ⚡ **Immediate Action Items**

1. **Let your friend test the current version first** - Find baseline vulnerabilities
2. **Implement the quick fixes above** - Rate limiting, CORS, input validation
3. **Have them test again** - See the improvement
4. **Document all findings** - Create a security report
5. **Plan additional hardening** - Based on test results

**Remember: Every vulnerability they find is one less for actual attackers to exploit!** 🛡️✨

---

*"The best defense is knowing your weaknesses before your enemies do."* 🎯