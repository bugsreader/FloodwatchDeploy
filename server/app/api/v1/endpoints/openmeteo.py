from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, get_current_admin
from app.services import openmeteo_service
from app.schemas.scraper import OpenMeteoStatusResponse

router = APIRouter()

@router.post("/run")
def run_forecast(
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        result = openmeteo_service.update_forecasts(db)
        return {
            "message": "Weather forecast updated successfully",
            "data": result
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast update failed: {str(e)}"
        )

@router.post("/enable")
def enable_scheduler(current_admin: dict = Depends(get_current_admin)):
    started = openmeteo_service.start_scheduler()
    if started:
        return {"message": "Forecast scheduler enabled successfully"}
    return {"message": "Forecast scheduler is already enabled"}

@router.post("/disable")
def disable_scheduler(current_admin: dict = Depends(get_current_admin)):
    stopped = openmeteo_service.stop_scheduler()
    if stopped:
        return {"message": "Forecast scheduler disabled successfully"}
    return {"message": "Forecast scheduler is already disabled"}

@router.get("/status", response_model=OpenMeteoStatusResponse)
def get_status(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return openmeteo_service.get_scheduler_status(db)
