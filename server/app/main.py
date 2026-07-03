from fastapi import FastAPI, Depends, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.db.session import get_db, engine
from app.api.v1.api import api_router
from app.services import openmeteo_service, scraper_service
from app.models.station import RiverStation

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    if settings.OPEN_METEO_CRON_ENABLED:
        try:
            print("[Lifespan] Starting forecast scheduler...")
            openmeteo_service.start_scheduler()
        except Exception as e:
            print(f"[Lifespan] Failed to start forecast scheduler: {e}")
            
    yield
    
    # Shutdown actions
    try:
        print("[Lifespan] Stopping forecast scheduler...")
        openmeteo_service.stop_scheduler()
    except Exception as e:
        print(f"[Lifespan] Failed to stop forecast scheduler: {e}")
        
    try:
        print("[Lifespan] Stopping scraper scheduler...")
        scraper_service.stop_scheduler()
    except Exception as e:
        print(f"[Lifespan] Failed to stop scraper scheduler: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# CORS configurations matching original Express logic
# Allow credentials and resolve origin matches
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core v1 routers
app.include_router(api_router, prefix="/api")

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # DB Connection check
        db_check = db.execute(text("SELECT 1 AS ok")).first()
        is_db_connected = db_check.ok == 1 if db_check else False
        
        # Query total and coordinate stations
        total_stations = db.query(RiverStation).count()
        coords_stations = db.query(RiverStation).filter(
            RiverStation.latitude.isnot(None),
            RiverStation.longitude.isnot(None)
        ).count()
        
        # Scraper status metrics
        scraper_status = scraper_service.get_scheduler_status(db)
        
        return {
            "server": "online",
            "database": "connected" if is_db_connected else "disconnected",
            "scraper": {
                "status": "running" if scraper_status["isRunning"] else "idle",
                "last_run": scraper_status["lastRunTime"]
            },
            "stations": {
                "total": total_stations,
                "with_coordinates": coords_stations
            }
        }
    except Exception as e:
        print(f"[Health Check] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "server": "online",
                "database": "disconnected",
                "scraper": {"status": "error", "last_run": None},
                "stations": {"total": 0, "with_coordinates": 0},
                "error": str(e)
            }
        )
