from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from app.core.config import settings

# Create engine with connection pool parameters suitable for PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Import all models to ensure they are registered with the metadata registry
from app.models.role import Role
from app.models.user import User
from app.models.station import RiverStation, RiverWaterLevel
from app.models.forecast import WeatherForecast
from app.models.prediction import FloodPrediction
from app.models.scraper import ScraperJob
