from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, Dict, Any, Tuple, List
from app.crud import station as crud_station
from app.utils.water_level_status import calculate_water_level_status
from app.models.station import RiverStation

def map_station_status(station: RiverStation) -> RiverStation:
    """
    Dynamically attaches the 'status' property to a station object based on water level thresholds.
    """
    if not station:
        return None
        
    thresholds = {
        "normal": float(station.normal_threshold) if station.normal_threshold is not None else None,
        "alert": float(station.alert_threshold) if station.alert_threshold is not None else None,
        "warning": float(station.warning_threshold) if station.warning_threshold is not None else None,
        "danger": float(station.danger_threshold) if station.danger_threshold is not None else None,
    }
    
    station.status = calculate_water_level_status(station.latest_water_level_m, thresholds)
    return station

def get_stations_with_status(db: Session, filters: Dict[str, Any]) -> Tuple[List[RiverStation], Dict[str, Any]]:
    stations, total = crud_station.get_stations(db, **filters)
    
    # Calculate status for each
    for station in stations:
        map_station_status(station)
        
    page = filters.get("page", 1)
    limit = filters.get("limit", 20)
    
    pagination = {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit > 0 else 0
    }
    
    return stations, pagination

def get_station_details_with_status(db: Session, station_id: str) -> Optional[Dict[str, Any]]:
    station = crud_station.get_station_by_id(db, station_id)
    if not station:
        return None
        
    map_station_status(station)
    historical_levels = crud_station.get_station_water_levels(db, station_id, limit=100)
    
    return {
        "station": station,
        "historicalLevels": historical_levels
    }

def update_station_by_id(db: Session, station_id: str, data: Dict[str, Any]) -> Optional[RiverStation]:
    db_station = crud_station.get_station_by_id(db, station_id)
    if not db_station:
        return None

    # Validate coordinates
    update_fields = {}
    
    # Extract string values or floats
    for field in ["station_name", "state", "district", "basin", "sub_basin"]:
        if field in data and data[field] is not None:
            update_fields[field] = data[field]
            
    if "latitude" in data:
        lat_val = data["latitude"]
        if lat_val is not None and lat_val != "":
            try:
                lat = float(lat_val)
                if lat < -90 or lat > 90:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid latitude")
                update_fields["latitude"] = lat
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid latitude")
        else:
            update_fields["latitude"] = None

    if "longitude" in data:
        lng_val = data["longitude"]
        if lng_val is not None and lng_val != "":
            try:
                lng = float(lng_val)
                if lng < -180 or lng > 180:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid longitude")
                update_fields["longitude"] = lng
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid longitude")
        else:
            update_fields["longitude"] = None

    updated = crud_station.update_station(db, db_station=db_station, update_data=update_fields)
    return updated
