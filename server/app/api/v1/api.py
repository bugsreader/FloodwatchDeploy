from fastapi import APIRouter
from app.api.v1.endpoints import auth, user, station, prediction, scraper, openmeteo

api_router = APIRouter()
from fastapi import APIRouter
from app.api.v1.endpoints import auth, user, station, prediction, scraper, openmeteo, alert, route

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(user.router, prefix="/users", tags=["users"])
api_router.include_router(station.router, prefix="/stations", tags=["stations"])
api_router.include_router(prediction.router, prefix="/predictions", tags=["predictions"])
api_router.include_router(scraper.router, prefix="/scraper", tags=["scraper"])
api_router.include_router(openmeteo.router, prefix="/open-meteo", tags=["open-meteo"])
api_router.include_router(alert.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(route.router, prefix="/routes", tags=["routes"])
