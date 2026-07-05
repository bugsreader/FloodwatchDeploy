import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config/api';
import { Link } from 'react-router-dom';

const PredictionPanel = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check risk levels (High or Critical predictions)
  const highRiskStations = predictions.filter(
    p => p.threat_level === 'Critical' || p.threat_level === 'Danger' || p.threat_level === 'Warning' || p.flood_probability > 50
  );
  const hasHighRisk = highRiskStations.length > 0;
  
  const sortedPredictions = [...predictions].sort((a, b) => b.flood_probability - a.flood_probability);

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Notification Bell Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-light rounded-circle border-0 p-2 position-relative d-flex align-items-center justify-content-center shadow-sm"
        style={{ width: '42px', height: '42px' }}
      >
        <i className={`bi ${hasHighRisk ? 'bi-bell-fill text-danger' : 'bi-bell text-secondary'} fs-5`}></i>
        {hasHighRisk && (
          <span className="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle pulse-animation">
            <span className="visually-hidden">New alerts</span>
          </span>
        )}
      </button>

      {/* Notification Dropdown Menu */}
      {isOpen && (
        <div 
          className="position-absolute end-0 mt-2 bg-white rounded-4 shadow-lg border border-secondary-subtle py-2 overflow-hidden z-3" 
          style={{ width: '360px', maxWidth: '90vw' }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center bg-light">
            <h6 className="fw-bold mb-0 text-dark small text-uppercase tracking-wider">
              <i className="bi bi-robot text-primary me-2"></i>AI Risk Analysis (6-12h)
            </h6>
            {hasHighRisk ? (
              <span className="badge bg-danger rounded-pill">High Alert</span>
            ) : (
              <span className="badge bg-success rounded-pill">All Clear</span>
            )}
          </div>

          {/* List Area */}
          <div className="overflow-auto" style={{ maxHeight: '350px' }}>
            {loading && predictions.length === 0 ? (
              <div className="p-4 text-center">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                <span className="small text-muted">Running AI Risk Models...</span>
              </div>
            ) : error ? (
              <div className="p-3 text-center text-danger small">
                <i className="bi bi-exclamation-triangle-fill me-1"></i> Prediction Error: {error}
              </div>
            ) : sortedPredictions.length === 0 ? (
              <div className="p-4 text-center text-muted small">
                No active prediction data.
              </div>
            ) : (
              sortedPredictions.map(p => {
                const isHighRisk = p.threat_level === 'Critical' || p.threat_level === 'Danger' || p.threat_level === 'Warning' || p.flood_probability > 50;
                return (
                  <Link 
                    key={p.station_id} 
                    to={`/stations/${p.station_id}`}
                    onClick={() => setIsOpen(false)}
                    className="d-block px-3 py-2.5 border-bottom text-decoration-none hover-notification transition-colors"
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small fw-bold text-dark text-truncate me-2" title={p.station_name || p.station_id}>
                        {p.station_name || p.station_id}
                      </span>
                      <span className={`badge ${isHighRisk ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'} rounded-pill fw-bold`}>
                        {p.flood_probability.toFixed(1)}% Risk
                      </span>
                    </div>
                    <div className="ps-2 border-start border-2 border-secondary-subtle" style={{ fontSize: '0.75rem' }}>
                      <div className="text-muted"><i className="bi bi-clock me-1"></i> Prediction: {new Date(p.prediction_time).toLocaleTimeString(undefined, { weekday: 'short', hour: 'numeric', minute: 'numeric' })}</div>
                      <div className="text-muted"><i className="bi bi-droplet-half me-1"></i> Peak Level: {p.river_water_level_m ? `${p.river_water_level_m}m` : 'N/A'}</div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          
          {/* Footer */}
          <div className="px-3 py-2 text-center border-top bg-light">
            <Link to="/stations" onClick={() => setIsOpen(false)} className="text-primary small fw-bold text-decoration-none">
              View All Stations <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionPanel;
