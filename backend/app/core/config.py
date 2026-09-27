import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "OnePath AI"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "onepath_ai_super_secret_key_change_in_production_2026_x99")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    # Default to sqlite file if postgresql is not provided
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./onepath_ai.db")
    
    # AI Integration
    ENABLE_LOCAL_MODEL: bool = os.getenv("ENABLE_LOCAL_MODEL", "true").lower() in ("true", "1", "yes")
    LOCAL_MODEL_PATH: str = os.getenv("LOCAL_MODEL_PATH", "ml/models/onepath-custom-v1")
    LOCAL_MODEL_DEVICE: str = os.getenv("LOCAL_MODEL_DEVICE", "cuda")
    LOCAL_MODEL_TIMEOUT_SECONDS: float = float(os.getenv("LOCAL_MODEL_TIMEOUT_SECONDS", "25.0"))

    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
