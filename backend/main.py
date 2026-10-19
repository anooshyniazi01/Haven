import os
from app.db.base import Base
from app.db.session import engine
import app.db.models
from app.main import create_app

# Default serverless env vars for Vercel deployment
if os.environ.get("VERCEL"):
    os.environ.setdefault("STORAGE_ROOT", "/tmp/storage")
    os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/haven.db")
    os.environ.setdefault("APP_ENV", "production")

storage_path = os.getenv("STORAGE_ROOT", "/tmp/storage")
try:
    os.makedirs(storage_path, exist_ok=True)
except Exception:
    pass

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database schema initialization: {e}")

app = create_app()