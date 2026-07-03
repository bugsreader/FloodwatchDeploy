from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from app.crud import prediction as crud_prediction
from app.ml.predict import predict_batch_features

def classify_threat_level(probability: float) -> str:
    """
    Classifies a flood probability score into a threat level.
    """
    if probability <= 25.0:
        return 'Low'
    if probability <= 50.0:
        return 'Moderate'
    if probability <= 75.0:
        return 'High'
    return 'Critical'

def generate_features_for_station(row: Dict[str, Any], prediction_time: datetime) -> Dict[str, Any]:
    """
    Validates and engineers features for a single station from PostgreSQL query row.
    """
    # 1. Validate coordinates (Removed because scraped live stations often lack lat/lon)
    # The ML model does not use coordinates as predictive features.

    # 2. Extract and impute missing historical data (useful for demo/new environments)
    # Parse inputs to float, falling back to current values if lags are missing
    river_water_level_m = float(row.get("river_water_level_m") or 0.0)
    river_level_lag_1h = float(row.get("river_level_lag_1h") if row.get("river_level_lag_1h") is not None else river_water_level_m)
    river_level_lag_2h = float(row.get("river_level_lag_2h") if row.get("river_level_lag_2h") is not None else river_water_level_m)
    river_level_lag_3h = float(row.get("river_level_lag_3h") if row.get("river_level_lag_3h") is not None else river_water_level_m)
    river_level_lag_6h = float(row.get("river_level_lag_6h") if row.get("river_level_lag_6h") is not None else river_water_level_m)

    rainfall_1h_mm = float(row.get("rainfall_1h_mm") or 0.0)
    rainfall_3h_mm = float(row.get("rainfall_3h_mm") or 0.0)
    rainfall_6h_mm = float(row.get("rainfall_6h_mm") or 0.0)
    rainfall_24h_mm = float(row.get("rainfall_24h_mm") or 0.0)
    cumulative_rainfall_3day_mm = float(row.get("cumulative_rainfall_3day_mm") or 0.0)
    rainfall_1h_lag_1h = float(row.get("rainfall_1h_lag_1h") or 0.0)
    rainfall_1h_lag_2h = float(row.get("rainfall_1h_lag_2h") or 0.0)

    # Derived features
    river_change_1h = river_water_level_m - river_level_lag_1h
    river_change_3h = river_water_level_m - river_level_lag_3h
    river_change_6h = river_water_level_m - river_level_lag_6h

    # Interactions
    rain_river_interaction_3h = rainfall_3h_mm * river_water_level_m
    rain_river_interaction_24h = rainfall_24h_mm * river_water_level_m

    # Temporal
    # In Node, dt = new Date(predictionTime); hour = dt.getHours(); month = dt.getMonth() + 1;
    # prediction_time is assumed to be timezone aware (UTC or Local)
    hour = prediction_time.hour
    month = prediction_time.month

    return {
        "station_id": row["station_id"],
        "rainfall_1h_mm": rainfall_1h_mm,
        "rainfall_3h_mm": rainfall_3h_mm,
        "rainfall_6h_mm": rainfall_6h_mm,
        "rainfall_24h_mm": rainfall_24h_mm,
        "cumulative_rainfall_3day_mm": cumulative_rainfall_3day_mm,
        "river_water_level_m": river_water_level_m,
        "river_level_lag_1h": river_level_lag_1h,
        "river_level_lag_2h": river_level_lag_2h,
        "rainfall_1h_lag_1h": rainfall_1h_lag_1h,
        "rainfall_1h_lag_2h": rainfall_1h_lag_2h,
        "river_change_1h": river_change_1h,
        "river_change_3h": river_change_3h,
        "river_change_6h": river_change_6h,
        "rain_river_interaction_3h": rain_river_interaction_3h,
        "rain_river_interaction_24h": rain_river_interaction_24h,
        "hour": hour,
        "month": month
    }

def run_prediction_job(db: Session, prediction_time: Optional[datetime] = None) -> Dict[str, Any]:
    if prediction_time is None:
        prediction_time = datetime.now(timezone.utc)
        
    print(f"[Prediction Job] Starting prediction run for timestamp: {prediction_time.isoformat()}")
    
    try:
        # 1. Fetch candidates from DB
        rows = crud_prediction.get_prediction_candidates(db, prediction_time)
        
        feature_list = []
        feature_map = {}
        skipped_count = 0
        
        # 2. Engineer features
        for row in rows:
            try:
                features = generate_features_for_station(row, prediction_time)
                feature_list.append(features)
                feature_map[row["station_id"]] = features
            except Exception as err:
                skipped_count += 1
                print(f"[Prediction Job] Skipped station {row['station_id']} ({row.get('station_name', 'Unknown')}): {err}")
                
        print(f"[Prediction Job] Processed {len(rows)} stations. Eligible: {len(feature_list)}, Skipped: {skipped_count}")
        
        if not feature_list:
            print("[Prediction Job] No eligible stations found for prediction.")
            return {"success": True, "predictionsCount": 0, "skippedCount": skipped_count}
            
        # 3. Call model prediction (in-process)
        predictions = predict_batch_features(feature_list)
        
        # 4. Save results to DB
        prediction_records = []
        model_version = '1.0.0'
        for pred in predictions:
            s_id = pred["station_id"]
            feat = feature_map.get(s_id)
            if not feat:
                continue
                
            current_level = feat["river_water_level_m"]
            prob = float(pred["probability"])
            rainfall_6h = feat["rainfall_6h_mm"]
            
            # Heuristic to estimate future numeric water level:
            # Combines current level, model's probability, and short-term rainfall forecast
            projected_change = ((prob - 25.0) / 100.0) * 2.0 + (rainfall_6h / 150.0)
            predicted_level = max(current_level * 0.8, current_level + projected_change)
            predicted_level = round(predicted_level, 2)
            
            prediction_records.append({
                "station_id": s_id,
                "prediction_time": prediction_time,
                "flood_probability": prob,
                "threat_level": pred["threat_level"],
                "river_water_level_m": predicted_level,
                "rainfall_1h_mm": feat["rainfall_1h_mm"],
                "rainfall_24_mm": feat["rainfall_24h_mm"],
                "model_version": model_version
            })
            
        if prediction_records:
            crud_prediction.bulk_save_predictions(db, prediction_records)
            
        print(f"[Prediction Job] Successfully saved {len(predictions)} predictions.")
        return {"success": True, "predictionsCount": len(predictions), "skippedCount": skipped_count}
    except Exception as e:
        print(f"[Prediction Job] Error running prediction job: {e}")
        raise e
