from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from app.models.forecast import WeatherForecast

def get_forecast_by_station_id(db: Session, station_id: str, hours: int = 24) -> List[WeatherForecast]:
    # We query from 1 hour ago to match Node.js logic
    cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
    return db.query(WeatherForecast)\
        .filter(WeatherForecast.station_id == station_id)\
        .filter(WeatherForecast.forecast_time >= cutoff)\
        .order_by(WeatherForecast.forecast_time.asc())\
        .limit(hours)\
        .all()

def get_total_forecast_records(db: Session) -> int:
    return db.query(WeatherForecast).count()

def get_latest_forecast_created_at(db: Session) -> Optional[datetime]:
    result = db.query(func.max(WeatherForecast.created_at)).scalar()
    return result

# We need func for max
from sqlalchemy import func

def bulk_upsert_forecasts(db: Session, forecast_dicts: List[Dict[str, Any]]) -> int:
    if not forecast_dicts:
        return 0

    # Execute batch upsert using PostgreSQL ON CONFLICT DO UPDATE
    stmt = insert(WeatherForecast).values(forecast_dicts)
    update_dict = {
        "temperature_2m": stmt.excluded.temperature_2m,
        "relative_humidity_2m": stmt.excluded.relative_humidity_2m,
        "precipitation_probability": stmt.excluded.precipitation_probability,
        "precipitation_mm": stmt.excluded.precipitation_mm,
        "rain_mm": stmt.excluded.rain_mm,
        "showers_mm": stmt.excluded.showers_mm,
        "weather_code": stmt.excluded.weather_code,
        "wind_speed_10m": stmt.excluded.wind_speed_10m,
        "wind_direction_10mc": stmt.excluded.wind_direction_10mc,
        "created_at": func.now()
    }
    
    upsert_stmt = stmt.on_conflict_do_update(
        constraint="uq_station_forecast_time",
        set_=update_dict
    )
    
    db.execute(upsert_stmt)
    db.commit()
    return len(forecast_dicts)
