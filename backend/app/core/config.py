import sys
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ensure D drive virtual environment packages are discoverable on this machine
_d_site_packages = Path(r"D:\Haven_backend_venv\Lib\site-packages")
if _d_site_packages.exists() and str(_d_site_packages) not in sys.path:
    sys.path.insert(0, str(_d_site_packages))


class Settings(BaseSettings):
    """Haven application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_ENV: str = "development"
    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8000
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "sqlite:///./haven.db"
    STORAGE_ROOT: str = "./storage"
    MAX_UPLOAD_SIZE_MB: int = 25

    FRONTEND_ORIGIN: str = "http://localhost:5173"
    LOG_LEVEL: str = "INFO"

    # Core AI Forensics configuration
    AI_MODEL_PATH: str = r"D:\haven_models\ai-image-detect-distilled\model_quantized.onnx"
    AI_MODEL_NAME: str = "ai-image-detect-distilled-onnx"
    AI_MODEL_VERSION: str = "1.0.0"
    AI_MODEL_TASK: str = "ai_generated_image_detection"


settings = Settings()

