from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LatestPredictionResponse(BaseModel):
    id: int
    station_id: str
    prediction_time: datetime
    flood_probability: float
    threat_level: str
    river_water_level_m: Optional[float] = None
    rainfall_1h_mm: Optional[float] = None
    rainfall_24_mm: Optional[float] = None
    model_version: str
    created_at: datetime
    station_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    current_water_level_m: Optional[float] = None

    class Config:
        from_attributes = True

class PredictionHistoryResponse(BaseModel):
    id: int
    station_id: str
    prediction_time: datetime
    flood_probability: float
    threat_level: str
    river_water_level_m: Optional[float] = None
    rainfall_1h_mm: Optional[float] = None
    rainfall_24_mm: Optional[float] = None
    model_version: str
    created_at: datetime

    class Config:
        from_attributes = True

class MapPredictionResponse(BaseModel):
    station_id: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    flood_probability: float
    threat_level: str
    prediction_time: datetime

    class Config:
        from_attributes = True
