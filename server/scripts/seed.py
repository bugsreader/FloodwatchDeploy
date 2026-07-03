import os
import sys
from sqlalchemy import text

# Add the server directory to python path to allow app imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.core.security import get_password_hash
from app.models.role import Role
from app.models.user import User
from app.models.station import RiverStation, RiverWaterLevel
from app.models.prediction import FloodPrediction
from app.models.scraper import ScraperJob

def seed_database():
    print("Connecting to database and dropping existing tables (matching original seed behavior)...")
    db = SessionLocal()
    try:
        # Drop all tables using SQL raw or metadata
        Base.metadata.drop_all(bind=engine)
        print("Existing tables dropped successfully.")
        
        # Create all tables
        print("Creating all tables and indexes...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
        
        # Create default roles exactly as defined in new SRS
        roles_data = [
            {"name": "Admin"},
            {"name": "Emergency/Municipal Role"},
            {"name": "General User"},
            {"name": "Premium User"}
        ]
        
        for role_data in roles_data:
            existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not existing_role:
                db.add(Role(**role_data))
        
        db.commit()
        
        # Get role IDs
        admin_role = db.query(Role).filter(Role.name == "Admin").first()
        emergency_role = db.query(Role).filter(Role.name == "Emergency/Municipal Role").first()
        general_role = db.query(Role).filter(Role.name == "General User").first()
        premium_role = db.query(Role).filter(Role.name == "Premium User").first()

        print("Roles seeded.")
        
        # Seed default Admin user
        print("Seeding Admin user...")
        hashed_password = get_password_hash("Admin123!")
        admin_user = User(
            name="System Admin",
            email="admin@floodwatch.local",
            password=hashed_password,
            role_id=admin_role.id
        )
        db.add(admin_user)
        
        # Seed default Emergency/Municipal Role user
        print("Seeding Emergency/Municipal user...")
        emergency_user = User(
            name="Emergency Response Team",
            email="emergency@floodwatch.local",
            password=hashed_password,
            role_id=emergency_role.id
        )
        db.add(emergency_user)
        
        # Seed default General user
        print("Seeding General user...")
        general_user = User(
            name="Normal Citizen",
            email="general@floodwatch.local",
            password=hashed_password,
            role_id=general_role.id
        )
        db.add(general_user)
        
        # Seed default Premium user
        print("Seeding Premium user...")
        premium_user = User(
            name="Premium Analyst",
            email="premium@floodwatch.local",
            password=hashed_password,
            role_id=premium_role.id
        )
        db.add(premium_user)
        
        db.commit()
        print("Admin user seeded (email: admin@floodwatch.local / password: Admin123!).")
        print("Emergency user seeded (email: emergency@floodwatch.local / password: Admin123!).")
        print("Database seeding completed successfully.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
