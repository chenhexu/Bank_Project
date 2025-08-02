import sqlite3
import os

DB_NAME = "bank_users.db"

def check_user(email):
    if not os.path.exists(DB_NAME):
        print(f"Database {DB_NAME} not found!")
        return
    
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT email, password, auth_provider FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        
        if row:
            email, password, auth_provider = row
            print(f"User found:")
            print(f"  Email: {email}")
            print(f"  Auth Provider: {auth_provider}")
            print(f"  Password hash: {password[:20]}..." if len(password) > 20 else f"  Password: {password}")
        else:
            print(f"User {email} not found in database")
            
        # Show all users
        cursor.execute("SELECT email, auth_provider FROM users")
        all_users = cursor.fetchall()
        print(f"\nAll users in database:")
        for user_email, provider in all_users:
            print(f"  {user_email} ({provider})")

if __name__ == "__main__":
    check_user("chenhexumtl@gmail.com") 