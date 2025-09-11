import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

# Database URL configuration - cloud PostgreSQL only
DATABASE_URL = os.getenv("DATABASE_URL")

# Enforce SSL for RDS if not explicitly set
if DATABASE_URL and "sslmode" not in DATABASE_URL and "postgresql" in DATABASE_URL:
    if "?" in DATABASE_URL:
        DATABASE_URL = f"{DATABASE_URL}&sslmode=require"
    else:
        DATABASE_URL = f"{DATABASE_URL}?sslmode=require"

if not DATABASE_URL:
    raise Exception("DATABASE_URL environment variable is not set. Please configure your database connection.")

# PostgreSQL configuration
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    # Skip SQLAlchemy table creation since we're using raw SQL
    pass 