import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

const PredictionPanel = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch(`${API_URL}/api/predictions/latest`, { headers });
        if (!response.ok) throw new Error('Failed to fetch predictions');
        
        const data = await response.json();
        setPredictions(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
    const intervalId = setInterval(fetchPredictions, 5 * 60 * 1000); 
    return () => clearInterval(intervalId);
  }, []);

  if (loading && predictions.length === 0) {
    return (
      <div className="card shadow-sm border-0 mb-3" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
        <div className="card-body p-3 text-center">
          <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
          <span className="small text-muted">Analyzing AI Risk Models...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card shadow-sm border-0 mb-3 bg-danger text-white bg-opacity-75" style={{ backdropFilter: 'blur(10px)' }}>
        <div className="card-body p-3 text-center small">
          <i className="bi bi-exclamation-triangle-fill me-1"></i> AI Prediction Error: {error}
        </div>
      </div>
    );
  }

  // Sort by probability descending
  const sortedPredictions = [...predictions].sort((a, b) => b.flood_probability - a.flood_probability);
  
  const highRiskStations = sortedPredictions.filter(p => p.threat_level === 'Critical' || p.threat_level === 'Danger' || p.threat_level === 'Warning' || p.flood_probability > 50);
  const hasHighRisk = highRiskStations.length > 0;

  return (
    <div className={`card shadow border-0 mb-3 ${hasHighRisk ? 'bg-danger text-white' : 'bg-success text-white'} bg-opacity-75`} style={{ backdropFilter: 'blur(10px)' }}>
      <div className="card-body p-3">
        <h6 className="fw-bold mb-2 text-uppercase d-flex align-items-center">
          <i className={`bi ${hasHighRisk ? 'bi-exclamation-triangle-fill' : 'bi-shield-check'} me-2 fs-5`}></i>
          AI Decision Output (6-12h)
        </h6>
        
        <div>
          {hasHighRisk ? (
            <>
              <div className="fs-5 fw-bold mb-1">HIGH ALERT</div>
              <p className="small mb-2 opacity-75">
                Flash flood risk is elevated based on recent data. Evacuation readiness is recommended.
              </p>
            </>
          ) : (
            <>
              <div className="fs-5 fw-bold mb-1">ALL CLEAR</div>
              <p className="small mb-2 opacity-75">
                No imminent flash flood threats detected across monitored river stations for the next 6-12 hours.
              </p>
            </>
          )}
          
          <div className="bg-white bg-opacity-25 rounded p-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {sortedPredictions.map(p => {
              const isHighRisk = p.threat_level === 'Critical' || p.threat_level === 'Danger' || p.threat_level === 'Warning' || p.flood_probability > 50;
              return (
                <div key={p.station_id} className={`mb-2 border-bottom border-light pb-2 last-child-no-border ${!isHighRisk ? 'opacity-75' : ''}`}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small fw-bold text-truncate me-2" title={p.station_name || p.station_id}>{p.station_name || p.station_id}</span>
                    <span className={`badge bg-white fw-bold ${isHighRisk ? 'text-danger' : 'text-success'}`}>{p.flood_probability.toFixed(1)}% Risk</span>
                  </div>
                  <div className="small ps-2 border-start border-2 border-white">
                    <div><i className="bi bi-clock me-1"></i> Expected: {new Date(p.prediction_time).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: 'numeric' })}</div>
                    <div className="d-flex gap-3">
                      <span><i className="bi bi-droplet me-1"></i> Current: {p.current_water_level_m ? `${p.current_water_level_m}m` : 'N/A'}</span>
                      <span className={isHighRisk ? "fw-bold" : ""}><i className="bi bi-water me-1"></i> Peak: {p.river_water_level_m ? `${p.river_water_level_m}m` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionPanel;
