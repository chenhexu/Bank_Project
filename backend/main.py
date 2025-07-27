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
# Load environment variables
load_dotenv("Api_Key.env")
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

getcontext().prec = 100

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_NAME = os.path.join(os.path.dirname(__file__), "bank_users.db")

# Models
class User(BaseModel):
    email: str
    password: str
    display_name: str = ""
    username: str

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
                balance TEXT NOT NULL DEFAULT '0.00'
            )
        ''')
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
                timestamp TEXT NOT NULL
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
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT password FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
    if row:
        hashed_password = row[0]
        return verify_password(password, hashed_password)
    return False

def get_balance(username: str) -> Decimal:
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT balance FROM users WHERE username = ?", (username,))
        balance = cursor.fetchone()
    if balance:
        return Decimal(balance[0])
    else:
        raise HTTPException(status_code=404, detail="User not found")

def update_balance(username: str, new_balance: Decimal):
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET balance = ? WHERE username = ?", (str(new_balance), username))
        conn.commit()

def record_transaction(username, type_, amount, old_balance, new_balance):
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO transactions (username, type, amount, old_balance, new_balance, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (username, type_, str(amount), str(old_balance), str(new_balance), datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
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
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        # Mark any existing codes as used
        cursor.execute("UPDATE recovery_codes SET used = 1 WHERE email = ?", (email,))
        # Insert new recovery code
        cursor.execute(
            "INSERT INTO recovery_codes (email, recovery_code, created_at) VALUES (?, ?, ?)",
            (email, recovery_code, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        )
        conn.commit()
    return recovery_code

def validate_recovery_code(email: str, recovery_code: str) -> bool:
    """Validate a recovery code for the given email"""
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM recovery_codes WHERE email = ? AND recovery_code = ? AND used = 0",
            (email, recovery_code)
        )
        return cursor.fetchone() is not None

def mark_recovery_code_used(email: str, recovery_code: str):
    """Mark a recovery code as used"""
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE recovery_codes SET used = 1 WHERE email = ? AND recovery_code = ?",
            (email, recovery_code)
        )
        conn.commit()

# Routes
@app.post("/register")
def register(user: User):
    print(f"[DEBUG] Register attempt: email={user.email}")
    try:
        hashed_pw = hash_password(user.password)
        with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO users (username, email, display_name, password) VALUES (?, ?, ?, ?)", (user.username, user.email, user.display_name, hashed_pw))
            conn.commit()
        print(f"[DEBUG] Register success: email={user.email}")
        try:
            send_welcome_email(user.email, user.display_name or user.username)
        except Exception as e:
            print(f"[DEBUG] Failed to send welcome email: {e}")
        return {"message": "User registered successfully"}
    except sqlite3.IntegrityError:
        print(f"[DEBUG] Register failed (email exists): email={user.email}")
        raise HTTPException(status_code=400, detail="Email already exists")

@app.post("/login")
def login(user: LoginRequest):
    print(f"[DEBUG] Login attempt: email={user.email}")
    if authenticate(user.email, user.password):
        print(f"[DEBUG] Login success: email={user.email}")
        return {"message": "Login successful"}
    print(f"[DEBUG] Login failed: email={user.email}")
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/deposit")
def deposit(data: TransactionRequest):
    if not authenticate(data.email, data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    # Get username from email for balance operations
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM users WHERE email = ?", (data.email,))
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
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM users WHERE email = ?", (data.email,))
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
        cursor.execute("SELECT type, amount, old_balance, new_balance, timestamp FROM transactions WHERE username = ? ORDER BY id DESC", (username,))
        rows = cursor.fetchall()

    return [
        {
            "type": r[0],
            "amount": r[1],
            "old_balance": r[2],
            "new_balance": r[3],
            "timestamp": r[4]
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
        
        cursor.execute("SELECT type, amount, old_balance, new_balance, timestamp FROM transactions WHERE username = ? ORDER BY id DESC", (username,))
        rows = cursor.fetchall()
    
    return [
        {
            "type": r[0],
            "amount": r[1],
            "old_balance": r[2],
            "new_balance": r[3],
            "timestamp": r[4]
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
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (data.email,))
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
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (data.email,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
    
    # Validate recovery code
    if not validate_recovery_code(data.email, data.recovery_code):
        raise HTTPException(status_code=400, detail="Invalid or expired recovery code")
    
    # Hash new password and update
    hashed_password = hash_password(data.new_password)
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password = ? WHERE email = ?", (hashed_password, data.email))
        conn.commit()
    
    # Mark recovery code as used
    mark_recovery_code_used(data.email, data.recovery_code)
    
    return {"message": "Password reset successfully"}