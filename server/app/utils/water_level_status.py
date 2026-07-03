from typing import Optional, Union, Dict

def calculate_water_level_status(level: Optional[Union[float, int]], thresholds: Dict[str, Optional[float]]) -> str:
    if level is None:
        return "Unknown"
    
    try:
        current = float(level)
    except (ValueError, TypeError):
        return "Unknown"
        
    danger = thresholds.get("danger")
    warning = thresholds.get("warning")
    alert = thresholds.get("alert")
    
    if danger is not None and current >= float(danger):
        return "Danger"
    if warning is not None and current >= float(warning):
        return "Warning"
    if alert is not None and current >= float(alert):
        return "Alert"
        
    return "Normal"
