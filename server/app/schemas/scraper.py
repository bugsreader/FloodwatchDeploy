from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class ScraperStatusResponse(BaseModel):
    enabled: bool
    isRunning: bool
    lastRunTime: Optional[datetime] = None
    nextRunTime: Optional[str] = None

class OpenMeteoStatusResponse(BaseModel):
    enabled: bool
    isRunning: bool
    lastRunTime: Optional[datetime] = None
    totalRecords: int

class ScraperRunResponse(BaseModel):
    message: str
    data: Optional[Any] = None
