from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import datetime
from decimal import Decimal

class StationBase(BaseModel):
    station_id: str
    station_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    basin: Optional[str] = None
    sub_basin: Optional[str] = None

class StationUpdate(BaseModel):
    station_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    basin: Optional[str] = None
    sub_basin: Optional[str] = None
    latitude: Optional[Union[float, str, Decimal]] = None
    longitude: Optional[Union[float, str, Decimal]] = None

class StationOut(BaseModel):
    id: int
    station_id: str
    station_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    basin: Optional[str] = None
    sub_basin: Optional[str] = None
    latest_water_level_m: Optional[float] = None
    normal_threshold: Optional[float] = None
    alert_threshold: Optional[float] = None
    warning_threshold: Optional[float] = None
    danger_threshold: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    status: str = "Unknown"  # dynamically calculated

    class Config:
        from_attributes = True

class PaginationMeta(BaseModel):
    total: int
    page: int
    limit: int
    pages: int

class StationListResponse(BaseModel):
    stations: List[StationOut]
    pagination: PaginationMeta

class WaterLevelOut(BaseModel):
    id: int
    station_id: str
    water_level_m: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class StationDetailResponse(BaseModel):
    station: StationOut
    historicalLevels: List[WaterLevelOut]
