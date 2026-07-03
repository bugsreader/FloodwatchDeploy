import requests
from bs4 import BeautifulSoup
import urllib3
import time
import os
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import func
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.scraper import ScraperJob
from app.models.station import RiverStation, RiverWaterLevel
from app.crud import scraper as crud_scraper

# Disable insecure request warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL = "https://publicinfobanjir.water.gov.my/aras-air/?lang=en"
API_URL_TEMPLATE = "https://publicinfobanjir.water.gov.my/index.php/aras-air/data-paras-air/aras-air-data/?state={state}&district=ALL&station=ALL"

HEADERS = {
    'User-Agent': 'UniversityStudentResearch/1.0 (Contact: 2025627598@student.uitm.edu.my; Non-Commercial Academic Project)'
}

# State variables for scheduler status
_is_running = False
_last_run_time: Optional[datetime] = None
scheduler: Optional[BackgroundScheduler] = None

def get_state_codes() -> Dict[str, str]:
    try:
        response = requests.get(BASE_URL, verify=False, timeout=15, headers=HEADERS)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"[Scraper] Error fetching base page: {e}")
        return {}

    soup = BeautifulSoup(response.text, 'html.parser')
    state_codes = {}
    
    tables = soup.find_all('table')
    if not tables:
        return {}
        
    for row in tables[0].find_all('tr'):
        data_href = row.get('data-href', '')
        if '?state=' in data_href:
            state_code = data_href.split('?state=')[1].split('&')[0]
            cells = row.find_all(['td', 'th'])
            if len(cells) > 1:
                state_name = cells[1].text.strip()
                state_codes[state_code] = state_name
                
    return state_codes

def get_water_levels_for_state(state_code: str, state_name: str) -> List[Dict[str, Any]]:
    url = API_URL_TEMPLATE.format(state=state_code)
    try:
        response = requests.get(url, verify=False, timeout=15, headers=HEADERS)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"[Scraper] Error fetching data for {state_name} ({state_code}): {e}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    table = soup.find('table', id='normaltable1')
    if not table:
        print(f"[Scraper] Could not find data table for {state_name}")
        return []
        
    rows = table.find_all('tr')
    data_rows = rows[3:]
    
    station_data_list = []
    
    for row in data_rows:
        cells = [cell.text.strip() for cell in row.find_all(['td', 'th'])]
        if len(cells) >= 12:
            station_data = {
                "state": state_name,
                "station_id": cells[1],
                "station_name": cells[2],
                "district": cells[3],
                "basin": cells[4],
                "sub_basin": cells[5],
                "last_updated": cells[6],
                "water_level_m": cells[7],
                "thresholds": {
                    "normal": cells[8],
                    "alert": cells[9],
                    "warning": cells[10],
                    "danger": cells[11]
                }
            }
            station_data_list.append(station_data)
            
    return station_data_list

def parse_float(val: Any) -> Optional[float]:
    try:
        return float(val)
    except (ValueError, TypeError):
        return None

def run_scraper(db: Session) -> Dict[str, Any]:
    global _is_running, _last_run_time
    if _is_running:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Scraper is already running"
        )
        
    _is_running = True
    db_job = crud_scraper.create_scraper_job(db, status="running")
    
    try:
        print("[Scraper] Fetching state codes...")
        state_codes = get_state_codes()
        print(f"[Scraper] Found {len(state_codes)} states.")
        
        all_data = []
        for state_code, state_name in state_codes.items():
            print(f"[Scraper] Fetching data for {state_name} ({state_code})...")
            state_data = get_water_levels_for_state(state_code, state_name)
            all_data.extend(state_data)
            # Gentle delay to avoid rate limits
            time.sleep(1)
            
        print(f"[Scraper] Total stations scraped: {len(all_data)}")
        
        processed_count = 0
        unique_stations = {}
        levels_to_insert = []
        
        for row in all_data:
            s_id = row.get('station_id')
            if not s_id or not s_id.strip():
                continue
                
            s_id = s_id.strip()
            water_level = parse_float(row.get('water_level_m'))
            
            unique_stations[s_id] = {
                "station_id": s_id,
                "station_name": row.get('station_name', '').strip(),
                "state": row.get('state', '').strip(),
                "district": row.get('district', '').strip(),
                "basin": row.get('basin', '').strip(),
                "sub_basin": row.get('sub_basin', '').strip(),
                "latest_water_level_m": water_level,
                "normal_threshold": parse_float(row.get('thresholds', {}).get('normal')),
                "alert_threshold": parse_float(row.get('thresholds', {}).get('alert')),
                "warning_threshold": parse_float(row.get('thresholds', {}).get('warning')),
                "danger_threshold": parse_float(row.get('thresholds', {}).get('danger')),
                "updated_at": func.now()
            }
            
            levels_to_insert.append({
                "station_id": s_id,
                "water_level_m": water_level,
                "created_at": func.now()
            })
            processed_count += 1
            
        stations_to_upsert = list(unique_stations.values())
            
        if stations_to_upsert:
            # PostgreSQL batch upsert for stations
            stmt = pg_insert(RiverStation).values(stations_to_upsert)
            update_dict = {
                "station_name": stmt.excluded.station_name,
                "state": stmt.excluded.state,
                "district": stmt.excluded.district,
                "basin": stmt.excluded.basin,
                "sub_basin": stmt.excluded.sub_basin,
                "latest_water_level_m": stmt.excluded.latest_water_level_m,
                "normal_threshold": stmt.excluded.normal_threshold,
                "alert_threshold": stmt.excluded.alert_threshold,
                "warning_threshold": stmt.excluded.warning_threshold,
                "danger_threshold": stmt.excluded.danger_threshold,
                "updated_at": func.now()
            }
            upsert_stmt = stmt.on_conflict_do_update(
                index_elements=["station_id"],
                set_=update_dict
            )
            db.execute(upsert_stmt)
            
            # Batch insert for water levels
            db.execute(pg_insert(RiverWaterLevel).values(levels_to_insert))
            db.commit()
            
        crud_scraper.update_scraper_job(
            db,
            job_id=db_job.id,
            status="completed",
            records_processed=processed_count
        )
        _last_run_time = datetime.now(timezone.utc)
        
        # Trigger ML predictions asynchronously or synchronously in-process
        # Import prediction service inside the function to avoid circular imports
        from app.services.prediction_service import run_prediction_job
        try:
            print("[Scraper] Running flood prediction job after successful scrape...")
            run_prediction_job(db)
        except Exception as pred_err:
            print(f"[Scraper] Prediction job failed: {pred_err}")
            
        return {
            "success": True,
            "recordsProcessed": processed_count,
            "output": f"Successfully saved {processed_count} records to database."
        }
    except Exception as e:
        print(f"[Scraper] Scraper execution failed: {e}")
        db.rollback()
        crud_scraper.update_scraper_job(
            db,
            job_id=db_job.id,
            status="failed",
            error_message=str(e)
        )
        raise e
    finally:
        _is_running = False

def scheduled_scraper_job():
    """
    Wrapper for scheduled cron scraping.
    Initializes its own database session.
    """
    db = SessionLocal()
    try:
        print("[Scheduler] Running scheduled scraper...")
        run_scraper(db)
        print("[Scheduler] Scheduled scraper completed successfully.")
    except Exception as e:
        print(f"[Scheduler] Scheduled scraper failed: {e}")
    finally:
        db.close()

def start_scheduler() -> bool:
    global scheduler
    if scheduler and scheduler.running:
        return False
        
    if not scheduler:
        scheduler = BackgroundScheduler()
        
    # Schedule scraper job every 15 minutes, but trigger immediately on startup
    scheduler.add_job(
        scheduled_scraper_job,
        trigger=CronTrigger(minute="*/15"),
        id="scraper_job",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc)
    )
    
    scheduler.start()
    print("[Scheduler] Scraper scheduler started (interval: every 15 minutes).")
    return True

def stop_scheduler() -> bool:
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        scheduler = None
        print("[Scheduler] Scraper scheduler stopped.")
        return True
    return False

def get_scheduler_status(db: Session) -> Dict[str, Any]:
    latest_job = crud_scraper.get_latest_scraper_job(db)
    
    # Map running status
    is_scheduler_running = scheduler is not None and scheduler.running
    
    last_run = _last_run_time
    if latest_job and not last_run:
        last_run = latest_job.started_at
        
    return {
        "enabled": is_scheduler_running,
        "isRunning": _is_running,
        "lastRunTime": last_run,
        "nextRunTime": "every 15 minutes" if is_scheduler_running else None
    }

def simulate_flood(db: Session) -> Dict[str, Any]:
    from app.models.forecast import WeatherForecast
    from app.services.prediction_service import run_prediction_job
    
    # 1. Fetch 3 random stations
    stations = db.query(RiverStation).limit(3).all()
    if not stations:
        raise Exception("No stations found in the database. Please run the normal scraper first.")
        
    for station in stations:
        # 2. Inject extreme water levels (danger_threshold + 2.0)
        danger = float(station.danger_threshold) if station.danger_threshold else 5.0
        extreme_level = danger + 2.0
        
        station.latest_water_level_m = extreme_level
        
        # Ensure station has coordinates so alerts and routing work in demo
        if station.latitude is None or station.longitude is None:
            # Mock coordinates around KL
            station.latitude = 3.1390 + (0.05 * (len(stations) - stations.index(station)))
            station.longitude = 101.6869 + (0.05 * (len(stations) - stations.index(station)))
            
        db.add(RiverWaterLevel(
            station_id=station.station_id,
            water_level_m=extreme_level,
            created_at=func.now()
        ))
        
        # 3. Inject extreme weather forecasts
        db.query(WeatherForecast).filter(WeatherForecast.station_id == station.station_id).delete()
        db.add(WeatherForecast(
            station_id=station.station_id,
            precipitation_mm=100.0,
            rain_mm=100.0,
            temperature_2m=25.0,
            relative_humidity_2m=95.0,
            forecast_time=func.now()
        ))
        
        # 4. Directly inject a CRITICAL flood prediction to guarantee alerts for the demo
        from app.models.prediction import FloodPrediction
        db.query(FloodPrediction).filter(FloodPrediction.station_id == station.station_id).delete()
        db.add(FloodPrediction(
            station_id=station.station_id,
            prediction_time=func.now(),
            flood_probability=95.5,
            threat_level="Critical",
            river_water_level_m=extreme_level + 1.25, # Show that it will rise even further
            rainfall_1h_mm=100.0,
            rainfall_24_mm=250.0,
            model_version="demo-simulation",
            created_at=func.now()
        ))
        
    db.commit()
    
    return {
        "success": True,
        "message": f"Successfully simulated critical flood data and alerts for {len(stations)} stations.",
        "stations": [s.station_id for s in stations]
    }

def clear_simulation(db: Session) -> Dict[str, Any]:
    from app.models.prediction import FloodPrediction
    
    # 1. Delete all fake predictions
    deleted_preds = db.query(FloodPrediction).filter(FloodPrediction.model_version == "demo-simulation").delete()
    
    # 2. To fully reset, we can reset station water levels to their normal threshold
    stations = db.query(RiverStation).all()
    for station in stations:
        if station.normal_threshold is not None:
            station.latest_water_level_m = float(station.normal_threshold) - 0.5
            
    db.commit()
    
    return {
        "success": True,
        "message": f"Successfully cleared simulation data. Removed {deleted_preds} simulated alerts and reset station levels."
    }
