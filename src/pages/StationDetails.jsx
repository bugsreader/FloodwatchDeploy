import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { useParams, Link } from 'react-router-dom';
import StationStatusBadge from '../components/StationStatusBadge';
import WaterLevelChart from '../components/WaterLevelChart';
import WeatherForecastChart from '../components/WeatherForecastChart';
import { useAuth } from '../context/AuthContext';

const StationDetails = () => {
  const { id } = useParams();
  const [stationData, setStationData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('water-level');
  const { user } = useAuth();

  const canExport = user && ['Emergency/Municipal Role', 'Premium User', 'Admin'].includes(user.role || user.role_name);

  const handleExport = () => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/stations/${id}/export`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `station_${id}_export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => console.error('Error exporting data:', err));
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const [stationRes, forecastRes, predictionsRes] = await Promise.all([
          fetch(`${API_URL}/api/stations/${id}`, { headers }),
          fetch(`${API_URL}/api/stations/${id}/forecast?hours=168`, { headers }),
          fetch(`${API_URL}/api/predictions/station/${id}?limit=10`, { headers })
        ]);

        if (stationRes.ok) {
          const sData = await stationRes.json();
          setStationData(sData);
        }

        if (forecastRes.ok) {
          const fData = await forecastRes.json();
          setForecastData(fData);
        }

        if (predictionsRes.ok) {
          const pData = await predictionsRes.json();
          setPredictions(pData);
        }
      } catch (error) {
        console.error('Error fetching station details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!stationData || !stationData.station) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="display-1 text-muted mb-3"><i className="bi bi-x-circle"></i></div>
        <h3>Station Not Found</h3>
        <p className="text-muted">The station you are looking for does not exist.</p>
        <Link to="/stations" className="btn btn-primary mt-3">Back to Stations</Link>
      </div>
    );
  }

  const { station, historicalLevels } = stationData;
  const thresholds = {
    normal: station.normal_threshold,
    alert: station.alert_threshold,
    warning: station.warning_threshold,
    danger: station.danger_threshold
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      <div className="d-flex align-items-center mb-4">
        <Link to="/stations" className="btn btn-light rounded-circle me-3">
          <i className="bi bi-arrow-left"></i>
        </Link>
        <div>
          <h2 className="fw-bold mb-1">{station.station_name}</h2>
          <p className="text-muted mb-0">{station.station_id} &bull; {station.district}, {station.state}</p>
        </div>
        
        {canExport && (
          <div className="ms-auto">
            <button onClick={handleExport} className="btn btn-outline-primary rounded-pill px-4 shadow-sm">
              <i className="bi bi-download me-2"></i>
              Export CSV
            </button>
          </div>
        )}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-4">
          <div className="card border-0 rounded-4 shadow-sm h-100">
            <div className="card-body p-4 text-center">
              <h5 className="text-muted mb-3">Current Status</h5>
              <div className="mb-4">
                <StationStatusBadge status={station.status} />
              </div>
              <h1 className="display-3 fw-bold text-primary mb-0">{station.latest_water_level_m || '-'}</h1>
              <p className="text-muted fs-5">Meters</p>
              <hr className="my-4" />
              <div className="text-start">
                <p className="mb-1"><strong className="text-dark">Basin:</strong> {station.basin}</p>
                <p className="mb-1"><strong className="text-dark">Sub Basin:</strong> {station.sub_basin}</p>
                <p className="mb-0"><strong className="text-dark">Last Updated:</strong> {station.updated_at ? new Date(station.updated_at).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 rounded-4 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
              <h5 className="fw-bold mb-0">Thresholds</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-6 col-md-3 text-center">
                  <div className="p-3 bg-success bg-opacity-10 rounded-3">
                    <p className="text-success mb-1 fw-semibold small">Normal</p>
                    <h4 className="text-success fw-bold mb-0">{station.normal_threshold || '-'}m</h4>
                  </div>
                </div>
                <div className="col-6 col-md-3 text-center">
                  <div className="p-3 bg-warning bg-opacity-10 rounded-3">
                    <p className="text-warning mb-1 fw-semibold small">Alert</p>
                    <h4 className="text-warning fw-bold mb-0">{station.alert_threshold || '-'}m</h4>
                  </div>
                </div>
                <div className="col-6 col-md-3 text-center">
                  <div className="p-3 bg-orange bg-opacity-10 rounded-3" style={{ backgroundColor: 'rgba(253, 126, 20, 0.1)' }}>
                    <p className="mb-1 fw-semibold small" style={{ color: '#fd7e14' }}>Warning</p>
                    <h4 className="fw-bold mb-0" style={{ color: '#fd7e14' }}>{station.warning_threshold || '-'}m</h4>
                  </div>
                </div>
                <div className="col-6 col-md-3 text-center">
                  <div className="p-3 bg-danger bg-opacity-10 rounded-3">
                    <p className="text-danger mb-1 fw-semibold small">Danger</p>
                    <h4 className="text-danger fw-bold mb-0">{station.danger_threshold || '-'}m</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 rounded-4 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom-0 pt-4 px-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              {activeTab === 'water-level' && <><i className="bi bi-graph-up text-primary"></i> Historical Water Levels</>}
              {activeTab === 'weather' && <><i className="bi bi-cloud-sun text-primary"></i> 7-Day Weather Forecast</>}
              {activeTab === 'predictions' && <><i className="bi bi-robot text-primary"></i> AI Flood Predictions</>}
            </h5>
            <ul className="nav nav-pills card-header-pills">
              <li className="nav-item">
                <button 
                  className={`nav-link rounded-pill px-3 py-1.5 ${activeTab === 'water-level' ? 'active' : ''}`}
                  onClick={() => setActiveTab('water-level')}
                >
                  <i className="bi bi-water me-1"></i> Water Levels
                </button>
              </li>
              <li className="nav-item ms-2">
                <button 
                  className={`nav-link rounded-pill px-3 py-1.5 ${activeTab === 'weather' ? 'active' : ''}`}
                  onClick={() => setActiveTab('weather')}
                >
                  <i className="bi bi-cloud-sun me-1"></i> Weather Forecast
                </button>
              </li>
              <li className="nav-item ms-2">
                <button 
                  className={`nav-link rounded-pill px-3 py-1.5 ${activeTab === 'predictions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('predictions')}
                >
                  <i className="bi bi-robot me-1"></i> AI Predictions
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="card-body p-4 pt-2">
          {activeTab === 'water-level' && (
            <WaterLevelChart data={historicalLevels} thresholds={thresholds} />
          )}
          {activeTab === 'weather' && (
            <WeatherForecastChart data={forecastData} />
          )}
          {activeTab === 'predictions' && (
            <div>
              {predictions.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                  <p>No AI predictions available for this station.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Expected Time</th>
                        <th>Predicted Level (m)</th>
                        <th>Probability</th>
                        <th>Threat Level</th>
                        <th>Generated At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.map(pred => (
                        <tr key={pred.id}>
                          <td><strong>{new Date(pred.prediction_time).toLocaleString()}</strong></td>
                          <td>{pred.river_water_level_m ? pred.river_water_level_m.toFixed(2) : 'N/A'}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">{pred.flood_probability.toFixed(1)}%</span>
                              <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                <div className={`progress-bar ${pred.flood_probability > 70 ? 'bg-danger' : pred.flood_probability > 40 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${pred.flood_probability}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              pred.threat_level === 'Critical' || pred.threat_level === 'Danger' ? 'bg-danger' : 
                              pred.threat_level === 'Warning' ? 'bg-orange' : 
                              pred.threat_level === 'Alert' ? 'bg-warning' : 'bg-success'
                            }`}>
                              {pred.threat_level}
                            </span>
                          </td>
                          <td className="text-muted small">{new Date(pred.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StationDetails;
