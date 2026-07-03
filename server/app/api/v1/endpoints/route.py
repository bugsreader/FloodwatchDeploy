from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_authorized_exporter
from app.services import route_service
from pydantic import BaseModel

router = APIRouter()

class RouteRequest(BaseModel):
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float

@router.post("/safe")
def calculate_safe_route(
    request: RouteRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_authorized_exporter)
):
    try:
        result = route_service.get_safe_route(
            db, 
            request.start_lat, 
            request.start_lon, 
            request.end_lat, 
            request.end_lon
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/hazards")
def get_current_hazards(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_authorized_exporter)
):
    try:
        hazards = route_service.get_critical_hazards(db)
        return {"hazards": hazards}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
