"""
Database configuration and session management.

This module handles SQLAlchemy setup for both SQLite (dev) and PostgreSQL (prod)
based on the ENVIRONMENT variable in .env.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./portarias.db")
ENVIRONMENT = os.getenv("ENVIRONMENT", "dev")

# Create engine with appropriate parameters based on database type
if DATABASE_URL.startswith("sqlite"):
    # SQLite configuration
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=ENVIRONMENT == "dev"
    )
else:
    # PostgreSQL configuration
    engine = create_engine(
        DATABASE_URL,
        echo=ENVIRONMENT == "dev",
        pool_pre_ping=True,
        pool_recycle=3600
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency for FastAPI to get database session.
    
    Yields:
        Session: SQLAlchemy session for database operations
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database by creating all tables.
    Call this during application startup.
    """
    Base.metadata.create_all(bind=engine)


def drop_db():
    """
    Drop all tables. Use with caution - only for development/testing.
    """
    Base.metadata.drop_all(bind=engine)
