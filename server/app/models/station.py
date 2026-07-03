from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class RiverStation(Base):
    __tablename__ = "river_stations"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String(50), unique=True, nullable=False, index=True)
    station_name = Column(String(255), nullable=True)
    state = Column(String(100), nullable=True, index=True)
    district = Column(String(100), nullable=True)
    basin = Column(String(100), nullable=True)
    sub_basin = Column(String(100), nullable=True)
    latest_water_level_m = Column(Numeric, nullable=True)
    normal_threshold = Column(Numeric, nullable=True)
    alert_threshold = Column(Numeric, nullable=True)
    warning_threshold = Column(Numeric, nullable=True)
    danger_threshold = Column(Numeric, nullable=True)
    latitude = Column(Numeric, nullable=True)
    longitude = Column(Numeric, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    water_levels = relationship("RiverWaterLevel", back_populates="station", cascade="all, delete-orphan")
    forecasts = relationship("WeatherForecast", back_populates="station", cascade="all, delete-orphan")
    predictions = relationship("FloodPrediction", back_populates="station", cascade="all, delete-orphan")


class RiverWaterLevel(Base):
    __tablename__ = "river_water_levels"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String(50), ForeignKey("river_stations.station_id"), nullable=False, index=True)
    water_level_m = Column(Numeric, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    station = relationship("RiverStation", back_populates="water_levels")
