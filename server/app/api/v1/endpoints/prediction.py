from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.deps import get_current_user
from app.crud import prediction as crud_prediction
from app.schemas.prediction import LatestPredictionResponse, PredictionHistoryResponse, MapPredictionResponse

router = APIRouter()

@router.get("/latest", response_model=List[LatestPredictionResponse])
def get_latest_predictions(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = crud_prediction.get_latest_predictions(db)
    return results

@router.get("/station/{station_id}", response_model=List[PredictionHistoryResponse])
def get_prediction_history(
    station_id: str,
    limit: int = Query(100, ge=1),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = crud_prediction.get_prediction_history_by_station_id(db, station_id, limit)
    return results

@router.get("/map", response_model=List[MapPredictionResponse])
def get_map_predictions(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = crud_prediction.get_map_predictions(db)
    return results
