from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from decimal import Decimal, getcontext
from datetime import datetime
import sqlite3
import os
from fastapi.middleware.cors import CORSMiddleware

getcontext().prec = 100

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
    username: str
    password: str

class TransactionRequest(BaseModel):
    username: str
    password: str
    amount: Decimal

# DB setup
def create_db():
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                balance TEXT NOT NULL DEFAULT '0.00'
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
def authenticate(username: str, password: str):
    with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
        user = cursor.fetchone()
    return user is not None

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

# Routes
@app.post("/register")
def register(user: User):
    print(f"[DEBUG] Register attempt: username={user.username}")
    try:
        with sqlite3.connect(DB_NAME, timeout=10, check_same_thread=False) as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (user.username, user.password))
            conn.commit()
        print(f"[DEBUG] Register success: username={user.username}")
        return {"message": "User registered successfully"}
    except sqlite3.IntegrityError:
        print(f"[DEBUG] Register failed (username exists): username={user.username}")
        raise HTTPException(status_code=400, detail="Username already exists")

@app.post("/login")
def login(user: User):
    print(f"[DEBUG] Login attempt: username={user.username}")
    if authenticate(user.username, user.password):
        print(f"[DEBUG] Login success: username={user.username}")
        return {"message": "Login successful"}
    print(f"[DEBUG] Login failed: username={user.username}")
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/deposit")
def deposit(data: TransactionRequest):
    if not authenticate(data.username, data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    old_balance = get_balance(data.username)
    new_balance = old_balance + data.amount
    update_balance(data.username, new_balance)
    record_transaction(data.username, "Deposit", data.amount, old_balance, new_balance)

    return {"message": "Deposit successful", "new_balance": str(new_balance)}

@app.post("/withdraw")
def withdraw(data: TransactionRequest):
    if not authenticate(data.username, data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    old_balance = get_balance(data.username)
    if old_balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    new_balance = old_balance - data.amount
    update_balance(data.username, new_balance)
    record_transaction(data.username, "Withdraw", data.amount, old_balance, new_balance)

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