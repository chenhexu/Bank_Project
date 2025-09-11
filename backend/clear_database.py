#!/usr/bin/env python3
"""
Clear all data from BlueBank database while preserving table structure
"""

import psycopg2
import os

def clear_database():
    """Clear all data from the database"""
    # Hardcode the working database URL for clearing
    database_url = "postgresql://postgres:BlueBank2025!@bluebank-db.ca76eoy2kz8t.us-east-1.rds.amazonaws.com:5432/postgres"
    
    try:
        # Connect to database
        print("🔌 Connecting to database...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Disable foreign key constraints temporarily
        print("🔧 Disabling foreign key constraints...")
        cursor.execute("SET session_replication_role = replica;")
        
        # Get all table names
        cursor.execute("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
        """)
        tables = cursor.fetchall()
        
        # Clear all tables
        print("🗑️ Clearing tables...")
        for table in tables:
            table_name = table[0]
            print(f"  - Clearing {table_name}...")
            cursor.execute(f"DELETE FROM {table_name};")
        
        # Re-enable foreign key constraints
        print("🔧 Re-enabling foreign key constraints...")
        cursor.execute("SET session_replication_role = DEFAULT;")
        
        # Reset sequences (auto-increment IDs)
        print("🔄 Resetting ID sequences...")
        cursor.execute("""
            SELECT sequence_name FROM information_schema.sequences 
            WHERE sequence_schema = 'public'
        """)
        sequences = cursor.fetchall()
        
        for sequence in sequences:
            sequence_name = sequence[0]
            print(f"  - Resetting {sequence_name}...")
            cursor.execute(f"ALTER SEQUENCE {sequence_name} RESTART WITH 1;")
        
        # Commit changes
        conn.commit()
        print("✅ Database cleared successfully!")
        print("📊 All user data, accounts, and transactions have been deleted")
        print("🏗️ Database structure preserved")
        
        return True
        
    except Exception as e:
        print(f"❌ Error clearing database: {e}")
        return False
    
    finally:
        if 'conn' in locals():
            conn.close()
            print("🔌 Database connection closed")

if __name__ == "__main__":
    print("🗑️ BLUEBANK DATABASE CLEAR UTILITY")
    print("=" * 40)
    
    # Confirmation
    response = input("⚠️ This will DELETE ALL DATA from the database. Are you sure? (type 'YES' to confirm): ")
    
    if response.upper() == "YES":
        success = clear_database()
        if success:
            print("\n🎉 Database cleared! You can now test with fresh data.")
        else:
            print("\n❌ Failed to clear database. Check the error messages above.")
    else:
        print("❌ Operation cancelled.")