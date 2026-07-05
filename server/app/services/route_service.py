import requests
import math
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Tuple
from app.models.station import RiverStation
from app.models.prediction import FloodPrediction
from app.utils.haversine import haversine

OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving"

def get_critical_hazards(db: Session) -> List[Dict[str, float]]:
    """Fetch all active Critical flood predictions and their coordinates."""
    stations = db.query(RiverStation).all()
    hazards = []
    
    for station in stations:
        latest_pred = db.query(FloodPrediction).filter(
            FloodPrediction.station_id == station.station_id
        ).order_by(FloodPrediction.prediction_time.desc()).first()
        
        if latest_pred and latest_pred.threat_level == "Critical":
            hazards.append({
                "station_id": station.station_id,
                "lat": float(station.latitude) if station.latitude is not None else 0.0,
                "lon": float(station.longitude) if station.longitude is not None else 0.0,
                "radius_km": 5.0 # Consider 5km around the station as impassable
            })
    return hazards

def fetch_osrm_route(coords: List[Tuple[float, float]]) -> Dict[str, Any]:
    """Fetch a route from OSRM given a list of (lat, lon) tuples."""
    # OSRM expects lon,lat;lon,lat
    coords_str = ";".join([f"{lon},{lat}" for lat, lon in coords])
    url = f"{OSRM_BASE_URL}/{coords_str}?overview=full&geometries=geojson"
    
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    data = response.json()
    
    if data.get("code") != "Ok" or not data.get("routes"):
        raise Exception("Failed to generate route from OSRM.")
        
    return data["routes"][0]

def is_route_safe(route: Dict[str, Any], hazards: List[Dict[str, float]]) -> bool:
    """
    Check if any point in the route falls within a hazard radius.
    Allows a grace distance of 2.0km from the start and end coordinates
    so that trips starting or ending near a hazard zone can still calculate detours.
    """
    geometry = route.get("geometry", {}).get("coordinates", [])
    if not geometry:
        return True
        
    start_lon, start_lat = geometry[0]
    end_lon, end_lat = geometry[-1]
    
    grace_dist_km = 2.0 # Allow 2km of travel to enter/exit a hazard zone
    
    for lon, lat in geometry:
        for hazard in hazards:
            dist = haversine(lat, lon, hazard["lat"], hazard["lon"])
            if dist <= hazard["radius_km"]:
                # Check if this point is near the start or end of the trip
                dist_to_start = haversine(lat, lon, start_lat, start_lon)
                dist_to_end = haversine(lat, lon, end_lat, end_lon)
                
                if dist_to_start <= grace_dist_km or dist_to_end <= grace_dist_km:
                    continue
                return False
    return True

def calculate_detour(start_lat: float, start_lon: float, hazard_lat: float, hazard_lon: float, distance_km: float = 10.0) -> Tuple[float, float]:
    """Calculate a simple detour point away from the hazard."""
    # Calculate vector from start to hazard
    dlon = hazard_lon - start_lon
    dlat = hazard_lat - start_lat
    
    # Calculate perpendicular vector (rotate 90 degrees) to push sideways instead of backwards
    perp_dlat = -dlon
    perp_dlon = dlat
    
    # Normalize
    length = math.sqrt(perp_dlat**2 + perp_dlon**2)
    if length == 0:
        return start_lat + 0.1, start_lon + 0.1
        
    dir_lat = perp_dlat / length
    dir_lon = perp_dlon / length
    
    # 1 degree is roughly 111km
    deg_offset = distance_km / 111.0
    
    detour_lat = hazard_lat + (dir_lat * deg_offset)
    detour_lon = hazard_lon + (dir_lon * deg_offset)
    
    return detour_lat, detour_lon

def get_safe_route(db: Session, start_lat: float, start_lon: float, end_lat: float, end_lon: float) -> Dict[str, Any]:
    """
    Generate a route prioritizing safety by bypassing Critical flood zones.
    Fulfills SDD 3.2.2 and SRS 4.2.
    """
    hazards = get_critical_hazards(db)
    
    # 1. Try direct route
    try:
        route = fetch_osrm_route([(start_lat, start_lon), (end_lat, end_lon)])
    except Exception as e:
        raise Exception(f"Routing engine error: {e}")
        
    if is_route_safe(route, hazards):
        return {
            "status": "safe",
            "message": "Direct route is safe.",
            "route": route,
            "hazards": hazards
        }
        
    # 2. Route is unsafe. Attempt to calculate a detour.
    # Find the first hazard we intersect
    intersected_hazard = None
    geometry = route.get("geometry", {}).get("coordinates", [])
    
    for hazard in hazards:
        for lon, lat in geometry:
            if haversine(lat, lon, hazard["lat"], hazard["lon"]) <= hazard["radius_km"]:
                intersected_hazard = hazard
                break
        if intersected_hazard:
            break
            
    if intersected_hazard:
        # Calculate vector from start to hazard center
        dlon = intersected_hazard["lon"] - start_lon
        dlat = intersected_hazard["lat"] - start_lat
        length = math.sqrt(dlat**2 + dlon**2)
        
        if length > 0:
            # We try both perpendicular directions (left and right of the path vector)
            dir_options = [
                (-dlon / length, dlat / length),  # Direction 1
                (dlon / length, -dlat / length)   # Direction 2
            ]
            
            # Try detour distances starting from a tight 7.0km up to 15.0km
            for dist_km in [7.0, 11.0, 15.0]:
                deg_offset = dist_km / 111.0
                safe_routes = []
                
                for dir_lat, dir_lon in dir_options:
                    detour_lat = intersected_hazard["lat"] + (dir_lat * deg_offset)
                    detour_lon = intersected_hazard["lon"] + (dir_lon * deg_offset)
                    
                    try:
                        # Request OSRM route passing through the detour waypoint
                        detour_route = fetch_osrm_route([
                            (start_lat, start_lon), 
                            (detour_lat, detour_lon), 
                            (end_lat, end_lon)
                        ])
                        
                        # Verify if this detour path is actually safe (does not cross any hazard zones)
                        if is_route_safe(detour_route, hazards):
                            safe_routes.append(detour_route)
                    except Exception:
                        continue
                
                # If we found safe routes at this distance level, choose the one with the shortest distance!
                if safe_routes:
                    shortest_route = min(safe_routes, key=lambda r: r.get("distance", float('inf')))
                    return {
                        "status": "rerouted",
                        "message": "Route altered to bypass Critical flood hazard.",
                        "route": shortest_route,
                        "hazards": hazards
                    }
            
            # Fallback: If no completely safe route is found, try the first detour option
            try:
                dir_lat, dir_lon = dir_options[0]
                deg_offset = 10.0 / 111.0
                detour_lat = intersected_hazard["lat"] + (dir_lat * deg_offset)
                detour_lon = intersected_hazard["lon"] + (dir_lon * deg_offset)
                detour_route = fetch_osrm_route([
                    (start_lat, start_lon), 
                    (detour_lat, detour_lon), 
                    (end_lat, end_lon)
                ])
                return {
                    "status": "rerouted",
                    "message": "Route altered to bypass Critical flood hazard (partial overlap).",
                    "route": detour_route,
                    "hazards": hazards
                }
            except Exception:
                pass
                            
    return {
        "status": "unsafe",
        "message": "No safe route could be calculated around the disaster zones.",
        "route": None,
        "hazards": hazards
    }
