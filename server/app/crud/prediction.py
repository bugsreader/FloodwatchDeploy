from sqlalchemy.orm import Session
from sqlalchemy import text, insert
from datetime import datetime
from typing import List, Dict, Any, Tuple
from app.models.prediction import FloodPrediction
from app.models.station import RiverStation

def get_latest_predictions(db: Session) -> List[Tuple]:
    """
    Fetch the latest prediction for every station.
    Uses PostgreSQL DISTINCT ON for performance.
    """
    query = db.query(
        FloodPrediction.id,
        FloodPrediction.station_id,
        FloodPrediction.prediction_time,
        FloodPrediction.flood_probability,
        FloodPrediction.threat_level,
        FloodPrediction.river_water_level_m,
        FloodPrediction.rainfall_1h_mm,
        FloodPrediction.rainfall_24_mm,
        FloodPrediction.model_version,
        FloodPrediction.created_at,
        RiverStation.station_name,
        RiverStation.latitude,
        RiverStation.longitude,
        RiverStation.latest_water_level_m.label("current_water_level_m")
    ).join(
        RiverStation, FloodPrediction.station_id == RiverStation.station_id
    ).distinct(
        FloodPrediction.station_id
    ).order_by(
        FloodPrediction.station_id, FloodPrediction.prediction_time.desc()
    )
    return query.all()

def get_prediction_history_by_station_id(db: Session, station_id: str, limit: int = 100) -> List[FloodPrediction]:
    """
    Fetch historical prediction records for a single station.
    """
    return db.query(FloodPrediction)\
        .filter(FloodPrediction.station_id == station_id)\
        .order_by(FloodPrediction.prediction_time.desc())\
        .limit(limit)\
        .all()

def get_map_predictions(db: Session) -> List[Tuple]:
    """
    Fetch a lightweight payload of predictions suitable for map markers.
    """
    query = db.query(
        FloodPrediction.station_id,
        RiverStation.latitude,
        RiverStation.longitude,
        FloodPrediction.flood_probability,
        FloodPrediction.threat_level,
        FloodPrediction.prediction_time
    ).join(
        RiverStation, FloodPrediction.station_id == RiverStation.station_id
    ).distinct(
        FloodPrediction.station_id
    ).order_by(
        FloodPrediction.station_id, FloodPrediction.prediction_time.desc()
    )
    return query.all()

def bulk_save_predictions(db: Session, prediction_dicts: List[Dict[str, Any]]) -> None:
    """
    Inserts a batch of prediction records.
    """
    if not prediction_dicts:
        return
    db.execute(insert(FloodPrediction).values(prediction_dicts))
    db.commit()

def get_prediction_candidates(db: Session, prediction_time: datetime) -> List[Dict[str, Any]]:
    """
    Query candidate stations and construct lag features.
    Matches the exact Node.js SQL script with lateral joins.
    """
    query_text = """
      SELECT
        s.station_id,
        s.station_name,
        s.latitude,
        s.longitude,
        
        -- Latest river water level
        r0.water_level_m AS river_water_level_m,
        
        -- Historical river water levels (lags)
        r1.water_level_m AS river_level_lag_1h,
        r2.water_level_m AS river_level_lag_2h,
        r3.water_level_m AS river_level_lag_3h,
        r6.water_level_m AS river_level_lag_6h,

        -- Weather forecast aggregations (sums)
        w_sums.rainfall_3h_mm,
        w_sums.rainfall_6h_mm,
        w_sums.rainfall_24h_mm,
        w_sums.cumulative_rainfall_3day_mm,
        
        -- Weather forecast lags
        w0.precipitation_mm AS rainfall_1h_mm,
        w1.precipitation_mm AS rainfall_1h_lag_1h,
        w2.precipitation_mm AS rainfall_1h_lag_2h
      FROM river_stations s
      
      -- River water level lags
      LEFT JOIN LATERAL (
        SELECT water_level_m FROM river_water_levels
        WHERE station_id = s.station_id AND created_at <= :pred_time
        ORDER BY created_at DESC LIMIT 1
      ) r0 ON true
      LEFT JOIN LATERAL (
        SELECT water_level_m FROM river_water_levels
        WHERE station_id = s.station_id AND created_at <= :pred_time - INTERVAL '1 hour'
        ORDER BY created_at DESC LIMIT 1
      ) r1 ON true
      LEFT JOIN LATERAL (
        SELECT water_level_m FROM river_water_levels
        WHERE station_id = s.station_id AND created_at <= :pred_time - INTERVAL '2 hour'
        ORDER BY created_at DESC LIMIT 1
      ) r2 ON true
      LEFT JOIN LATERAL (
        SELECT water_level_m FROM river_water_levels
        WHERE station_id = s.station_id AND created_at <= :pred_time - INTERVAL '3 hour'
        ORDER BY created_at DESC LIMIT 1
      ) r3 ON true
      LEFT JOIN LATERAL (
        SELECT water_level_m FROM river_water_levels
        WHERE station_id = s.station_id AND created_at <= :pred_time - INTERVAL '6 hour'
        ORDER BY created_at DESC LIMIT 1
      ) r6 ON true
      
      -- Weather forecast rolling sums
      LEFT JOIN LATERAL (
        SELECT 
          SUM(CASE WHEN forecast_time > :pred_time - INTERVAL '3 hours' THEN precipitation_mm ELSE 0 END) AS rainfall_3h_mm,
          SUM(CASE WHEN forecast_time > :pred_time - INTERVAL '6 hours' THEN precipitation_mm ELSE 0 END) AS rainfall_6h_mm,
          SUM(CASE WHEN forecast_time > :pred_time - INTERVAL '24 hours' THEN precipitation_mm ELSE 0 END) AS rainfall_24h_mm,
          SUM(CASE WHEN forecast_time > :pred_time - INTERVAL '72 hours' THEN precipitation_mm ELSE 0 END) AS cumulative_rainfall_3day_mm
        FROM weather_forecasts
        WHERE station_id = s.station_id AND forecast_time > :pred_time - INTERVAL '72 hours' AND forecast_time <= :pred_time
      ) w_sums ON true
      
      -- Weather forecast lags
      LEFT JOIN LATERAL (
        SELECT precipitation_mm FROM weather_forecasts
        WHERE station_id = s.station_id AND forecast_time <= :pred_time
        ORDER BY forecast_time DESC LIMIT 1
      ) w0 ON true
      LEFT JOIN LATERAL (
        SELECT precipitation_mm FROM weather_forecasts
        WHERE station_id = s.station_id AND forecast_time <= :pred_time - INTERVAL '1 hour'
        ORDER BY forecast_time DESC LIMIT 1
      ) w1 ON true
      LEFT JOIN LATERAL (
        SELECT precipitation_mm FROM weather_forecasts
        WHERE station_id = s.station_id AND forecast_time <= :pred_time - INTERVAL '2 hour'
        ORDER BY forecast_time DESC LIMIT 1
      ) w2 ON true
    """
    
    result = db.execute(text(query_text), {"pred_time": prediction_time})
    return [dict(row._mapping) for row in result.all()]
