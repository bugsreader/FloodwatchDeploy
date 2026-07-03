import React, { useEffect, useState } from 'react';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AlertModal = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const checkProximity = () => {
      if (!navigator.geolocation) {
        console.warn("Geolocation is not supported by this browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/api/alerts/proximity`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          });

          if (res.ok) {
            const data = await res.json();
            setAlerts(data);
          }
        } catch (err) {
          console.error("Failed to fetch proximity alerts", err);
        }
      });
    };

    // Check immediately, then every 3 minutes
    checkProximity();
    const interval = setInterval(checkProximity, 180000);
    return () => clearInterval(interval);
  }, [user]);

  if (alerts.length === 0) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg rounded-4">
            <div className="modal-header bg-danger text-white border-0 rounded-top-4">
              <h5 className="modal-title fw-bold">
                <i className="bi bi-exclamation-octagon-fill me-2"></i>
                Critical Flood Hazard Detected!
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setAlerts([])}></button>
            </div>
            <div className="modal-body p-4">
              <p className="text-dark mb-4">
                You are currently within the hazard radius of the following Critical flood zones. Immediate action is advised.
              </p>
              
              <ul className="list-group list-group-flush mb-4">
                {alerts.map((alert, idx) => (
                  <li key={idx} className="list-group-item px-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{alert.station_name}</strong>
                        <div className="text-muted small">Threat: {alert.probability.toFixed(1)}%</div>
                      </div>
                      <span className="badge bg-danger rounded-pill">
                        {alert.distance_km} km away
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => { setAlerts([]); navigate('/dashboard'); }} 
                className="btn btn-danger w-100 py-2 rounded-pill fw-bold shadow-sm"
              >
                Evacuate via Safe Route
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AlertModal;
