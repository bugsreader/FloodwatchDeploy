import requests
import time
import os
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List, Optional, Tuple
from fastapi import HTTPException, status
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.station import RiverStation
from app.models.forecast import WeatherForecast
from app.crud import forecast as crud_forecast

# Scheduler state variables
_is_running = False
_last_run_time: Optional[datetime] = None
scheduler: Optional[BackgroundScheduler] = None

def process_batch(batch: List[RiverStation], forecast_days: int) -> List[Dict[str, Any]]:
    # Map coordinates
    lats = ",".join([f"{float(s.latitude):.6f}" for s in batch])
    lngs = ",".join([f"{float(s.longitude):.6f}" for s in batch])

    url = f"https://api.open-meteo.com/v1/forecast?latitude={lats}&longitude={lngs}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,showers,weather_code,wind_speed_10m,wind_direction_10m&forecast_days=1&timezone=GMT"
    
    response = requests.get(url, timeout=20)
    if not response.ok:
        raise Exception(f"Open-Meteo API returned status {response.status_code}")
        
    data = response.json()
    if not isinstance(data, list):
        data = [data]
        
    if len(data) != len(batch):
        raise Exception(f"Expected {len(batch)} results from Open-Meteo, but got {len(data)}")
        
    forecasts_to_save = []
    now = datetime.now(timezone.utc)
    
    for idx, forecast in enumerate(data):
        station = batch[idx]
        if not forecast or "hourly" not in forecast or "time" not in forecast["hourly"]:
            print(f"[OpenMeteo] Station {station.station_id} returned no hourly forecast.")
            continue
            
        hourly = forecast["hourly"]
        times = hourly["time"]
        
        for j, time_str in enumerate(times):
            # Format time string to ISO 8601 UTC
            formatted_time = time_str if time_str.endswith("Z") else f"{time_str}:00Z"
            # Parse datetime: Open-Meteo times are hourly e.g. "2026-06-07T00:00"
            # Remove 'Z' to parse or handle timezone manually
            clean_time_str = formatted_time.replace("Z", "+00:00")
            forecast_date = datetime.fromisoformat(clean_time_str)
            
            # Match forecast record closest to the current hour (within 30 minutes)
            diff_seconds = abs((forecast_date - now).total_seconds())
            if diff_seconds > 30 * 60:
                continue
                
            forecasts_to_save.append({
                "station_id": station.station_id,
                "forecast_time": forecast_date,
                "temperature_2m": float(hourly["temperature_2m"][j]) if hourly["temperature_2m"][j] is not None else None,
                "relative_humidity_2m": float(hourly["relative_humidity_2m"][j]) if hourly["relative_humidity_2m"][j] is not None else None,
                "precipitation_probability": float(hourly["precipitation_probability"][j]) if hourly["precipitation_probability"][j] is not None else None,
                "precipitation_mm": float(hourly["precipitation"][j]) if hourly["precipitation"][j] is not None else None,
                "rain_mm": float(hourly["rain"][j]) if hourly["rain"][j] is not None else None,
                "showers_mm": float(hourly["showers"][j]) if hourly["showers"][j] is not None else None,
                "weather_code": int(hourly["weather_code"][j]) if hourly["weather_code"][j] is not None else None,
                "wind_speed_10m": float(hourly["wind_speed_10m"][j]) if hourly["wind_speed_10m"][j] is not None else None,
                "wind_direction_10mC": float(hourly["wind_direction_10m"][j]) if hourly["wind_direction_10m"][j] is not None else None
            })
            break  # Only save the single current hour's weather record
            
    return forecasts_to_save

def process_batch_with_retry(batch: List[RiverStation], max_retries: int, forecast_days: int) -> List[Dict[str, Any]]:
    attempt = 0
    while attempt < max_retries:
        try:
            return process_batch(batch, forecast_days)
        except Exception as e:
            attempt += 1
            print(f"[OpenMeteo] Batch fetch failed (attempt {attempt}/{max_retries}) for stations: {', '.join([s.station_id for s in batch])}. Error: {e}")
            if attempt >= max_retries:
                raise e
            time.sleep(attempt)
    return []

def update_forecasts(db: Session) -> Dict[str, Any]:
    global _is_running, _last_run_time
    if _is_running:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Forecast update is already running"
        )
        
    _is_running = True
    
    try:
        # Load all river stations with coordinates
        stations = db.query(RiverStation).filter(
            RiverStation.latitude.isnot(None),
            RiverStation.longitude.isnot(None)
        ).all()
        
        print(f"[OpenMeteo] Found {len(stations)} stations with coordinates to process.")
        
        batch_size = settings.OPEN_METEO_BATCH_SIZE
        max_retries = settings.OPEN_METEO_MAX_RETRIES
        forecast_days = settings.OPEN_METEO_FORECAST_DAYS
        
        total_processed = 0
        total_saved_rows = 0
        
        # Process in batches
        for i in range(0, len(stations), batch_size):
            batch = stations[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(stations) + batch_size - 1) // batch_size
            
            print(f"[OpenMeteo] Processing batch {batch_num}/{total_batches} (stations {i + 1} to {min(i + batch_size, len(stations))})...")
            
            try:
                forecast_dicts = process_batch_with_retry(batch, max_retries, forecast_days)
                if forecast_dicts:
                    saved = crud_forecast.bulk_upsert_forecasts(db, forecast_dicts)
                    total_saved_rows += saved
                total_processed += len(batch)
            except Exception as batch_error:
                print(f"[OpenMeteo] Batch {batch_num} failed completely after retries. Falling back to individual processing.")
                
                # Fallback: process each station individually
                for station in batch:
                    station_retry = 0
                    station_success = False
                    while station_retry < max_retries and not station_success:
                        try:
                            print(f"[OpenMeteo] Retrying station {station.station_id} individually (attempt {station_retry + 1}/{max_retries})...")
                            forecast_dicts = process_batch([station], forecast_days)
                            if forecast_dicts:
                                saved = crud_forecast.bulk_upsert_forecasts(db, forecast_dicts)
                                total_saved_rows += saved
                            total_processed += 1
                            station_success = True
                        except Exception as station_error:
                            station_retry += 1
                            print(f"[OpenMeteo] Station {station.station_id} failed on retry {station_retry}/{max_retries}: {station_error}")
                            if station_retry >= max_retries:
                                print(f"[OpenMeteo] Station {station.station_id} failed permanently.")
                            else:
                                time.sleep(station_retry)
                                
            # Rate-limiting delay to avoid overwhelming Open-Meteo API
            time.sleep(0.1)
            
        print(f"[OpenMeteo] Weather forecast job complete. Processed {total_processed} stations, saved {total_saved_rows} forecast rows.")
        _last_run_time = datetime.now(timezone.utc)
        
        return {
            "success": True,
            "stationsProcessed": total_processed,
            "forecastRowsSaved": total_saved_rows
        }
    finally:
        _is_running = False

def scheduled_forecast_job():
    db = SessionLocal()
    try:
        print("[Scheduler] Running scheduled forecast update...")
        update_forecasts(db)
        print("[Scheduler] Scheduled forecast update completed successfully.")
    except Exception as e:
        print(f"[Scheduler] Scheduled forecast update failed: {e}")
    finally:
        db.close()

def start_scheduler() -> bool:
    global scheduler
    if scheduler and scheduler.running:
        return False
        
    if not scheduler:
        scheduler = BackgroundScheduler()
        
    cron_expr = settings.OPEN_METEO_CRON
    print(f"[Scheduler] Starting forecast scheduler with cron: \"{cron_expr}\"")
    
    scheduler.add_job(
        scheduled_forecast_job,
        trigger=CronTrigger.from_crontab(cron_expr),
        id="forecast_job",
        replace_existing=True
    )
    
    scheduler.start()
    return True

def stop_scheduler() -> bool:
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        scheduler = None
        print("[Scheduler] Forecast scheduler stopped.")
        return True
    return False

def get_scheduler_status(db: Session) -> Dict[str, Any]:
    is_scheduler_running = scheduler is not None and scheduler.running
    total_records = crud_forecast.get_total_forecast_records(db)
    
    last_db_update = db.query(func.max(WeatherForecast.created_at)).scalar()
    last_run = _last_run_time or last_db_update
    
    return {
        "enabled": is_scheduler_running,
        "isRunning": _is_running,
        "lastRunTime": last_run,
        "totalRecords": total_records
    }
