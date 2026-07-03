from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from app.db.session import get_db
from app.api.deps import get_current_user, get_current_admin, get_authorized_exporter
from app.services import station_service
from app.crud import forecast as crud_forecast
from app.schemas.station import StationListResponse, StationDetailResponse, StationUpdate, StationOut
from app.schemas.forecast import WeatherForecastOut

router = APIRouter()

@router.get("/", response_model=StationListResponse)
def get_stations(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1),
    search: str = Query(""),
    state: str = Query(""),
    status_filter: str = Query("", alias="status"),
    sortBy: str = Query("last_updated"),
    sortOrder: str = Query("desc"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    filters = {
        "page": page,
        "limit": limit,
        "search": search,
        "state": state,
        "status": status_filter,
        "sortBy": sortBy,
        "sortOrder": sortOrder
    }
    stations, pagination = station_service.get_stations_with_status(db, filters)
    return {"stations": stations, "pagination": pagination}

@router.get("/{station_id}", response_model=StationDetailResponse)
def get_station_details(
    station_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    details = station_service.get_station_details_with_status(db, station_id)
    if not details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
    return details

@router.get("/{station_id}/forecast", response_model=List[WeatherForecastOut])
def get_station_forecast(
    station_id: str,
    hours: int = Query(24, ge=1),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify station exists
    details = station_service.get_station_details_with_status(db, station_id)
    if not details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
        
    forecasts = crud_forecast.get_forecast_by_station_id(db, station_id, hours)
    return forecasts

@router.put("/{station_id}")
def update_station(
    station_id: str,
    station_in: StationUpdate,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    updated = station_service.update_station_by_id(db, station_id, station_in.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
    return {
        "message": "Station updated successfully",
        "station": updated
    }

@router.get("/{station_id}/export")
def export_station_data(
    station_id: str,
    current_user: dict = Depends(get_authorized_exporter),
    db: Session = Depends(get_db)
):
    from fastapi.responses import PlainTextResponse
    import csv
    import io
    
    details = station_service.get_station_details_with_status(db, station_id)
    if not details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
    
    # Generate CSV of water levels
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["timestamp", "water_level_m"])
    
    for record in details.get("history", []):
        writer.writerow([record.get("timestamp"), record.get("current_level")])
        
    return PlainTextResponse(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=station_{station_id}_export.csv"}
    )
