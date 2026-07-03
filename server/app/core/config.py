import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve absolute path to server/.env relative to this file's location
current_file_dir = Path(__file__).resolve().parent
env_file_path = current_file_dir / ".." / ".." / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "FloodWatch API"
    PORT: int = 5000
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/floodwatch"
    
    # CORS Origins (comma separated list)
    CORS_ORIGIN: str = "http://localhost:5173,http://127.0.0.1:5173"
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGIN.split(",") if origin.strip()]
        
    JWT_SECRET: str = "your_super_secret_jwt_key_change_me_in_production"
    JWT_EXPIRES_IN: str = "1h"
    
    # Scheduler Config
    OPEN_METEO_CRON_ENABLED: bool = True
    OPEN_METEO_CRON: str = "*/15 * * * *"
    OPEN_METEO_BATCH_SIZE: int = 10
    OPEN_METEO_MAX_RETRIES: int = 3
    OPEN_METEO_FORECAST_DAYS: int = 7

    model_config = SettingsConfigDict(
        env_file=str(env_file_path),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
