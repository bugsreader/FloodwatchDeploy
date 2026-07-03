from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WeatherForecastOut(BaseModel):
    id: int
    station_id: str
    forecast_time: datetime
    temperature_2m: Optional[float] = None
    relative_humidity_2m: Optional[float] = None
    precipitation_probability: Optional[float] = None
    precipitation_mm: Optional[float] = None
    rain_mm: Optional[float] = None
    showers_mm: Optional[float] = None
    weather_code: Optional[int] = None
    wind_speed_10m: Optional[float] = None
    wind_direction_10mC: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True
