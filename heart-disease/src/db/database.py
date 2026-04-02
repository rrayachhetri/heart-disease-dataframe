"""
Database engine, session factory, and Base for all SQLAlchemy models.
DATABASE_URL defaults to SQLite for local dev; set to PostgreSQL in production.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cardiosense.db")

# SQLite needs check_same_thread=False; ignored for other DBs
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables on startup (idempotent)."""
    from src.db import models  # noqa: F401 — ensure models are registered
    Base.metadata.create_all(bind=engine)
