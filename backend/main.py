from fastapi import FastAPI, HTTPException, Body, Request
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal, getcontext
from datetime import datetime, timedelta
import os
import secrets
import string
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os
import psycopg2
from contextlib import contextmanager
import logging
import sys

# Configure comprehensive logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log')
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
logger.info("Starting BlueBank Backend...")
logger.info("Loading environment variables...")
load_dotenv(".env")  # Try current directory first
load_dotenv("backend/.env")  # Try backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))  # Try same directory as main.py

# Log all environment variables (excluding sensitive ones)
env_vars = {k: v for k, v in os.environ.items() if 'PASSWORD' not in k.upper() and 'KEY' not in k.upper() and 'SECRET' not in k.upper()}
logger.info(f"Environment variables loaded: {env_vars}")

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
import requests
from jose import jwt

# JWT settings (fallback defaults for dev)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey123")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

def generate_access_token(subject: str) -> str:
    """Generate a signed JWT access token"""
    expires_at = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "exp": expires_at}
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

getcontext().prec = 100

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

logger.info("Adding CORS middleware...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("=== BLUEBANK BACKEND STARTING UP ===")
    logger.info("Checking environment variables...")
    
    # Check critical environment variables
    critical_vars = ["DATABASE_URL", "SENDGRID_API_KEY", "GMAIL_EMAIL", "GMAIL_APP_PASSWORD", "GOOGLE_CLIENT_SECRET"]
    for var in critical_vars:
        value = os.getenv(var)
        if value:
            if 'PASSWORD' in var.upper() or 'KEY' in var.upper():
                logger.info(f"[OK] {var}: SET (hidden)")
            else:
                logger.info(f"[OK] {var}: {value}")
        else:
            logger.warning(f"[WARNING] {var}: NOT SET")
    
    # Log database connection attempt
    logger.info("Attempting to create/verify database tables...")
    try:
        create_db()
        logger.info("[OK] Database initialization successful!")
    except Exception as e:
        logger.error(f"[ERROR] Database initialization failed: {e}")
        logger.error("Backend will start but database operations will fail!")
    
    # Log server configuration
    logger.info(f"Server will run on port 8000")
    logger.info(f"CORS origins: {app.user_middleware[0].kwargs['allow_origins']}")
    
    logger.info("=== BLUEBANK BACKEND STARTUP COMPLETE ===")

# Database connection function
@contextmanager
def get_db_connection():
    """Get database connection (PostgreSQL only)"""
    logger.info("Attempting database connection...")
    
    # Get database URL from environment variable
    database_url = os.getenv("DATABASE_URL")
    logger.info(f"DATABASE_URL from env: {'SET' if database_url else 'NOT SET'}")
    
    if not database_url:
        error_msg = "DATABASE_URL environment variable is not set. Please configure your database connection."
        logger.error(error_msg)
        raise Exception(error_msg)
    
    logger.info(f"Attempting to connect to database with URL: {database_url[:20]}...")
    
    try:
        # Use PostgreSQL with proper SSL and connection settings for AWS RDS
        conn = psycopg2.connect(
            database_url,
            sslmode='require',  # Force SSL for AWS RDS
            connect_timeout=30,  # 30 second timeout
            options='-c statement_timeout=60000'  # 60 second statement timeout
        )
        logger.info("Database connection successful!")
        try:
            yield conn
        finally:
            conn.close()
            logger.info("Database connection closed")
    except psycopg2.OperationalError as e:
        logger.error(f"Database connection failed (OperationalError): {e}")
        raise
    except psycopg2.Error as e:
        logger.error(f"Database connection failed (psycopg2.Error): {e}")
        raise
    except Exception as e:
        logger.error(f"Database connection failed (Unexpected error): {e}")
        raise

def get_placeholder():
    """Get the correct placeholder for PostgreSQL"""
    return "%s"  # PostgreSQL

# Models
class User(BaseModel):
    email: str
    password: str
    display_name: str = ""
    username: str
    dob_month: str = ""
    dob_day: str = ""
    dob_year: str = ""
    phone: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str



class TransactionRequest(BaseModel):
    email: str
    password: str
    amount: Decimal

class BalanceRequest(BaseModel):
    email: str
    password: str

class TransactionsRequest(BaseModel):
    email: str
    password: str

class ProfileRequest(BaseModel):
    email: str
    password: str

class TransferRequest(BaseModel):
    from_email: str
    password: str
    to_email: str
    amount: Decimal

class RecoveryPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    recovery_code: str
    new_password: str

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    code: Optional[str] = None  # JWT token from Google

class GoogleLoginResponse(BaseModel):
    message: str
    user_profile: dict
    access_token: str = None

class FacebookAuthRequest(BaseModel):
    access_token: str  # Access token from Facebook

class FacebookLoginResponse(BaseModel):
    message: str
    user_profile: dict
    access_token: str = None

# DB setup - PostgreSQL only
def create_db():
    """Create database tables for PostgreSQL"""
    logger.info("Creating database tables...")
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            logger.info("Creating users table...")
            
            # Create users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    display_name VARCHAR(255),
                    password VARCHAR(255) NOT NULL,
                    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    dob_month VARCHAR(10),
                    dob_day VARCHAR(10),
                    dob_year VARCHAR(10),
                    phone VARCHAR(20)
                )
            ''')
            logger.info("Users table created/verified successfully")
            
            # Create transactions table
            logger.info("Creating transactions table...")
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS transactions (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    old_balance DECIMAL(10,2) NOT NULL,
                    new_balance DECIMAL(10,2) NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    description TEXT,
                    other_user VARCHAR(255)
                )
            ''')
            logger.info("Transactions table created/verified successfully")
            
            # Create recovery_codes table
            logger.info("Creating recovery_codes table...")
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS recovery_codes (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    recovery_code VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    used BOOLEAN DEFAULT FALSE
                )
            ''')
            logger.info("Recovery_codes table created/verified successfully")
            
            conn.commit()
            logger.info("All database tables created/verified successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise

# Helpers
def hash_password(password: str) -> str:
    logger.info("Hashing password...")
    try:
        # Handle long access tokens by truncating them for bcrypt
        if len(password) > 72:
            logger.info(f"Password too long ({len(password)} chars), truncating to 72 chars for bcrypt")
            password = password[:72]
        
        # Use a more robust hashing approach
        import hashlib
        # First hash with SHA256 to ensure consistent length
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        # Then hash with bcrypt (this will always be 64 chars)
        hashed = pwd_context.hash(password_hash)
        logger.info("Password hashed successfully")
        return hashed
    except Exception as e:
        logger.error(f"Error hashing password: {e}")
        raise

def verify_password(plain_password: str, hashed_password: str) -> bool:
    logger.info("Verifying password...")
    try:
        # Handle long access tokens by truncating them for bcrypt
        if len(plain_password) > 72:
            logger.info(f"Password too long ({len(plain_password)} chars), truncating to 72 chars for bcrypt")
            plain_password = plain_password[:72]
        
        # Use the same hashing approach as hash_password
        import hashlib
        # First hash with SHA256 to ensure consistent length
        password_hash = hashlib.sha256(plain_password.encode()).hexdigest()
        # Then verify with bcrypt
        is_valid = pwd_context.verify(password_hash, hashed_password)
        logger.info(f"Password verification result: {'SUCCESS' if is_valid else 'FAILED'}")
        return is_valid
    except Exception as e:
        logger.error(f"Authentication error for password verification: {e}")
        return False

def authenticate(email: str, password: str):
    logger.info(f"Authenticating user: email={email}")
    # Short-circuit for OAuth sessions. The frontend sends a sentinel value
    # when the user signed in via Google/Facebook and does not have a password.
    if password == "google_oauth_token":
        logger.info("OAuth session detected via sentinel password; accepting authentication")
        return True
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            cursor.execute(f"SELECT password FROM users WHERE email = {placeholder}", (email,))
            row = cursor.fetchone()
        
        if row:
            hashed_password = row[0]
            # Try normal password first
            logger.info(f"User found, verifying password for: email={email}")
            is_valid = verify_password(password, hashed_password)
            # If that fails, allow OAuth users (their DB password is a hash of the sentinel)
            if not is_valid:
                logger.info("Primary password failed; attempting OAuth sentinel fallback")
                # Check for Google OAuth users
                is_valid = verify_password("GOOGLE_OAUTH", hashed_password)
                if is_valid:
                    logger.info("Google OAuth sentinel matched; treating as authenticated OAuth user")
                else:
                    # Check for Facebook OAuth users
                    is_valid = verify_password("FB_OAUTH", hashed_password)
                    if is_valid:
                        logger.info("Facebook OAuth sentinel matched; treating as authenticated OAuth user")
            logger.info(f"Password verification result: {'SUCCESS' if is_valid else 'FAILED'} for email={email}")
            return is_valid
        else:
            logger.warning(f"User not found: email={email}")
            return False
    except Exception as e:
        logger.error(f"Authentication error for email={email}: {e}")
        return False

def get_balance(username: str) -> Decimal:
    logger.info(f"Getting balance for username: {username}")
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            cursor.execute(f"SELECT balance FROM users WHERE username = {placeholder}", (username,))
            balance = cursor.fetchone()
        
        if balance and balance[0] is not None:
            logger.info(f"Balance retrieved successfully: username={username}, balance={balance[0]}")
            return Decimal(balance[0])
        else:
            logger.warning(f"No balance found for username: {username}, returning default")
            return Decimal('0.00')  # Default balance for new users
    except Exception as e:
        logger.error(f"Error getting balance for username={username}: {e}")
        return Decimal('0.00')

def update_balance(username: str, new_balance: Decimal):
    logger.info(f"Updating balance for username: {username}, new_balance: {new_balance}")
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            cursor.execute(f"UPDATE users SET balance = {placeholder} WHERE username = {placeholder}", (str(new_balance), username))
            conn.commit()
        logger.info(f"Balance updated successfully: username={username}, new_balance={new_balance}")
    except Exception as e:
        logger.error(f"Error updating balance for username={username}: {e}")
        raise

def record_transaction(username, type_, amount, old_balance, new_balance, other_user=None):
    logger.info(f"Recording transaction: username={username}, type={type_}, amount={amount}, old_balance={old_balance}, new_balance={new_balance}, other_user={other_user}")
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # Add other_user info to the transaction description
            description = f"to {other_user}" if other_user and type_ == "Transfer Out" else f"from {other_user}" if other_user and type_ == "Transfer In" else ""
            placeholder = get_placeholder()
            cursor.execute(f'''
                INSERT INTO transactions (username, type, amount, old_balance, new_balance, timestamp, description)
                VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})
            ''', (username, type_, str(amount), str(old_balance), str(new_balance), datetime.now().strftime('%Y-%m-%d %H:%M:%S'), description))
            conn.commit()
        logger.info(f"Transaction recorded successfully: username={username}, type={type_}, amount={amount}")
    except Exception as e:
        logger.error(f"Error recording transaction for username={username}: {e}")
        raise

def send_welcome_email(to_email, display_name):
    logger.info(f"Attempting to send welcome email to: {to_email}")
    message = Mail(
        from_email=os.environ.get("BLUEBANK_EMAIL_FROM", "noreply@yourdomain.com"),
        to_emails=to_email,
        subject="Welcome to BlueBank!",
        html_content=f"""
        <p>Hi {display_name},</p>
        <p>We're very happy to see you with us at BlueBank! 🎉</p>
        <p>Best regards,<br/>The BlueBank Team</p>
        """
    )
    try:
        logger.info("Using SendGrid to send email...")
        sg = SendGridAPIClient(os.environ["SENDGRID_API_KEY"])
        response = sg.send(message)
        logger.info(f"SendGrid email sent successfully: status={response.status_code}, to={to_email}")
    except Exception as e:
        logger.error(f"Failed to send welcome email via SendGrid: {e}")
        raise

def get_balance_by_email(email: str) -> Decimal:
    logger.info(f"Getting balance by email: {email}")
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            cursor.execute(f"SELECT balance FROM users WHERE email = {placeholder}", (email,))
            balance = cursor.fetchone()
        
        if balance and balance[0] is not None:
            logger.info(f"Balance retrieved by email successfully: email={email}, balance={balance[0]}")
            return Decimal(balance[0])
        else:
            logger.warning(f"No balance found for email: {email}, returning default")
            return Decimal('0.00')  # Default balance for new users
    except Exception as e:
        logger.error(f"Error getting balance by email={email}: {e}")
        return Decimal('0.00')

def generate_recovery_code() -> str:
    """Generate a random 16-character recovery code"""
    logger.info("Generating random recovery code...")
    characters = string.ascii_uppercase + string.digits
    code = ''.join(secrets.choice(characters) for _ in range(16))
    logger.info(f"Recovery code generated: {code[:8]}...")
    return code

def create_recovery_code(email: str) -> str:
    """Create a new recovery code for the given email"""
    logger.info(f"Creating recovery code for email: {email}")
    recovery_code = generate_recovery_code()
    logger.info(f"Generated recovery code: {recovery_code[:8]}...")
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            # Mark any existing codes as used
            cursor.execute(f"UPDATE recovery_codes SET used = 1 WHERE email = {placeholder}", (email,))
            logger.info("Marked existing recovery codes as used")
            
            # Insert new recovery code
            cursor.execute(
                f"INSERT INTO recovery_codes (email, recovery_code, created_at) VALUES ({placeholder}, {placeholder}, {placeholder})",
                (email, recovery_code, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            )
            conn.commit()
        logger.info(f"Recovery code created and stored successfully for email: {email}")
        return recovery_code
    except Exception as e:
        logger.error(f"Error creating recovery code for email={email}: {e}")
        raise

def validate_recovery_code(email: str, recovery_code: str) -> bool:
    """Validate a recovery code for the given email"""
    logger.info(f"Validating recovery code for email: {email}, code: {recovery_code[:8]}...")
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            cursor.execute(
                f"SELECT id FROM recovery_codes WHERE email = {placeholder} AND recovery_code = {placeholder} AND used = 0",
                (email, recovery_code)
            )
            result = cursor.fetchone()
            is_valid = result is not None
            logger.info(f"Recovery code validation result: {'VALID' if is_valid else 'INVALID'} for email={email}")
            return is_valid
    except Exception as e:
        logger.error(f"Error validating recovery code for email={email}: {e}")
        return False

def mark_recovery_code_used(email: str, recovery_code: str):
    """Mark a recovery code as used"""
    logger.info(f"Marking recovery code as used for email: {email}, code: {recovery_code[:8]}...")
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            cursor.execute(
                f"UPDATE recovery_codes SET used = 1 WHERE email = {placeholder} AND recovery_code = {placeholder}",
                (email, recovery_code)
            )
            conn.commit()
        logger.info(f"Recovery code marked as used successfully for email: {email}")
    except Exception as e:
        logger.error(f"Error marking recovery code as used for email={email}: {e}")
        raise

def exchange_google_code(code: str, redirect_uri: str) -> dict:
    """Exchange Google authorization code for ID token"""
    logger.info("Starting Google authorization code exchange...")
    
    try:
        # Google's token endpoint
        token_url = 'https://oauth2.googleapis.com/token'
        
        # Get environment variables
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        environment = os.getenv("ENVIRONMENT", "development")
        
        if not google_client_secret:
            raise HTTPException(status_code=500, detail="Google client secret not configured")
        
        # redirect_uri is computed by caller from the incoming request (works in Docker/Nginx)
        
        # Exchange authorization code for tokens
        token_data = {
            'client_id': google_client_id,
            'client_secret': google_client_secret,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri
        }
        
        logger.info(f"Exchanging code with redirect_uri: {redirect_uri}")
        response = requests.post(token_url, data=token_data)
        
        if response.status_code != 200:
            logger.error(f"Token exchange failed: {response.status_code} - {response.text}")
            raise HTTPException(status_code=400, detail="Authorization code exchange failed")
        
        tokens = response.json()
        id_token_str = tokens.get('id_token')
        
        if not id_token_str:
            logger.error("No ID token in response")
            raise HTTPException(status_code=400, detail="No ID token received")
        
        logger.info("Authorization code exchange successful")
        return verify_google_token(id_token_str)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during code exchange: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Code exchange error: {str(e)}")

def verify_google_token(token: str) -> dict:
    """Verify Google OAuth token and return user info"""
    logger.info("Verifying Google OAuth token...")
    try:
        # Get Google Client ID from environment
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        if not google_client_id:
            logger.error("GOOGLE_CLIENT_ID not configured")
            raise HTTPException(status_code=500, detail="Google OAuth not configured")
        
        # Verify the token with clock skew tolerance
        id_info = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            google_client_id,
            clock_skew_in_seconds=10  # Allow 10 seconds of clock skew
        )
        
        # Check if token is valid
        if id_info['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            logger.error("Invalid token issuer")
            raise ValueError('Wrong issuer.')
        
        logger.info(f"Google token verified successfully for email: {id_info.get('email')}")
        return id_info
        
    except ValueError as e:
        logger.error(f"Google token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google token")
    except Exception as e:
        logger.error(f"Google token verification error: {e}")
        raise HTTPException(status_code=500, detail="Token verification failed")

def create_or_get_google_user(google_info: dict) -> dict:
    """Create or get user from Google OAuth info with account linking"""
    email = google_info.get('email')
    name = google_info.get('name', '')
    given_name = google_info.get('given_name', '')
    google_id = google_info.get('sub', '')  # Google's unique user ID
    
    logger.info(f"Creating or getting Google user: email={email}")
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            
            # Check if user already exists by email (regardless of auth provider)
            cursor.execute(f"SELECT username, email, display_name FROM users WHERE email = {placeholder}", (email,))
            existing_user = cursor.fetchone()
            
            if existing_user:
                logger.info(f"🔗 ACCOUNT LINKING: Found existing account with email {email}")
                
                # TODO: In future, update the user record to add Google as an auth method
                # This would allow users to sign in with both email/password AND Google
                logger.info(f"User can now sign in with Google OR their original method")
                
                return {
                    "username": existing_user[0],
                    "email": existing_user[1],
                    "display_name": existing_user[2],
                    "is_new": False,
                    "linked_account": True  # Indicate this was an account link
                }
            else:
                # Create new user with Google info
                # Generate username from display name (or given_name, or email fallback)
                display_name = name or given_name or email.split('@')[0]
                
                # Clean the display name to make it username-friendly
                import re
                username_base = re.sub(r'[^a-zA-Z0-9_]', '', display_name.replace(' ', '_')).lower()
                
                # If username is empty after cleaning, use email prefix
                if not username_base:
                    username_base = email.split('@')[0]
                
                # Make sure username is unique by adding numbers if needed
                username = username_base
                counter = 1
                while True:
                    cursor.execute(f"SELECT id FROM users WHERE username = {placeholder}", (username,))
                    if not cursor.fetchone():
                        break
                    username = f"{username_base}_{counter:04d}"  # e.g., john_doe_0001
                    counter += 1
                
                # Create user with empty password (Google OAuth user)
                # Use a shorter password to avoid bcrypt length issues
                empty_password_hash = hash_password("GOOGLE_OAUTH")
                
                cursor.execute(
                    f"INSERT INTO users (username, email, display_name, password, dob_month, dob_day, dob_year, phone) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})",
                    (username, email, name or given_name, empty_password_hash, "", "", "", "")
                )
                conn.commit()
                
                logger.info(f"New Google user created: email={email}, username={username}")
                
                # Send welcome email
                try:
                    send_welcome_email(email, name or given_name or username)
                    logger.info("Welcome email sent to new Google user")
                except Exception as e:
                    logger.warning(f"Failed to send welcome email to Google user: {e}")
                
                return {
                    "username": username,
                    "email": email,
                    "display_name": name or given_name,
                    "is_new": True
                }
                
    except Exception as e:
        logger.error(f"Error creating/getting Google user: {e}")
        raise HTTPException(status_code=500, detail="Failed to process Google user")

def verify_facebook_token(access_token: str) -> dict:
    """Verify Facebook access token and get user info"""
    logger.info("Verifying Facebook access token...")
    
    try:
        # Facebook Graph API endpoint to get user info
        graph_api_url = f"https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture&access_token={access_token}"
        
        response = requests.get(graph_api_url)
        response.raise_for_status()
        
        user_data = response.json()
        logger.info(f"Facebook user data retrieved: {user_data.get('email', 'no_email')}")
        
        # Verify the token is for our app by checking app ID
        app_check_url = f"https://graph.facebook.com/app?access_token={access_token}"
        app_response = requests.get(app_check_url)
        app_response.raise_for_status()
        
        app_data = app_response.json()
        expected_app_id = os.getenv("FACEBOOK_APP_ID")
        
        if app_data.get("id") != expected_app_id:
            raise ValueError("Access token is not for the correct Facebook app")
        
        return user_data
        
    except requests.RequestException as e:
        logger.error(f"Facebook API request failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid Facebook access token")
    except Exception as e:
        logger.error(f"Facebook token verification error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid token: {str(e)}")

def create_or_get_facebook_user(facebook_info: dict) -> dict:
    """Create or retrieve user from Facebook info with account linking"""
    logger.info("Creating or retrieving Facebook user...")
    
    try:
        email = facebook_info.get('email')
        name = facebook_info.get('name')
        first_name = facebook_info.get('first_name')
        last_name = facebook_info.get('last_name')
        facebook_id = facebook_info.get('id')
        
        if not email:
            raise HTTPException(status_code=400, detail="Email permission required for Facebook login")
        
        logger.info(f"Processing Facebook user: email={email}, name={name}")
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            
            # Check if user already exists by email (regardless of auth provider)
            cursor.execute(f"SELECT username, email, display_name FROM users WHERE email = {placeholder}", (email,))
            existing_user = cursor.fetchone()
            
            if existing_user:
                logger.info(f"🔗 ACCOUNT LINKING: Found existing account with email {email}")
                
                # TODO: In future, update the user record to add Facebook as an auth method
                # This would allow users to sign in with email/password AND Facebook
                logger.info(f"User can now sign in with Facebook OR their original method")
                
                return {
                    "username": existing_user[0],
                    "email": existing_user[1],
                    "display_name": existing_user[2],
                    "is_new": False,
                    "linked_account": True  # Indicate this was an account link
                }
            else:
                # Create new user with Facebook info
                # Generate username from name (or first_name, or email fallback)
                display_name = name or f"{first_name} {last_name}".strip() or email.split('@')[0]
                
                # Clean the display name to make it username-friendly
                import re
                username_base = re.sub(r'[^a-zA-Z0-9_]', '', display_name.replace(' ', '_')).lower()
                
                # If username is empty after cleaning, use email prefix
                if not username_base:
                    username_base = email.split('@')[0]
                
                # Make sure username is unique by adding numbers if needed
                username = username_base
                counter = 1
                while True:
                    cursor.execute(f"SELECT id FROM users WHERE username = {placeholder}", (username,))
                    if not cursor.fetchone():
                        break
                    username = f"{username_base}_{counter:04d}"  # e.g., john_doe_0001
                    counter += 1
                
                # Create user with empty password (Facebook OAuth user)
                # Use a shorter password to avoid bcrypt length issues
                empty_password_hash = hash_password("FB_OAUTH")
                
                cursor.execute(
                    f"INSERT INTO users (username, email, display_name, password, dob_month, dob_day, dob_year, phone) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})",
                    (username, email, display_name, empty_password_hash, "", "", "", "")
                )
                conn.commit()
                
                logger.info(f"New Facebook user created: email={email}, username={username}")
                
                # Send welcome email
                try:
                    send_welcome_email(email, display_name or username)
                    logger.info("Welcome email sent to new Facebook user")
                except Exception as e:
                    logger.warning(f"Failed to send welcome email to Facebook user: {e}")
                
                return {
                    "username": username,
                    "email": email,
                    "display_name": display_name,
                    "is_new": True
                }
                
    except Exception as e:
        logger.error(f"Error creating/getting Facebook user: {e}")
        raise HTTPException(status_code=500, detail="Failed to process Facebook user")

# Routes
@app.post("/register")
def register(user: User):
    logger.info(f"Register attempt: email={user.email}, username={user.username}")
    try:
        logger.info("Hashing password...")
        hashed_pw = hash_password(user.password)
        logger.info("Password hashed successfully")
        
        logger.info("Attempting to insert user into database...")
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            cursor.execute(f"INSERT INTO users (username, email, display_name, password, dob_month, dob_day, dob_year, phone) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})", (user.username, user.email, user.display_name, hashed_pw, user.dob_month, user.dob_day, user.dob_year, user.phone))
            conn.commit()
        logger.info(f"User inserted into database successfully: email={user.email}")
        
        try:
            logger.info("Attempting to send welcome email...")
            send_welcome_email(user.email, user.display_name or user.username)
            logger.info("Welcome email sent successfully")
        except Exception as e:
            logger.warning(f"Failed to send welcome email: {e}")
        
        logger.info(f"Registration successful: email={user.email}")
        return {"message": "User registered successfully"}
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
            logger.warning(f"Duplicate email attempt: {user.email}")
            raise HTTPException(status_code=400, detail="Email already exists")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/login")
def login(user: LoginRequest):
    logger.info(f"Login attempt: email={user.email}")
    try:
        if authenticate(user.email, user.password):
            logger.info(f"Login successful: email={user.email}")
            return {"message": "Login successful"}
        else:
            logger.warning(f"Login failed - invalid credentials: email={user.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise

@app.post("/api/auth/google")
def google_auth(request: Request, payload: GoogleAuthRequest):
    """Authenticate user with Google OAuth"""
    logger.info("Google OAuth authentication request received")
    logger.info(f"Received credential length: {len(payload.credential) if payload.credential else 'None'}")
    logger.info(f"Received code length: {len(payload.code) if payload.code else 'None'}")
    
    # Debug environment variables
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    logger.info(f"Environment check - GOOGLE_CLIENT_ID: {'SET (' + str(len(google_client_id)) + ' chars)' if google_client_id else 'NOT SET'}")
    
    try:
        # Handle either authorization code or ID token
        if payload.code:
            logger.info("Step 1: Exchanging Google authorization code...")
            # Build redirect_uri from incoming request headers (honor reverse proxy)
            forwarded_proto = request.headers.get("x-forwarded-proto")
            forwarded_host = request.headers.get("x-forwarded-host")
            host = forwarded_host or request.headers.get("host") or "localhost:8080"
            scheme = forwarded_proto or request.url.scheme or "http"
            if host == "localhost":
                host = "localhost:8080"
            
            # Use environment variable as fallback for production
            env_redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
            if env_redirect_uri and not host.startswith("localhost"):
                redirect_uri = env_redirect_uri
                logger.info(f"Using environment GOOGLE_REDIRECT_URI: {redirect_uri}")
            else:
                redirect_uri = f"{scheme}://{host}/oauth-callback"
                logger.info(f"Built redirect_uri from headers: {redirect_uri}")
            google_info = exchange_google_code(payload.code, redirect_uri)
            logger.info(f"Step 1 SUCCESS: Google code exchanged for email: {google_info.get('email')}")
        elif payload.credential:
            logger.info("Step 1: Verifying Google token...")
            google_info = verify_google_token(payload.credential)
            logger.info(f"Step 1 SUCCESS: Google token verified for email: {google_info.get('email')}")
        else:
            logger.error("No credential or code provided")
            raise HTTPException(status_code=400, detail="No Google credential or authorization code provided")
        
        # Create or get user
        logger.info("Step 2: Creating or getting Google user...")
        user_info = create_or_get_google_user(google_info)
        logger.info(f"Step 2 SUCCESS: Google user processed: email={user_info['email']}, is_new={user_info['is_new']}")
        
        # Return success response
        logger.info("Step 3: Preparing response...")
        message = "Welcome to BlueBank!" if user_info['is_new'] else "Welcome back!"
        # Issue a JWT access token for the session
        access_token = generate_access_token(user_info['email'])
        
        response = GoogleLoginResponse(
            message=message,
            user_profile={
                "email": user_info['email'],
                "username": user_info['username'],
                "display_name": user_info['display_name'],
                "is_new": user_info['is_new'],
                "linked_account": user_info.get('linked_account', False)
            },
            access_token=access_token
        )
        payload = response.model_dump()
        logger.info(f"Step 3 SUCCESS: Response prepared with access_token length: {len(access_token)}; sending to frontend")
        return payload
        
    except HTTPException as he:
        # Re-raise HTTP exceptions with more details
        logger.error(f"HTTP Exception in Google OAuth: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"Google OAuth authentication error: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@app.get("/api/auth/google/config")
def google_config(request: Request):
    """Get Google OAuth configuration for frontend"""
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET") 
    google_redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    environment = os.getenv("ENVIRONMENT", "development")
    
    logger.info(f"Google OAuth config request (environment: {environment})")
    
    if not google_client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    # Prefer dynamic redirect based on incoming request host (works behind Nginx and in Docker)
    try:
        forwarded_proto = request.headers.get("x-forwarded-proto")
        forwarded_host = request.headers.get("x-forwarded-host")
        host = forwarded_host or request.headers.get("host") or "localhost:8080"
        scheme = forwarded_proto or request.url.scheme or "http"
        # If Host header is just 'localhost', add :8080 when behind our container
        if host == "localhost":
            host = "localhost:8080"
        dynamic_redirect = f"{scheme}://{host}/oauth-callback"
    except Exception:
        dynamic_redirect = "http://localhost:8080/oauth-callback"

    # Fallbacks: explicit env for production, dynamic for dev/container
    if environment != "development" and google_redirect_uri:
        redirect_uri = google_redirect_uri
    else:
        redirect_uri = dynamic_redirect
    
    return {
        "client_id": google_client_id,
        "redirect_uri": redirect_uri
    }

@app.post("/api/auth/facebook")
def facebook_auth(request: FacebookAuthRequest):
    """Authenticate user with Facebook OAuth"""
    logger.info("Facebook OAuth authentication request received")
    logger.info(f"Received access token length: {len(request.access_token) if request.access_token else 'None'}")
    
    facebook_app_id = os.getenv("FACEBOOK_APP_ID")
    logger.info(f"Facebook App ID: {'configured' if facebook_app_id else 'not configured'}")
    
    try:
        # Verify the Facebook token
        logger.info("Step 1: Verifying Facebook token...")
        facebook_info = verify_facebook_token(request.access_token)
        logger.info(f"Step 1 SUCCESS: Facebook token verified for email: {facebook_info.get('email')}")
        
        # Create or get user
        logger.info("Step 2: Creating or getting Facebook user...")
        user_info = create_or_get_facebook_user(facebook_info)
        logger.info(f"Step 2 SUCCESS: Facebook user processed: email={user_info['email']}, is_new={user_info['is_new']}")
        
        # Return success response
        logger.info("Step 3: Preparing response...")
        message = "Welcome to BlueBank!" if user_info['is_new'] else "Welcome back!"
        # Issue a JWT access token for the session
        access_token = generate_access_token(user_info['email'])
        
        response = FacebookLoginResponse(
            message=message,
            user_profile={
                "email": user_info['email'],
                "username": user_info['username'],
                "display_name": user_info['display_name'],
                "is_new": user_info['is_new'],
                "linked_account": user_info.get('linked_account', False)
            },
            access_token=access_token
        )
        payload = response.model_dump()
        logger.info(f"Step 3 SUCCESS: Response prepared with access_token length: {len(access_token)}; sending to frontend")
        return payload
        
    except HTTPException as he:
        # Re-raise HTTP exceptions with more details
        logger.error(f"HTTP Exception in Facebook OAuth: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"Facebook OAuth authentication error: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@app.get("/api/auth/facebook/config")
def facebook_config(request: Request):
    """Get Facebook OAuth configuration for frontend"""
    facebook_app_id = os.getenv("FACEBOOK_APP_ID")
    facebook_redirect_uri = os.getenv("FACEBOOK_REDIRECT_URI")
    environment = os.getenv("ENVIRONMENT", "development")
    
    # Debug logging
    logger.info(f"Facebook OAuth config check (environment: {environment}):")
    logger.info(f"FACEBOOK_APP_ID: {'SET' if facebook_app_id else 'NOT SET'}")
    logger.info(f"FACEBOOK_REDIRECT_URI: {facebook_redirect_uri}")
    
    if not facebook_app_id:
        raise HTTPException(status_code=500, detail="Facebook OAuth not configured")
    
    # Prefer dynamic redirect based on incoming request (works behind Nginx and in Docker)
    try:
        forwarded_proto = request.headers.get("x-forwarded-proto")
        forwarded_host = request.headers.get("x-forwarded-host")
        host = forwarded_host or request.headers.get("host") or "localhost:8080"
        scheme = forwarded_proto or request.url.scheme or "http"
        if host == "localhost":
            host = "localhost:8080"
        dynamic_redirect = f"{scheme}://{host}/oauth-callback"
    except Exception:
        dynamic_redirect = "http://localhost:8080/oauth-callback"

    if environment != "development" and facebook_redirect_uri:
        redirect_uri = facebook_redirect_uri
    else:
        redirect_uri = dynamic_redirect
    
    return {
        "app_id": facebook_app_id,
        "redirect_uri": redirect_uri
    }

@app.post("/api/setup-password")
def setup_password(request: dict):
    """Set up password for OAuth users"""
    email = request.get("email")
    new_password = request.get("new_password")
    
    if not email or not new_password:
        raise HTTPException(status_code=400, detail="Email and new password are required")
    
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            
            # Check if user exists
            cursor.execute(f"SELECT id, auth_provider FROM users WHERE email = {placeholder}", (email,))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Update user's password and auth provider
            hashed_password = hash_password(new_password)
            cursor.execute(
                f"UPDATE users SET hashed_password = {placeholder}, auth_provider = 'email' WHERE email = {placeholder}",
                (hashed_password, email)
            )
            conn.commit()
            
            logger.info(f"Password set up successfully for OAuth user: {email}")
            return {"message": "Password set up successfully"}
            
    except Exception as e:
        logger.error(f"Setup password error: {e}")
        raise HTTPException(status_code=500, detail="Failed to set up password")

@app.post("/api/change-password")
def change_password(request: dict):
    """Change password for email users"""
    email = request.get("email")
    current_password = request.get("password")  
    new_password = request.get("new_password")
    
    if not email or not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Email, current password, and new password are required")
    
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long")
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            
            # Check if user exists and verify current password
            cursor.execute(f"SELECT id, hashed_password FROM users WHERE email = {placeholder}", (email,))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Verify current password
            if not verify_password(current_password, user[1]):
                raise HTTPException(status_code=400, detail="Current password is incorrect")
            
            # Update password
            hashed_password = hash_password(new_password)
            cursor.execute(
                f"UPDATE users SET hashed_password = {placeholder} WHERE email = {placeholder}",
                (hashed_password, email)
            )
            conn.commit()
            
            logger.info(f"Password changed successfully for user: {email}")
            return {"message": "Password changed successfully"}
            
    except Exception as e:
        logger.error(f"Change password error: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")

@app.post("/deposit")
def deposit(data: TransactionRequest):
    logger.info(f"Deposit request: email={data.email}, amount={data.amount}")
    
    if not authenticate(data.email, data.password):
        logger.warning(f"Deposit failed - invalid credentials: email={data.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if data.amount <= 0:
        logger.warning(f"Deposit failed - invalid amount: email={data.email}, amount={data.amount}")
        raise HTTPException(status_code=400, detail="Amount must be positive")

    try:
        # Get username from email for balance operations
        logger.info(f"Getting username for email: {data.email}")
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            cursor.execute(f"SELECT username FROM users WHERE email = {placeholder}", (data.email,))
            row = cursor.fetchone()
            if not row:
                logger.warning(f"User not found for deposit: email={data.email}")
                raise HTTPException(status_code=404, detail="User not found")
            username = row[0]
            logger.info(f"Username found: {username}")

        old_balance = get_balance(username)
        new_balance = old_balance + data.amount
        logger.info(f"Balance calculation: old={old_balance}, amount={data.amount}, new={new_balance}")
        
        update_balance(username, new_balance)
        record_transaction(username, "Deposit", data.amount, old_balance, new_balance)

        logger.info(f"Deposit successful: email={data.email}, amount={data.amount}, new_balance={new_balance}")
        return {"message": "Deposit successful", "new_balance": str(new_balance)}
    except Exception as e:
        logger.error(f"Deposit error: email={data.email}, error={e}")
        raise

@app.post("/withdraw")
def withdraw(data: TransactionRequest):
    logger.info(f"Withdraw request: email={data.email}, amount={data.amount}")
    
    if not authenticate(data.email, data.password):
        logger.warning(f"Withdraw failed - invalid credentials: email={data.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if data.amount <= 0:
        logger.warning(f"Withdraw failed - invalid amount: email={data.email}, amount={data.amount}")
        raise HTTPException(status_code=400, detail="Amount must be positive")

    try:
        # Get username from email for balance operations
        logger.info(f"Getting username for email: {data.email}")
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            cursor.execute(f"SELECT username FROM users WHERE email = {placeholder}", (data.email,))
            row = cursor.fetchone()
            if not row:
                logger.warning(f"User not found for withdraw: email={data.email}")
                raise HTTPException(status_code=404, detail="User not found")
            username = row[0]
            logger.info(f"Username found: {username}")

        old_balance = get_balance(username)
        logger.info(f"Current balance: {old_balance}, withdrawal amount: {data.amount}")
        
        if old_balance < data.amount:
            logger.warning(f"Insufficient funds: email={data.email}, balance={old_balance}, amount={data.amount}")
            raise HTTPException(status_code=400, detail="Insufficient funds")

        new_balance = old_balance - data.amount
        logger.info(f"Balance calculation: old={old_balance}, amount={data.amount}, new={new_balance}")
        
        update_balance(username, new_balance)
        record_transaction(username, "Withdraw", data.amount, old_balance, new_balance)

        logger.info(f"Withdrawal successful: email={data.email}, amount={data.amount}, new_balance={new_balance}")
        return {"message": "Withdrawal successful", "new_balance": str(new_balance)}
    except Exception as e:
        logger.error(f"Withdrawal error: email={data.email}, error={e}")
        raise

@app.post("/transfer")
def transfer(data: TransferRequest):
    logger.info(f"Transfer request: from={data.from_email}, to={data.to_email}, amount={data.amount}")
    
    if not authenticate(data.from_email, data.password):
        logger.warning(f"Transfer failed - invalid credentials: from_email={data.from_email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if data.amount <= 0:
        logger.warning(f"Transfer failed - invalid amount: amount={data.amount}")
        raise HTTPException(status_code=400, detail="Amount must be positive")

    if data.from_email == data.to_email:
        logger.warning(f"Transfer failed - cannot transfer to self: email={data.from_email}")
        raise HTTPException(status_code=400, detail="Cannot transfer to yourself")

    try:
        # Check if recipient exists
        logger.info(f"Checking if recipient exists: {data.to_email}")
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            cursor.execute(f"SELECT username FROM users WHERE email = {placeholder}", (data.to_email,))
            recipient_row = cursor.fetchone()
            if not recipient_row:
                logger.warning(f"Recipient not found: {data.to_email}")
                raise HTTPException(status_code=404, detail="Recipient not found")
            recipient_username = recipient_row[0]
            logger.info(f"Recipient found: {recipient_username}")

            # Get sender username
            logger.info(f"Getting sender username: {data.from_email}")
            cursor.execute(f"SELECT username FROM users WHERE email = {placeholder}", (data.from_email,))
            sender_row = cursor.fetchone()
            if not sender_row:
                logger.warning(f"Sender not found: {data.from_email}")
                raise HTTPException(status_code=404, detail="Sender not found")
            sender_username = sender_row[0]
            logger.info(f"Sender found: {sender_username}")

        # Check sender has sufficient funds
        logger.info(f"Checking sender balance: {sender_username}")
        sender_old_balance = get_balance(sender_username)
        logger.info(f"Sender current balance: {sender_old_balance}")
        
        if sender_old_balance < data.amount:
            logger.warning(f"Insufficient funds for transfer: sender={sender_username}, balance={sender_old_balance}, amount={data.amount}")
            raise HTTPException(status_code=400, detail="Insufficient funds")

        # Get recipient's current balance
        logger.info(f"Getting recipient balance: {recipient_username}")
        recipient_old_balance = get_balance(recipient_username)
        logger.info(f"Recipient current balance: {recipient_old_balance}")

        # Perform the transfer
        sender_new_balance = sender_old_balance - data.amount
        recipient_new_balance = recipient_old_balance + data.amount
        logger.info(f"Transfer calculation: sender {sender_old_balance} -> {sender_new_balance}, recipient {recipient_old_balance} -> {recipient_new_balance}")

        # Update both balances
        update_balance(sender_username, sender_new_balance)
        update_balance(recipient_username, recipient_new_balance)

        # Record transactions for both users
        record_transaction(sender_username, "Transfer Out", data.amount, sender_old_balance, sender_new_balance, other_user=recipient_username)
        record_transaction(recipient_username, "Transfer In", data.amount, recipient_old_balance, recipient_new_balance, other_user=sender_username)

        logger.info(f"Transfer successful: {sender_username} -> {recipient_username}, amount={data.amount}")
        return {
            "message": f"Transfer successful to {data.to_email}", 
            "new_balance": str(sender_new_balance),
            "recipient_email": data.to_email,
            "amount": str(data.amount)
        }
    except Exception as e:
        logger.error(f"Transfer error: from={data.from_email}, to={data.to_email}, error={e}")
        raise

@app.get("/balance/{username}")
def balance(username: str, password: str):
    logger.info(f"Balance request for username: {username}")
    
    if not authenticate(username, password):
        logger.warning(f"Balance request failed - invalid credentials: username={username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    try:
        current = get_balance(username)
        logger.info(f"Balance retrieved successfully: username={username}, balance={current}")
        return {"balance": str(current)}
    except Exception as e:
        logger.error(f"Balance request error: username={username}, error={e}")
        raise

@app.get("/transactions/{username}")
def transactions(username: str, password: str):
    logger.info(f"Transactions request for username: {username}")
    
    if not authenticate(username, password):
        logger.warning(f"Transactions request failed - invalid credentials: username={username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT type, amount, old_balance, new_balance, timestamp, description, other_user FROM transactions WHERE username = %s ORDER BY id DESC", (username,))
            rows = cursor.fetchall()
        
        logger.info(f"Transactions retrieved successfully: username={username}, count={len(rows)}")
        return [
            {
                "type": r[0],
                "amount": r[1],
                "old_balance": r[2],
                "new_balance": r[3],
                "timestamp": r[4],
                "description": r[5],
                "other_user": r[6]
            } for r in rows
        ]
    except Exception as e:
        logger.error(f"Transactions request error: username={username}, error={e}")
        raise

@app.post("/balance")
def balance_post(data: BalanceRequest):
    logger.info(f"Balance POST request for email: {data.email}")
    
    if not authenticate(data.email, data.password):
        logger.warning(f"Balance POST request failed - invalid credentials: email={data.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    try:
        current = get_balance_by_email(data.email)
        logger.info(f"Balance POST request successful: email={data.email}, balance={current}")
        return {"balance": str(current)}
    except Exception as e:
        logger.error(f"Balance POST request error: email={data.email}, error={e}")
        raise

@app.post("/transactions")
def transactions_post(data: TransactionsRequest):
    logger.info(f"Transactions POST request for email: {data.email}")
    
    if not authenticate(data.email, data.password):
        logger.warning(f"Transactions POST request failed - invalid credentials: email={data.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    try:
        # Get username from email for transaction lookup
        logger.info(f"Getting username for email: {data.email}")
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            cursor.execute(f"SELECT username FROM users WHERE email = {placeholder}", (data.email,))
            row = cursor.fetchone()
            if not row:
                logger.warning(f"User not found for transactions: email={data.email}")
                raise HTTPException(status_code=404, detail="User not found")
            username = row[0]
            logger.info(f"Username found: {username}")
            
            cursor.execute("SELECT type, amount, old_balance, new_balance, timestamp, description FROM transactions WHERE username = %s ORDER BY id DESC", (username,))
            rows = cursor.fetchall()

        logger.info(f"Transactions POST request successful: email={data.email}, username={username}, count={len(rows)}")
        return [
            {
                "type": r[0],
                "amount": r[1],
                "old_balance": r[2],
                "new_balance": r[3],
                "timestamp": r[4],
                "description": r[5]
            } for r in rows
        ]
    except Exception as e:
        logger.error(f"Transactions POST request error: email={data.email}, error={e}")
        raise

@app.post("/profile")
def get_profile(data: ProfileRequest):
    logger.info(f"Profile request for email: {data.email}")
    
    if not authenticate(data.email, data.password):
        logger.warning(f"Profile request failed - invalid credentials: email={data.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            cursor.execute(f"SELECT username, email, display_name FROM users WHERE email = {placeholder}", (data.email,))
            row = cursor.fetchone()
        
        if row:
            logger.info(f"Profile retrieved successfully: email={data.email}, username={row[0]}")
            return {"username": row[0], "email": row[1], "display_name": row[2]}
        else:
            logger.warning(f"User not found for profile: email={data.email}")
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        logger.error(f"Profile request error: email={data.email}, error={e}")
        raise

@app.post("/forgot-password")
def forgot_password(data: RecoveryPasswordRequest):
    """Forgot password endpoint - generates recovery code"""
    logger.info(f"Forgot password request for email: {data.email}")
    try:
        result = generate_recovery_code_endpoint(data)
        logger.info(f"Forgot password request successful: email={data.email}")
        return result
    except Exception as e:
        logger.error(f"Forgot password request error: email={data.email}, error={e}")
        raise

@app.post("/generate-recovery-code")
def generate_recovery_code_endpoint(data: RecoveryPasswordRequest):
    """Generate a new recovery code for password reset"""
    # Check if user exists
    with get_db_connection() as conn:
        cursor = conn.cursor()
        placeholder = get_placeholder()
        cursor.execute(f"SELECT id FROM users WHERE email = {placeholder}", (data.email,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
    
    recovery_code = create_recovery_code(data.email)
    
    # Try to send recovery code via email using Gmail SMTP
    try:
        # Gmail SMTP settings
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        # Get Gmail credentials from environment variables
        sender_email = os.environ.get("GMAIL_EMAIL", "the.blue.bank.team@gmail.com")
        sender_password = os.environ.get("GMAIL_APP_PASSWORD", "srzo gnvf zhmu sdte")
        
        if sender_email == "your-email@gmail.com":
            logger.info("Gmail credentials not configured, returning recovery code directly")
            return {"message": "Recovery code generated (Gmail not configured)", "recovery_code": recovery_code}
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = data.email
        msg['Subject'] = "BlueBank - Password Recovery Code"
        
        # Email body
        body = f"""
        <html>
        <body>
            <p>Hello,</p>
            <p>You requested a password recovery code for your BlueBank account.</p>
            <p><strong>Your recovery code is: {recovery_code}</strong></p>
            <p>This code can only be used once and will expire after use.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <p>Best regards,<br/>The BlueBank Team</p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, data.email, text)
        server.quit()
        
        logger.info(f"Recovery code email sent successfully to: {data.email}")
        return {"message": "Recovery code sent to your email", "recovery_code": recovery_code}
        
    except Exception as e:
        logger.error(f"Failed to send recovery code email: {str(e)}")
        return {"message": "Recovery code generated (email failed)", "recovery_code": recovery_code}

@app.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    """Reset password using recovery code"""
    logger.info(f"Reset password request for email: {data.email}")
    
    try:
        # Check if user exists
        logger.info(f"Checking if user exists: {data.email}")
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            cursor.execute(f"SELECT id FROM users WHERE email = {placeholder}", (data.email,))
            if not cursor.fetchone():
                logger.warning(f"User not found for password reset: email={data.email}")
                raise HTTPException(status_code=404, detail="User not found")
        
        # Validate recovery code
        logger.info(f"Validating recovery code for email: {data.email}")
        if not validate_recovery_code(data.email, data.recovery_code):
            logger.warning(f"Invalid recovery code for password reset: email={data.email}")
            raise HTTPException(status_code=400, detail="Invalid or expired recovery code")
        
        # Hash new password and update
        logger.info(f"Hashing new password for email: {data.email}")
        hashed_password = hash_password(data.new_password)
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"UPDATE users SET password = {placeholder} WHERE email = {placeholder}", (hashed_password, data.email))
            conn.commit()
        
        # Mark recovery code as used
        logger.info(f"Marking recovery code as used for email: {data.email}")
        mark_recovery_code_used(data.email, data.recovery_code)
        
        logger.info(f"Password reset successful for email: {data.email}")
        return {"message": "Password reset successfully"}
    
    except Exception as e:
        logger.error(f"Password reset error: email={data.email}, error={e}")
        raise

@app.get("/user-count")
def user_count():
    logger.info("User count requested")
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM users")
            count = cursor.fetchone()[0]
        logger.info(f"User count retrieved successfully: {count} users")
        return {"count": count}
    except Exception as e:
        logger.error(f"Error getting user count: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user count")

@app.get("/")
def health_check():
    """Health check endpoint for Docker"""
    logger.info("Health check requested")
    
    # Check database connectivity
    db_status = "unknown"
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            db_status = "connected"
            logger.info("Health check: Database connection successful")
    except Exception as e:
        db_status = "disconnected"
        logger.error(f"Health check: Database connection failed: {e}")
    
    return {
        "status": "healthy", 
        "message": "BlueBank API is running",
        "database": db_status,
        "timestamp": datetime.now().isoformat()
    }



if __name__ == "__main__":
    import uvicorn
    logger.info("Starting BlueBank Backend Server...")
    logger.info("Server will be available at: http://localhost:8000")
    logger.info("Health check available at: http://localhost:8000/")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")