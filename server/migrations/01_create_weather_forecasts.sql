CREATE TABLE IF NOT EXISTS weather_forecasts (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL,
    forecast_time TIMESTAMP WITH TIME ZONE NOT NULL,
    temperature_2m NUMERIC,
    relative_humidity_2m NUMERIC,
    precipitation_probability NUMERIC,
    precipitation_mm NUMERIC,
    rain_mm NUMERIC,
    showers_mm NUMERIC,
    weather_code INTEGER,
    wind_speed_10m NUMERIC,
    wind_direction_10mC NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_weather_station
        FOREIGN KEY (station_id)
        REFERENCES river_stations(station_id)
        ON DELETE CASCADE,
    CONSTRAINT uq_station_forecast_time
        UNIQUE (station_id, forecast_time)
);

CREATE INDEX IF NOT EXISTS idx_weather_forecasts_station_id ON weather_forecasts(station_id);
CREATE INDEX IF NOT EXISTS idx_weather_forecasts_forecast_time ON weather_forecasts(forecast_time);
