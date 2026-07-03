from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import Optional
from app.models.scraper import ScraperJob

def create_scraper_job(db: Session, *, status: str = "running") -> ScraperJob:
    db_job = ScraperJob(status=status, started_at=func.now())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def update_scraper_job(
    db: Session,
    *,
    job_id: int,
    status: str,
    records_processed: int = 0,
    error_message: Optional[str] = None
) -> ScraperJob:
    db_job = db.query(ScraperJob).filter(ScraperJob.id == job_id).first()
    if db_job:
        db_job.status = status
        db_job.records_processed = records_processed
        db_job.error_message = error_message
        db_job.completed_at = func.now()
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
    return db_job

def get_latest_scraper_job(db: Session) -> Optional[ScraperJob]:
    return db.query(ScraperJob).order_by(ScraperJob.started_at.desc()).first()
