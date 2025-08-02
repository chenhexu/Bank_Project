#!/usr/bin/env python3
"""
Migration script to transfer data from SQLite to PostgreSQL
"""
import sqlite3
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from urllib.parse import urlparse

def get_sqlite_data():
    """Extract data from SQLite database"""
    conn = sqlite3.connect('bank_users.db')
    cursor = conn.cursor()
    
    # Get all users
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    
    # Get all transactions
    cursor.execute("SELECT * FROM transactions")
    transactions = cursor.fetchall()
    
    conn.close()
    
    return users, transactions

def migrate_to_postgresql(database_url):
    """Migrate data to PostgreSQL"""
    # Parse database URL
    parsed = urlparse(database_url)
    
    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path[1:],  # Remove leading slash
        user=parsed.username,
        password=parsed.password
    )
    
    cursor = conn.cursor()
    
    # Get SQLite data
    users, transactions = get_sqlite_data()
    
    print(f"Found {len(users)} users and {len(transactions)} transactions to migrate")
    
    # Migrate users
    for user in users:
        cursor.execute("""
            INSERT INTO users (id, email, hashed_password, full_name, balance, auth_provider, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (email) DO NOTHING
        """, user)
    
    # Migrate transactions
    for transaction in transactions:
        cursor.execute("""
            INSERT INTO transactions (id, user_id, transaction_type, amount, description, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, transaction)
    
    conn.commit()
    conn.close()
    
    print("Migration completed successfully!")

if __name__ == "__main__":
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL environment variable not set")
        exit(1)
    
    if not database_url.startswith("postgresql://"):
        print("Error: DATABASE_URL must be a PostgreSQL URL")
        exit(1)
    
    migrate_to_postgresql(database_url) 