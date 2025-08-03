import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

# Database URL configuration - default to cloud PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:UxI:dxl81yG]uBK:rU<U<sUdm5EZ@bluebank-db.ca76eoy2kz8t.us-east-1.rds.amazonaws.com:5432/postgres")

if DATABASE_URL.startswith("postgresql://"):
    # PostgreSQL configuration
    engine = create_engine(DATABASE_URL)
else:
    # SQLite configuration (for local development)
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    # Skip SQLAlchemy table creation since we're using raw SQL
    pass 