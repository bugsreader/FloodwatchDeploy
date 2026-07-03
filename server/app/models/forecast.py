from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, UniqueConstraint, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class WeatherForecast(Base):
    __tablename__ = "weather_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String(50), ForeignKey("river_stations.station_id", ondelete="CASCADE"), nullable=False, index=True)
    forecast_time = Column(DateTime(timezone=True), nullable=False, index=True)
    temperature_2m = Column(Numeric, nullable=True)
    relative_humidity_2m = Column(Numeric, nullable=True)
    precipitation_probability = Column(Numeric, nullable=True)
    precipitation_mm = Column(Numeric, nullable=True)
    rain_mm = Column(Numeric, nullable=True)
    showers_mm = Column(Numeric, nullable=True)
    weather_code = Column(Integer, nullable=True)
    wind_speed_10m = Column(Numeric, nullable=True)
    wind_direction_10mC = Column("wind_direction_10mc", Numeric, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    station = relationship("RiverStation", back_populates="forecasts")

    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint("station_id", "forecast_time", name="uq_station_forecast_time"),
    )
