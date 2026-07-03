from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class FloodPrediction(Base):
    __tablename__ = "flood_predictions"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String(50), ForeignKey("river_stations.station_id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_time = Column(DateTime(timezone=True), nullable=False, index=True)
    flood_probability = Column(Numeric, nullable=False)
    threat_level = Column(String(20), nullable=False)
    river_water_level_m = Column(Numeric, nullable=True)
    rainfall_1h_mm = Column(Numeric, nullable=True)
    rainfall_24_mm = Column(Numeric, nullable=True)
    model_version = Column(String(50), server_default="1.0.0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    station = relationship("RiverStation", back_populates="predictions")

    # Indexes
    __table_args__ = (
        Index("idx_flood_predictions_station_time_desc", "station_id", prediction_time.desc()),
    )
