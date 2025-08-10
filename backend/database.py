import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

# Database URL configuration - default to cloud PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:aCzZ34x0:f~1Q[]E!o9Fb#okaj5i@bluebank-db.ca76eoy2kz8t.us-east-1.rds.amazonaws.com:5432/postgres")

if DATABASE_URL.startswith("postgresql://"):
    # PostgreSQL configuration
    engine = create_engine(DATABASE_URL)
else:
    # Fallback configuration (should not be used in production)
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    # Skip SQLAlchemy table creation since we're using raw SQL
    pass 