CREATE TABLE IF NOT EXISTS flood_predictions (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL,
    prediction_time TIMESTAMP WITH TIME ZONE NOT NULL,
    flood_probability NUMERIC NOT NULL,
    threat_level VARCHAR(20) NOT NULL,
    river_water_level_m NUMERIC,
    rainfall_1h_mm NUMERIC,
    rainfall_24_mm NUMERIC,
    model_version VARCHAR(50) DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prediction_station
        FOREIGN KEY (station_id)
        REFERENCES river_stations(station_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_flood_predictions_station_id ON flood_predictions(station_id);
CREATE INDEX IF NOT EXISTS idx_flood_predictions_prediction_time ON flood_predictions(prediction_time);
-- Composite index to support fast retrieval of the latest prediction per station
CREATE INDEX IF NOT EXISTS idx_flood_predictions_station_time_desc ON flood_predictions(station_id, prediction_time DESC);
