from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Dev-friendly default so the API can boot without env configuration.
    DATABASE_URL = "sqlite:///./app.db"

_engine_kwargs = {"pool_pre_ping": True, "pool_recycle": 300}
if DATABASE_URL.startswith("sqlite:"):
    # SQLite doesn't support these pool settings the same way; also needs this
    # when used with FastAPI dependencies across threads.
    _engine_kwargs.pop("pool_recycle", None)
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()