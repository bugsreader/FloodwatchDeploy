from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, get_current_admin
from app.services import scraper_service
from app.schemas.scraper import ScraperStatusResponse, ScraperRunResponse

router = APIRouter()

# Apply admin restriction to all scraper routes
@router.post("/run", response_model=ScraperRunResponse)
def run_scraper(
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        result = scraper_service.run_scraper(db)
        return {
            "message": "Scraper completed successfully",
            "data": result
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scraper failed: {str(e)}"
        )

@router.post("/enable")
def enable_scheduler(current_admin: dict = Depends(get_current_admin)):
    started = scraper_service.start_scheduler()
    if started:
        return {"message": "Scheduler enabled"}
    return {"message": "Scheduler is already enabled"}

@router.post("/simulate")
def trigger_simulation(
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    """
    Manually triggers a presentation simulation by injecting extreme weather data.
    """
    try:
        result = scraper_service.simulate_flood(db)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/clear-simulation")
def clear_simulation(
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    """
    Clears the fake simulation data and resets station water levels.
    """
    try:
        result = scraper_service.clear_simulation(db)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/disable")
def disable_scheduler(current_admin: dict = Depends(get_current_admin)):
    stopped = scraper_service.stop_scheduler()
    if stopped:
        return {"message": "Scheduler disabled"}
    return {"message": "Scheduler is already disabled"}

@router.get("/status", response_model=ScraperStatusResponse)
def get_status(
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return scraper_service.get_scheduler_status(db)
