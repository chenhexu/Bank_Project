from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from decimal import Decimal, getcontext
from datetime import datetime
import sqlite3
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
import requests
import json
import psycopg2
from contextlib import contextmanager
# Load environment variables
load_dotenv(".env")
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

getcontext().prec = 100

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_NAME = os.path.join(os.path.dirname(__file__), "bank_users.db")

# Database connection function
@contextmanager
def get_db_connection():
    """Get database connection (PostgreSQL if available, otherwise SQLite)"""
    database_url = os.getenv("DATABASE_URL")
    
    if database_url and database_url.startswith("postgresql://"):
        # Use PostgreSQL
        conn = psycopg2.connect(database_url)
        try:
            yield conn
        finally:
            conn.close()
    else:
        # Use SQLite (fallback)
        conn = sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False)
        try:
            yield conn
        finally:
            conn.close()

def get_placeholder():
    """Get the correct placeholder for the current database"""
    database_url = os.getenv("DATABASE_URL")
    if database_url and database_url.startswith("postgresql://"):
        return "%s"  # PostgreSQL
    else:
        return "?"    # SQLite

# Models
class User(BaseModel):
    email: str
    password: str
    display_name: str = ""
    username: str

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    access_token: str

class FacebookAuthRequest(BaseModel):
    access_token: str

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

# DB setup
def create_db():
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                display_name TEXT,
                password TEXT NOT NULL,
                balance TEXT NOT NULL DEFAULT '0.00',
                google_id TEXT,
                auth_provider TEXT DEFAULT 'email'
            )
        ''')
        
        # Add google_id column if it doesn't exist (for existing databases)
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN google_id TEXT")
        except sqlite3.OperationalError:
            # Column already exists
            pass
            
        # Add auth_provider column if it doesn't exist (for existing databases)
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'email'")
        except sqlite3.OperationalError:
            # Column already exists
            pass
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS recovery_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                recovery_code TEXT NOT NULL,
                used INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                type TEXT NOT NULL,
                amount TEXT NOT NULL,
                old_balance TEXT NOT NULL,
                new_balance TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                description TEXT DEFAULT ''
            )
        ''')
        conn.commit()

create_db()

# Helpers
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def authenticate(email: str, password: str):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        placeholder = get_placeholder()
        cursor.execute(f"SELECT password, auth_provider FROM users WHERE email = {placeholder}", (email,))
        row = cursor.fetchone()
    if row:
        hashed_password, auth_provider = row
        # For Google users, accept the special password
        if auth_provider == 'google' and password == 'google_auth':
            return True
        # For Facebook users, accept the special password
        elif auth_provider == 'facebook' and password == 'facebook_auth':
            return True
        # For regular users, verify password
        elif auth_provider == 'email' or auth_provider is None:
            return verify_password(password, hashed_password)
    return False

def verify_google_token(id_token: str):
    """Verify Google ID token and get user info"""
    try:
        import jwt
        import requests
        import json
        
        print(f"[DEBUG] Attempting to verify Google ID token...")
        print(f"[DEBUG] Token length: {len(id_token)}")
        print(f"[DEBUG] Token starts with: {id_token[:50]}...")
        
        # Get Google's public keys
        response = requests.get('https://www.googleapis.com/oauth2/v1/certs')
        if response.status_code != 200:
            print(f"[DEBUG] Failed to get Google public keys: {response.status_code}")
            return None
            
        certs = response.json()
        print(f"[DEBUG] Got {len(certs)} public keys from Google")
        
        # Get the token header to find the key ID
        try:
            header = jwt.get_unverified_header(id_token)
            key_id = header.get('kid')
            print(f"[DEBUG] Token key ID: {key_id}")
        except Exception as e:
            print(f"[DEBUG] Failed to get token header: {e}")
            return None
        
        # Find the matching key
        if key_id not in certs:
            print(f"[DEBUG] Key ID {key_id} not found in available keys")
            return None
            
        jwk_key = certs[key_id]
        print(f"[DEBUG] Found matching key for ID: {key_id}")
        print(f"[DEBUG] JWK key type: {type(jwk_key)}")
        print(f"[DEBUG] JWK key: {jwk_key}")
        
        # Try to decode without verification first to see the payload
        try:
            unverified_payload = jwt.decode(id_token, options={"verify_signature": False})
            print(f"[DEBUG] Unverified payload: {unverified_payload}")
            
            # Extract user info from unverified payload (for testing)
            user_info = {
                'id': unverified_payload.get('sub'),
                'email': unverified_payload.get('email'),
                'name': unverified_payload.get('name', ''),
                'given_name': unverified_payload.get('given_name', ''),
                'family_name': unverified_payload.get('family_name', ''),
                'picture': unverified_payload.get('picture', '')
            }
            
            print(f"[DEBUG] Successfully extracted user info: {user_info['email']}")
            return user_info
            
        except Exception as e:
            print(f"[DEBUG] Failed to decode token even without verification: {e}")
            return None
        
    except Exception as e:
        print(f"[DEBUG] Google token verification error: {e}")
        print(f"[DEBUG] Error type: {type(e).__name__}")
        import traceback
        print(f"[DEBUG] Full traceback: {traceback.format_exc()}")
        return None

def verify_facebook_token(access_token: str):
    """Verify Facebook access token and get user info"""
    try:
        import requests
        
        print(f"[DEBUG] Attempting to verify Facebook access token...")
        
        # Get user info from Facebook Graph API
        response = requests.get(
            f"https://graph.facebook.com/me?fields=id,name,email&access_token={access_token}"
        )
        
        if response.status_code != 200:
            print(f"[DEBUG] Facebook API error: {response.status_code}")
            return None
            
        user_info = response.json()
        print(f"[DEBUG] Facebook user info: {user_info}")
        
        # Extract user info
        facebook_user_info = {
            'id': user_info.get('id'),
            'email': user_info.get('email'),
            'name': user_info.get('name', ''),
            'given_name': user_info.get('name', '').split(' ')[0] if user_info.get('name') else '',
            'family_name': ' '.join(user_info.get('name', '').split(' ')[1:]) if user_info.get('name') else '',
            'picture': f"https://graph.facebook.com/{user_info.get('id')}/picture?type=large"
        }
        
        print(f"[DEBUG] Successfully verified Facebook token for: {facebook_user_info['email']}")
        return facebook_user_info
        
    except Exception as e:
        print(f"[DEBUG] Facebook token verification error: {e}")
        print(f"[DEBUG] Error type: {type(e).__name__}")
        import traceback
        print(f"[DEBUG] Full traceback: {traceback.format_exc()}")
        return None

def get_or_create_google_user(google_user_info):
    """Get existing user or create new user from Google info"""
    email = google_user_info.get('email')
    google_id = google_user_info.get('id')
    display_name = google_user_info.get('name', '')
    
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT username, display_name FROM users WHERE email = ?", (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            # Update Google ID if not set
            cursor.execute("UPDATE users SET google_id = ?, auth_provider = 'google' WHERE email = ?", (google_id, email))
            conn.commit()
            return {"username": existing_user[0], "email": email, "display_name": existing_user[1] or display_name}
        else:
            # Create new user
            username = f"user_{google_id[-8:]}"  # Use last 8 chars of Google ID
            cursor.execute(
                "INSERT INTO users (username, email, display_name, password, google_id, auth_provider) VALUES (?, ?, ?, ?, ?, ?)",
                (username, email, display_name, "google_auth", google_id, "google")
            )
            conn.commit()
            return {"username": username, "email": email, "display_name": display_name}

def get_or_create_facebook_user(facebook_user_info):
    """Get existing user or create new user from Facebook info"""
    email = facebook_user_info.get('email')
    facebook_id = facebook_user_info.get('id')
    display_name = facebook_user_info.get('name', '')
    
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT username, display_name FROM users WHERE email = ?", (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            # Update Facebook ID if not set
            cursor.execute("UPDATE users SET google_id = ?, auth_provider = 'facebook' WHERE email = ?", (facebook_id, email))
            conn.commit()
            return {"username": existing_user[0], "email": email, "display_name": existing_user[1] or display_name}
        else:
            # Create new user
            username = f"user_{facebook_id[-8:]}"  # Use last 8 chars of Facebook ID
            cursor.execute(
                "INSERT INTO users (username, email, display_name, password, google_id, auth_provider) VALUES (?, ?, ?, ?, ?, ?)",
                (username, email, display_name, "facebook_auth", facebook_id, "facebook")
            )
            conn.commit()
            return {"username": username, "email": email, "display_name": display_name}

def get_balance(username: str) -> Decimal:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        placeholder = get_placeholder()
        cursor.execute(f"SELECT balance FROM users WHERE username = {placeholder}", (username,))
        balance = cursor.fetchone()
    if balance and balance[0] is not None:
        return Decimal(balance[0])
    else:
        return Decimal('0.00')  # Default balance for new users

def update_balance(username: str, new_balance: Decimal):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        placeholder = get_placeholder()
        cursor.execute(f"UPDATE users SET balance = {placeholder} WHERE username = {placeholder}", (str(new_balance), username))
        conn.commit()

def record_transaction(username, type_, amount, old_balance, new_balance, other_user=None):
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

def send_welcome_email(to_email, display_name):
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
        sg = SendGridAPIClient(os.environ["SENDGRID_API_KEY"])
        response = sg.send(message)
        print(f"[DEBUG] SendGrid email sent: {response.status_code}")
    except Exception as e:
        print(f"[DEBUG] Failed to send welcome email via SendGrid: {e}")

def get_balance_by_email(email: str) -> Decimal:
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT balance FROM users WHERE email = ?", (email,))
        balance = cursor.fetchone()
    if balance:
        return Decimal(balance[0])
    else:
        raise HTTPException(status_code=404, detail="User not found")

def generate_recovery_code() -> str:
    """Generate a random 16-character recovery code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(16))

def create_recovery_code(email: str) -> str:
    """Create a new recovery code for the given email"""
    recovery_code = generate_recovery_code()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        placeholder = get_placeholder()
        # Mark any existing codes as used
        cursor.execute(f"UPDATE recovery_codes SET used = 1 WHERE email = {placeholder}", (email,))
        # Insert new recovery code
        cursor.execute(
            f"INSERT INTO recovery_codes (email, recovery_code, created_at) VALUES ({placeholder}, {placeholder}, {placeholder})",
            (email, recovery_code, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        )
        conn.commit()
    return recovery_code

def validate_recovery_code(email: str, recovery_code: str) -> bool:
    """Validate a recovery code for the given email"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        placeholder = get_placeholder()
        cursor.execute(
            f"SELECT id FROM recovery_codes WHERE email = {placeholder} AND recovery_code = {placeholder} AND used = 0",
            (email, recovery_code)
        )
        return cursor.fetchone() is not None

def mark_recovery_code_used(email: str, recovery_code: str):
    """Mark a recovery code as used"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        placeholder = get_placeholder()
        cursor.execute(
            f"UPDATE recovery_codes SET used = 1 WHERE email = {placeholder} AND recovery_code = {placeholder}",
            (email, recovery_code)
        )
        conn.commit()

# Routes
@app.post("/register")
def register(user: User):
    print(f"[DEBUG] Register attempt: email={user.email}")
    try:
        hashed_pw = hash_password(user.password)
        with get_db_connection() as conn:
            cursor = conn.cursor()
            placeholder = get_placeholder()
            cursor.execute(f"INSERT INTO users (username, email, display_name, password) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder})", (user.username, user.email, user.display_name, hashed_pw))
            conn.commit()
        print(f"[DEBUG] Register success: email={user.email}")
        try:
            send_welcome_email(user.email, user.display_name or user.username)
        except Exception as e:
            print(f"[DEBUG] Failed to send welcome email: {e}")
        return {"message": "User registered successfully"}
    except Exception as e:
        print(f"[DEBUG] Register failed: {e}")
        if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Email already exists")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/login")
def login(user: LoginRequest):
    print(f"[DEBUG] Login attempt: email={user.email}")
    if authenticate(user.email, user.password):
        print(f"[DEBUG] Login success: email={user.email}")
        return {"message": "Login successful"}
    print(f"[DEBUG] Login failed: email={user.email}")
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/google-auth")
def google_auth(data: GoogleAuthRequest):
    """Handle Google OAuth authentication"""
    print(f"[DEBUG] Google auth attempt")
    
    # Verify Google token
    google_user_info = verify_google_token(data.access_token)
    if not google_user_info:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    
    # Get or create user
    user_info = get_or_create_google_user(google_user_info)
    
    print(f"[DEBUG] Google auth success: email={user_info['email']}")
    return {
        "message": "Google authentication successful",
        "user": user_info
    }

@app.post("/facebook-auth")
def facebook_auth(data: FacebookAuthRequest):
    """Handle Facebook OAuth authentication"""
    print(f"[DEBUG] Facebook auth attempt")
    
    # Verify Facebook token
    facebook_user_info = verify_facebook_token(data.access_token)
    if not facebook_user_info:
        raise HTTPException(status_code=401, detail="Invalid Facebook token")
    
    # Get or create user
    user_info = get_or_create_facebook_user(facebook_user_info)
    
    print(f"[DEBUG] Facebook auth success: email={user_info['email']}")
    return {
        "message": "Facebook authentication successful",
        "user": user_info
    }

@app.post("/deposit")
def deposit(data: TransactionRequest):
    if not authenticate(data.email, data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    # Get username from email for balance operations
    with get_db_connection() as conn:
        cursor = conn.cursor()
        placeholder = get_placeholder()
        cursor.execute(f"SELECT username FROM users WHERE email = {placeholder}", (data.email,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        username = row[0]

    old_balance = get_balance(username)
    new_balance = old_balance + data.amount
    update_balance(username, new_balance)
    record_transaction(username, "Deposit", data.amount, old_balance, new_balance)

    return {"message": "Deposit successful", "new_balance": str(new_balance)}

@app.post("/withdraw")
def withdraw(data: TransactionRequest):
    if not authenticate(data.email, data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    # Get username from email for balance operations
    with get_db_connection() as conn:
        cursor = conn.cursor()
        placeholder = get_placeholder()
        cursor.execute(f"SELECT username FROM users WHERE email = {placeholder}", (data.email,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        username = row[0]

    old_balance = get_balance(username)
    if old_balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    new_balance = old_balance - data.amount
    update_balance(username, new_balance)
    record_transaction(username, "Withdraw", data.amount, old_balance, new_balance)

    return {"message": "Withdrawal successful", "new_balance": str(new_balance)}

@app.post("/transfer")
def transfer(data: TransferRequest):
    if not authenticate(data.from_email, data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    if data.from_email == data.to_email:
        raise HTTPException(status_code=400, detail="Cannot transfer to yourself")

    # Check if recipient exists
    with get_db_connection() as conn:
        cursor = conn.cursor()
        placeholder = get_placeholder()
        cursor.execute(f"SELECT username FROM users WHERE email = {placeholder}", (data.to_email,))
        recipient_row = cursor.fetchone()
        if not recipient_row:
            raise HTTPException(status_code=404, detail="Recipient not found")
        recipient_username = recipient_row[0]

        # Get sender username
        cursor.execute(f"SELECT username FROM users WHERE email = {placeholder}", (data.from_email,))
        sender_row = cursor.fetchone()
        if not sender_row:
            raise HTTPException(status_code=404, detail="Sender not found")
        sender_username = sender_row[0]

    # Check sender has sufficient funds
    sender_old_balance = get_balance(sender_username)
    if sender_old_balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    # Get recipient's current balance
    recipient_old_balance = get_balance(recipient_username)

    # Perform the transfer
    sender_new_balance = sender_old_balance - data.amount
    recipient_new_balance = recipient_old_balance + data.amount

    # Update both balances
    update_balance(sender_username, sender_new_balance)
    update_balance(recipient_username, recipient_new_balance)

    # Record transactions for both users
    record_transaction(sender_username, "Transfer Out", data.amount, sender_old_balance, sender_new_balance, other_user=recipient_username)
    record_transaction(recipient_username, "Transfer In", data.amount, recipient_old_balance, recipient_new_balance, other_user=sender_username)

    return {
        "message": f"Transfer successful to {data.to_email}", 
        "new_balance": str(sender_new_balance),
        "recipient_email": data.to_email,
        "amount": str(data.amount)
    }

@app.get("/balance/{username}")
def balance(username: str, password: str):
    if not authenticate(username, password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    current = get_balance(username)
    return {"balance": str(current)}

@app.get("/transactions/{username}")
def transactions(username: str, password: str):
    if not authenticate(username, password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT type, amount, old_balance, new_balance, timestamp, description FROM transactions WHERE username = ? ORDER BY id DESC", (username,))
        rows = cursor.fetchall()

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

@app.post("/balance")
def balance_post(data: BalanceRequest):
    if not authenticate(data.email, data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    current = get_balance_by_email(data.email)
    return {"balance": str(current)}

@app.post("/transactions")
def transactions_post(data: TransactionsRequest):
    if not authenticate(data.email, data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Get username from email for transaction lookup
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM users WHERE email = ?", (data.email,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        username = row[0]
        
        cursor.execute("SELECT type, amount, old_balance, new_balance, timestamp, description FROM transactions WHERE username = ? ORDER BY id DESC", (username,))
        rows = cursor.fetchall()

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

@app.post("/profile")
def get_profile(data: ProfileRequest):
    if not authenticate(data.email, data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT username, email, display_name FROM users WHERE email = ?", (data.email,))
        row = cursor.fetchone()
    if row:
        return {"username": row[0], "email": row[1], "display_name": row[2]}
    else:
        raise HTTPException(status_code=404, detail="User not found")

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
            print("[DEBUG] Gmail credentials not configured, returning code directly")
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
        
        return {"message": "Recovery code sent to your email", "recovery_code": recovery_code}
        
    except Exception as e:
        print(f"[DEBUG] Failed to send recovery code email: {str(e)}")
        return {"message": "Recovery code generated (email failed)", "recovery_code": recovery_code}

@app.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    """Reset password using recovery code"""
    # Check if user exists
    with get_db_connection() as conn:
        cursor = conn.cursor()
        placeholder = get_placeholder()
        cursor.execute(f"SELECT id FROM users WHERE email = {placeholder}", (data.email,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
    
    # Validate recovery code
    if not validate_recovery_code(data.email, data.recovery_code):
        raise HTTPException(status_code=400, detail="Invalid or expired recovery code")
    
    # Hash new password and update
    hashed_password = hash_password(data.new_password)
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE users SET password = {placeholder} WHERE email = {placeholder}", (hashed_password, data.email))
        conn.commit()
    
    # Mark recovery code as used
    mark_recovery_code_used(data.email, data.recovery_code)
    
    return {"message": "Password reset successfully"}

@app.get("/")
def health_check():
    """Health check endpoint for Docker"""
    return {"status": "healthy", "message": "BlueBank API is running"}