#!/usr/bin/env python3
"""
Setup PostgreSQL database schema
"""
import psycopg2
import os

def setup_postgresql_schema(database_url):
    """Create tables in PostgreSQL database"""
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255),
            email VARCHAR(255) UNIQUE NOT NULL,
            display_name VARCHAR(255),
            password VARCHAR(255),
            balance VARCHAR(255),
            google_id VARCHAR(255),
            auth_provider VARCHAR(50)
        )
    """)
    
    # Create transactions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255),
            type VARCHAR(50),
            amount VARCHAR(255),
            old_balance VARCHAR(255),
            new_balance VARCHAR(255),
            timestamp VARCHAR(255),
            description TEXT
        )
    """)
    
    conn.commit()
    conn.close()
    
    print("✅ PostgreSQL schema created successfully!")

if __name__ == "__main__":
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL environment variable not set")
        exit(1)
    
    setup_postgresql_schema(database_url) 