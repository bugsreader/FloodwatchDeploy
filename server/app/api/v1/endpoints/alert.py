from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.station import RiverStation
from app.models.prediction import FloodPrediction
from app.utils.haversine import haversine
from pydantic import BaseModel
from typing import List

router = APIRouter()

class LocationRequest(BaseModel):
    latitude: float
    longitude: float

class AlertResponse(BaseModel):
    station_id: str
    station_name: str
    distance_km: float
    threat_level: str
    probability: float

@router.post("/proximity", response_model=List[AlertResponse])
def get_proximity_alerts(
    req: LocationRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = current_user.get("role")
    
    # 1. Get all stations and their LATEST prediction
    stations = db.query(RiverStation).all()
    
    alerts = []
    
    for station in stations:
        # Get latest prediction
        latest_pred = db.query(FloodPrediction).filter(
            FloodPrediction.station_id == station.station_id
        ).order_by(FloodPrediction.prediction_time.desc()).first()
        
        if not latest_pred or latest_pred.threat_level not in ["High", "Critical"]:
            continue
            
        # Skip if station has no coordinates
        if station.latitude is None or station.longitude is None:
            continue
            
        # Calculate distance
        dist = haversine(req.latitude, req.longitude, station.latitude, station.longitude)
        
        # If Admin or Emergency role, global oversight (ignore distance)
        # Otherwise, strictly 30km radius
        if role in ["Admin", "Emergency/Municipal Role"] or dist <= 30.0:
            alerts.append({
                "station_id": station.station_id,
                "station_name": station.station_name,
                "distance_km": round(dist, 2),
                "threat_level": latest_pred.threat_level,
                "probability": latest_pred.flood_probability
            })
            
    return alerts
