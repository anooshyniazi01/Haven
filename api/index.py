import os
import sys
from pathlib import Path

# Set up paths so app and backend can be imported
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Ensure Vercel serverless environment defaults
if os.environ.get("VERCEL"):
    os.environ.setdefault("STORAGE_ROOT", "/tmp/storage")
    os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/haven.db")
    os.environ.setdefault("APP_ENV", "production")
    os.environ.setdefault("LOG_LEVEL", "INFO")

    # Model path resolution in Vercel lambda container
    default_model = ROOT_DIR / "models" / "ai-image-detect-distilled" / "model_quantized.onnx"
    if default_model.exists():
        os.environ.setdefault("AI_MODEL_PATH", str(default_model))

from app.main import create_app
from app.db.base import Base
from app.db.session import engine
import app.db.models  # Ensure all SQLAlchemy models are registered

# Ensure storage directory exists
storage_path = os.getenv("STORAGE_ROOT", "/tmp/storage")
try:
    os.makedirs(storage_path, exist_ok=True)
except Exception:
    pass

# Ensure SQLite database schema exists on cold start
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database schema initialization: {e}")

# Create the FastAPI application instance for Vercel ASGI runner
app = create_app()