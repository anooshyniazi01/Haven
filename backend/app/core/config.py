import os
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _resolve_default_model_path() -> str:
    env_path = os.getenv("AI_MODEL_PATH")
    if env_path:
        return env_path
    # Check repository models directory
    repo_model = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "..",
            "models",
            "ai-image-detect-distilled",
            "model_quantized.onnx",
        )
    )
    if os.path.exists(repo_model):
        return repo_model
    # Check local Windows dev drive path
    d_path = r"D:\haven_models\ai-image-detect-distilled\model_quantized.onnx"
    if os.path.exists(d_path):
        return d_path
    return "./models/ai-image-detect-distilled/model_quantized.onnx"


class Settings(BaseSettings):
    """Application runtime configuration with safe defaults."""

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
    AI_MODEL_PATH: str = Field(default_factory=_resolve_default_model_path)
    AI_MODEL_NAME: str = "ai-image-detect-distilled-onnx"
    AI_MODEL_VERSION: str = "1.0.0"
    AI_MODEL_TASK: str = "ai_generated_image_detection"


settings = Settings()
