from sqlalchemy.orm import Session
from sqlalchemy import or_, func, and_
from typing import Optional, List, Dict, Any, Tuple
from app.models.station import RiverStation, RiverWaterLevel

def get_stations(
    db: Session,
    *,
    page: int = 1,
    limit: int = 20,
    search: str = "",
    state: str = "",
    status: str = "",
    sortBy: str = "last_updated",
    sortOrder: str = "desc"
) -> Tuple[List[RiverStation], int]:
    query = db.query(RiverStation)

    # 1. Search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                RiverStation.station_name.ilike(search_pattern),
                RiverStation.district.ilike(search_pattern),
                RiverStation.station_id.ilike(search_pattern)
            )
        )

    # 2. State filter
    if state:
        query = query.filter(RiverStation.state == state)

    # 3. Status filter (SQL based)
    if status:
        if status == "Danger":
            query = query.filter(
                and_(
                    RiverStation.latest_water_level_m >= RiverStation.danger_threshold,
                    RiverStation.danger_threshold.isnot(None)
                )
            )
        elif status == "Warning":
            query = query.filter(
                and_(
                    RiverStation.latest_water_level_m >= RiverStation.warning_threshold,
                    RiverStation.latest_water_level_m < func.coalesce(RiverStation.danger_threshold, 9999),
                    RiverStation.warning_threshold.isnot(None)
                )
            )
        elif status == "Alert":
            query = query.filter(
                and_(
                    RiverStation.latest_water_level_m >= RiverStation.alert_threshold,
                    RiverStation.latest_water_level_m < func.coalesce(RiverStation.warning_threshold, 9999),
                    RiverStation.alert_threshold.isnot(None)
                )
            )
        elif status == "Normal":
            query = query.filter(
                or_(
                    RiverStation.latest_water_level_m < func.coalesce(
                        RiverStation.alert_threshold,
                        func.coalesce(
                            RiverStation.warning_threshold,
                            func.coalesce(RiverStation.danger_threshold, 9999)
                        )
                    ),
                    RiverStation.alert_threshold.is_(None)
                )
            )

    # 4. Total count before pagination
    total = query.count()

    # 5. Sorting
    sort_col = RiverStation.updated_at
    if sortBy == "latest_water_level":
        sort_col = RiverStation.latest_water_level_m
    elif sortBy == "station_name":
        sort_col = RiverStation.station_name

    # Apply sorting with order
    if sortOrder == "asc":
        if sortBy == "latest_water_level":
            query = query.order_by(sort_col.asc().nullslast())
        else:
            query = query.order_by(sort_col.asc())
    else:
        if sortBy == "latest_water_level":
            query = query.order_by(sort_col.desc().nullslast())
        else:
            query = query.order_by(sort_col.desc())

    # 6. Pagination
    offset = (page - 1) * limit
    stations = query.offset(offset).limit(limit).all()

    return stations, total

def get_station_by_id(db: Session, station_id: str) -> Optional[RiverStation]:
    return db.query(RiverStation).filter(RiverStation.station_id == station_id).first()

def get_station_water_levels(db: Session, station_id: str, limit: int = 100) -> List[RiverWaterLevel]:
    return db.query(RiverWaterLevel)\
        .filter(RiverWaterLevel.station_id == station_id)\
        .order_by(RiverWaterLevel.created_at.desc())\
        .limit(limit)\
        .all()

def update_station(db: Session, *, db_station: RiverStation, update_data: Dict[str, Any]) -> RiverStation:
    for field, value in update_data.items():
        if hasattr(db_station, field):
            setattr(db_station, field, value)
    
    db_station.updated_at = func.now()
    db.add(db_station)
    db.commit()
    db.refresh(db_station)
    return db_station

def upsert_station_water_level(db: Session, *, station_id: str, water_level_m: Optional[float]) -> RiverWaterLevel:
    db_level = RiverWaterLevel(station_id=station_id, water_level_m=water_level_m)
    db.add(db_level)
    db.commit()
    db.refresh(db_level)
    return db_level
