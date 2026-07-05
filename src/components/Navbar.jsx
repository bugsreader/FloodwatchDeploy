import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const Navbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const fetchPredictions = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_URL}/api/predictions/latest`, { headers });
        if (response.ok) {
          const data = await response.json();
          setPredictions(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch predictions for navbar', err);
      }
    };

    fetchPredictions();
    const intervalId = setInterval(fetchPredictions, 5 * 60 * 1000); // 5 min poll
    return () => clearInterval(intervalId);
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedPredictions = [...predictions].sort((a, b) => b.flood_probability - a.flood_probability);
  const highRiskStations = sortedPredictions.filter(
    p => ['Critical', 'Danger', 'Warning'].includes(p.threat_level) || p.flood_probability > 50
  );
  const hasHighRisk = highRiskStations.length > 0;
  const count = highRiskStations.length;

  return (
    <nav className="navbar navbar-expand-lg bg-body border-bottom shadow-sm px-3 px-md-4 py-3 sticky-top z-3">
      <div className="container-fluid p-0 d-flex flex-nowrap align-items-center justify-content-between">
        <div className="d-flex align-items-center flex-grow-1 flex-md-grow-0">
          <button 
            className="btn bg-body-secondary d-md-none me-3 p-2 d-flex align-items-center justify-content-center border-0 shadow-sm" 
            onClick={toggleSidebar}
            style={{width: '42px', height: '42px'}}
          >
            <i className="bi bi-list fs-4 text-secondary"></i>
          </button>
          
          <form className="d-none d-md-flex w-100 max-w-400">
            <div className="input-group bg-body-secondary rounded-pill">
              <span className="input-group-text bg-transparent border-0 pe-2 ps-3">
                <i className="bi bi-search text-body-secondary"></i>
              </span>
              <input 
                className="form-control bg-transparent border-0 shadow-none py-2 text-body" 
                type="search" 
                placeholder="Search locations, sensors..." 
                aria-label="Search" 
              />
            </div>
          </form>
        </div>

        {/* Right side items */}
        <div className="d-flex align-items-center gap-2 ms-auto" ref={dropdownRef}>
          {/* Notification Dropdown */}
          {user && (
            <div className="position-relative">
              <button 
                type="button" 
                className={`btn rounded-circle p-2 d-flex align-items-center justify-content-center border-0 bg-transparent text-secondary position-relative hover-bg-light`}
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ width: '42px', height: '42px' }}
                title="AI Notifications"
              >
                <i className={`bi ${hasHighRisk ? 'bi-bell-fill text-danger' : 'bi-bell'} fs-4`}></i>
                {count > 0 && (
                  <span className="position-absolute top-1 start-75 translate-middle badge rounded-pill bg-danger border border-white p-1" style={{ fontSize: '0.65rem' }}>
                    {count}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div 
                  className="position-absolute end-0 mt-2 bg-body border rounded-4 shadow-lg overflow-hidden" 
                  style={{ width: '320px', zIndex: 1050, transform: 'translateX(10px)' }}
                >
                  {/* Dropdown Header */}
                  <div className={`p-3 border-bottom d-flex align-items-center justify-content-between ${hasHighRisk ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                    <span className="fw-bold d-flex align-items-center gap-2">
                      <i className={`bi ${hasHighRisk ? 'bi-exclamation-triangle-fill' : 'bi-shield-check'} fs-5`}></i>
                      AI Decision Output
                    </span>
                    <span className="badge rounded-pill bg-dark bg-opacity-10 text-dark small" style={{ fontSize: '0.75rem' }}>6-12h</span>
                  </div>

                  {/* Dropdown Scrollable Content */}
                  <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                    {highRiskStations.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {highRiskStations.map(p => (
                          <button
                            key={p.station_id}
                            className="list-group-item list-group-item-action p-3 border-0 border-bottom text-start d-flex align-items-start gap-2 hover-bg-light"
                            onClick={() => {
                              setShowNotifications(false);
                              navigate(`/stations/${p.station_id}`);
                            }}
                          >
                            <i className="bi bi-droplet-fill text-danger fs-5 mt-1"></i>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-semibold text-truncate small" style={{ maxWidth: '160px' }} title={p.station_name || p.station_id}>
                                  {p.station_name || p.station_id}
                                </span>
                                <span className="badge bg-danger bg-opacity-10 text-danger fw-bold" style={{ fontSize: '0.7rem' }}>
                                  {p.flood_probability.toFixed(0)}% Risk
                                </span>
                              </div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                <i className="bi bi-clock me-1"></i> Predicted: {new Date(p.prediction_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' })}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted">
                        <i className="bi bi-shield-check text-success fs-1 mb-2 d-block opacity-50"></i>
                        <span className="fw-semibold text-success d-block small">All Monitored Rivers Safe</span>
                        <span className="small text-secondary" style={{ fontSize: '0.75rem' }}>No imminent flood risks detected.</span>
                      </div>
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  {user && ['Admin', 'Premium User', 'Emergency/Municipal Role'].includes(user.role || user.role_name) && (
                    <div className="p-2 border-top bg-light text-center">
                      <Link 
                        to="/route-planner" 
                        className="btn btn-sm btn-link text-primary text-decoration-none fw-bold small py-1"
                        onClick={() => setShowNotifications(false)}
                      >
                        Open Route Planner <i className="bi bi-arrow-right"></i>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User profile section */}
          {user && (
            <Link 
              to="/profile" 
              className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm"
              style={{ width: '42px', height: '42px', overflow: 'hidden' }}
              title="Profile"
            >
              <i className="bi bi-person-fill fs-5 text-secondary"></i>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
