# FloodWatch AI

FloodWatch is an autonomous AI-driven Early Warning System and Predictive Analytics Dashboard designed to monitor river water levels, forecast severe weather events, and predict flash floods in real-time. 

## Features
- **Live Automated Data Scraping**: Autonomously fetches real-time river water levels and 7-day weather forecasts every 15 minutes.
- **AI Prediction Engine**: Calculates precise flood probabilities and projects future numeric water levels based on incoming data.
- **Geofenced Alerts**: Automatically notifies users if they are within a 30km safety radius of a Critical flood hazard.
- **Intelligent Route Planning**: Real-time routing map that actively avoids and reroutes you around forecasted AI hazard zones.
- **Admin Management & Simulation**: Full user-role management system and built-in simulation tools to artificially trigger flood scenarios for testing and presentations.

---

## 🚀 Getting Started

The entire application is containerized with Docker, meaning you can spin up the frontend, backend, database, and background workers with a single command. No complex local setups required.

### Prerequisites
Make sure you have the following installed on your machine:
- **Docker Desktop** (or Docker Engine)
- **Docker Compose**
- Git (optional, for cloning)

### 1. Build and Run the Containers
Open your terminal in the root directory of this project (where the `docker-compose.yml` file is located) and run:

```bash
docker-compose up -d --build
```
*Note: This command will download the necessary PostgreSQL, Python, and Node images, install all dependencies, build the frontend, and start the system in detached (`-d`) mode.*

### 2. Seed the Database
Because it's a fresh database, you need to create the database tables and set up the default Administrator account so you can log in.

Run the seed script inside the running backend container:
```bash
docker exec -it floodwatch_backend python scripts/seed.py
```
*(If you are on Windows PowerShell and get an error with `-it`, simply use `docker exec floodwatch_backend python scripts/seed.py` without the `-it` flag).*

**Default Admin Login:**
- **Email:** admin@test.com
- **Password:** pass

### 3. Access the Application
Once the containers are running and the database is seeded, you can access the various parts of the system in your web browser:

- **FloodWatch Web App (Frontend):** [http://localhost:3000](http://localhost:3000)
- **Backend API Server:** [http://localhost:5000](http://localhost:5000) (For direct API interactions)
- **pgAdmin (Database Manager):** [http://localhost:5050](http://localhost:5050)
  - Login: `admin@floodwatch.com`
  - Password: `Admin123!`

---

## ⚙️ How the System Operates

Once the system boots up, the **Background Scheduler** instantly comes alive:
1. It performs an immediate scrape of the government public info flood portal.
2. It fetches weather predictions from the Open-Meteo API.
3. It pushes all data through the AI prediction engine to forecast floods.
4. It repeats this entire process automatically every 15 minutes.

### Simulating a Flood (For Presentations)
If you want to instantly see the map light up with Hazard Zones and test the 30km alert popups without waiting for a real-world natural disaster:
1. Log into the system using the Admin account (`admin@test.com`).
2. Go to the **Admin Dashboard** via the sidebar.
3. Click **"Clear Simulation"** to ensure a clean slate.
4. Click **"Trigger Simulation"**.
5. Go back to the main Dashboard or Route Planner and refresh the page. You will now see critical alerts, hazard radiuses drawn on the map, and dynamic routing bypassing the simulated danger zones.

---

## 🛠️ Architecture
- **Frontend**: React (Vite), React-Leaflet (Mapping), Bootstrap (UI), NGINX (Serving the built assets).
- **Backend**: FastAPI (Python), SQLAlchemy (ORM), APScheduler (Cron Jobs), XGBoost / Scikit-Learn (AI ML Models).
- **Database**: PostgreSQL 15.

## 🛑 Stopping the System
To shut down the application and stop the containers, run:
```bash
docker-compose down
```
*Note: Your database data is persisted in a local Docker volume. Running `docker-compose down` will not delete your users or scraped data.*
