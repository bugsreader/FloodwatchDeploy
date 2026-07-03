import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const { user } = useAuth();
  
  // Scraper State
  const [scraperStatus, setScraperStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Forecast Scheduler State
  const [forecastStatus, setForecastStatus] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastActionLoading, setForecastActionLoading] = useState(false);
  const [forecastMessage, setForecastMessage] = useState({ type: '', text: '' });

  // Common Health Overview State
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const fetchHealth = async () => {
    try {
      setHealthLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/health`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
      }
    } catch (error) {
      console.error('Failed to fetch system health', error);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/scraper/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setScraperStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch scraper status', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForecastStatus = async () => {
    try {
      setForecastLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/open-meteo/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setForecastStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch forecast scheduler status', error);
    } finally {
      setForecastLoading(false);
    }
  };

  const fetchAll = () => {
    fetchStatus();
    fetchForecastStatus();
    fetchHealth();
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      fetchAll();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleScraperAction = async (action) => {
    try {
      setActionLoading(true);
      setMessage({ type: '', text: '' });
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/scraper/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Action successful' });
        fetchStatus();
      } else {
        setMessage({ type: 'danger', text: data.error || 'Action failed' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Network error or server unavailable' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleForecastAction = async (action) => {
    try {
      setForecastActionLoading(true);
      setForecastMessage({ type: '', text: '' });
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/open-meteo/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setForecastMessage({ type: 'success', text: data.message || 'Action successful' });
        fetchForecastStatus();
      } else {
        setForecastMessage({ type: 'danger', text: data.error || 'Action failed' });
      }
    } catch (error) {
      setForecastMessage({ type: 'danger', text: 'Network error or server unavailable' });
    } finally {
      setForecastActionLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (!window.confirm("WARNING: This will inject synthetic extreme weather data into the database to trigger an immediate Critical flood alert for presentation purposes. Proceed?")) return;
    try {
      setActionLoading(true);
      setMessage({ type: '', text: '' });
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/scraper/simulate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Simulation triggered successfully' });
      } else {
        setMessage({ type: 'danger', text: data.detail || 'Simulation failed' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Network error or server unavailable' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold mb-0">
            <i className="bi bi-shield-lock-fill me-2 text-primary"></i>Admin Dashboard
          </h2>
          <p className="text-muted">Manage system settings, scraper runs, and forecast schedulers.</p>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="alert alert-info border-0 bg-info-subtle text-info-emphasis d-flex align-items-center mb-0 rounded-4">
            <i className="bi bi-info-circle-fill fs-4 me-3"></i>
            <div>
              <strong>Welcome, {user?.name}!</strong> You have administrative privileges.
            </div>
          </div>
        </div>
      </div>

      {/* System Health Overview Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 bg-body">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="card-title fw-bold mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-activity text-primary"></i> System Health Overview
                </h5>
                <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={fetchAll} disabled={healthLoading}>
                  {healthLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-arrow-clockwise"></i>} Refresh All
                </button>
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <div className="card bg-light border-0 h-100 rounded-4">
                    <div className="card-body p-3">
                      <div className="text-muted small fw-semibold mb-1 text-uppercase">Server Status</div>
                      <div className="d-flex align-items-center">
                        {healthData?.server === 'online' ? (
                          <><span className="d-inline-block rounded-circle bg-success me-2 shadow-sm" style={{width: '10px', height: '10px'}}></span> <span className="fw-bold fs-5">Online</span></>
                        ) : (
                          <><span className="d-inline-block rounded-circle bg-danger me-2 shadow-sm" style={{width: '10px', height: '10px'}}></span> <span className="fw-bold fs-5 text-danger">Offline</span></>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card bg-light border-0 h-100 rounded-4">
                    <div className="card-body p-3">
                      <div className="text-muted small fw-semibold mb-1 text-uppercase">Database</div>
                      <div className="d-flex align-items-center">
                        {healthData?.database === 'connected' ? (
                          <><span className="d-inline-block rounded-circle bg-success me-2 shadow-sm" style={{width: '10px', height: '10px'}}></span> <span className="fw-bold fs-5">Connected</span></>
                        ) : (
                          <><span className="d-inline-block rounded-circle bg-danger me-2 shadow-sm" style={{width: '10px', height: '10px'}}></span> <span className="fw-bold fs-5 text-danger">Disconnected</span></>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card bg-light border-0 h-100 rounded-4">
                    <div className="card-body p-3">
                      <div className="text-muted small fw-semibold mb-1 text-uppercase">River Scraper Status</div>
                      <div className="d-flex align-items-center">
                        {healthData?.scraper?.status === 'running' ? (
                          <><span className="d-inline-block rounded-circle bg-warning me-2 shadow-sm" style={{width: '10px', height: '10px'}}></span> <span className="fw-bold fs-5">Running</span></>
                        ) : healthData?.scraper?.status === 'idle' ? (
                          <><span className="d-inline-block rounded-circle bg-info me-2 shadow-sm" style={{width: '10px', height: '10px'}}></span> <span className="fw-bold fs-5">Idle</span></>
                        ) : (
                          <><span className="d-inline-block rounded-circle bg-danger me-2 shadow-sm" style={{width: '10px', height: '10px'}}></span> <span className="fw-bold fs-5 text-danger">Error</span></>
                        )}
                      </div>
                      <div className="small text-muted mt-1" style={{ fontSize: '0.75rem' }}>Last: {healthData?.scraper?.last_run ? new Date(healthData.scraper.last_run).toLocaleString() : 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card bg-light border-0 h-100 rounded-4">
                    <div className="card-body p-3 d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-muted small fw-semibold mb-1 text-uppercase">Total Monitoring Stations</div>
                        <div className="fw-bold fs-3">{healthData?.stations?.total || 0}</div>
                      </div>
                      <i className="bi bi-water text-primary fs-1 opacity-25"></i>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card bg-light border-0 h-100 rounded-4">
                    <div className="card-body p-3 d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-muted small fw-semibold mb-1 text-uppercase">Mapped Stations (Coordinates)</div>
                        <div className="fw-bold fs-3 text-success">{healthData?.stations?.with_coordinates || 0}</div>
                      </div>
                      <i className="bi bi-geo-alt-fill text-success fs-1 opacity-25"></i>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Simulation Demo Trigger Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 bg-danger bg-opacity-10">
            <div className="card-body p-4 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title fw-bold text-danger mb-1 d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill"></i> Presentation Simulation (Demo)
                </h5>
                <p className="text-muted small mb-0">
                  Inject or clear synthetic extreme weather data to force/reset an immediate "Critical" flood prediction.
                </p>
              </div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-danger btn-lg shadow-sm rounded-pill px-4 fw-bold" 
                  onClick={async () => {
                    if (!window.confirm('Clear simulation data?')) return;
                    setActionLoading(true);
                    try {
                      const token = localStorage.getItem('token');
                      const response = await fetch(`${API_URL}/api/scraper/clear-simulation`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      const data = await response.json();
                      setMessage({ type: response.ok ? 'success' : 'danger', text: data.message || data.detail || 'Action completed' });
                      fetchAll();
                    } catch (e) {
                      setMessage({ type: 'danger', text: 'Failed to clear simulation' });
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading}
                >
                  Clear Simulation
                </button>
                <button 
                  className="btn btn-danger btn-lg shadow-sm rounded-pill px-4 fw-bold" 
                  onClick={handleSimulate}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span> Processing...</>
                  ) : (
                    <><i className="bi bi-play-circle-fill me-2"></i> Trigger Simulation</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedulers Management Columns */}
      <div className="row g-4">
        {/* River Level Scraper Card */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-body">
            <div className="card-body p-4 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title fw-bold mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-robot text-primary"></i> River Scraper Control
                  </h5>
                  <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={fetchStatus} disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-arrow-clockwise"></i>}
                  </button>
                </div>

                {message.text && (
                  <div className={`alert alert-${message.type} py-2 mb-4 d-flex align-items-center small rounded-3`}>
                    <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                    {message.text}
                  </div>
                )}
                
                <div className="d-flex align-items-center mb-3">
                  <span className="fw-semibold me-3" style={{ width: '120px' }}>Scheduler:</span>
                  {scraperStatus?.enabled ? (
                    <span className="badge bg-success rounded-pill px-3 py-1.5"><i className="bi bi-check-circle me-1"></i> Enabled</span>
                  ) : (
                    <span className="badge bg-secondary rounded-pill px-3 py-1.5"><i className="bi bi-x-circle me-1"></i> Disabled</span>
                  )}
                </div>
                
                <div className="d-flex align-items-center mb-4">
                  <span className="fw-semibold me-3" style={{ width: '120px' }}>Current State:</span>
                  {scraperStatus?.isRunning ? (
                    <span className="badge bg-warning text-dark rounded-pill px-3 py-1.5">
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" style={{ width: '0.8rem', height: '0.8rem' }}></span>
                      Running
                    </span>
                  ) : (
                    <span className="badge bg-info text-dark rounded-pill px-3 py-1.5"><i className="bi bi-pause-circle me-1"></i> Idle</span>
                  )}
                </div>

                <div className="small text-muted bg-light p-3 rounded-4 border border-secondary-subtle mb-4">
                  <div className="mb-1"><strong className="text-dark">Last Run:</strong> {scraperStatus?.lastRunTime ? new Date(scraperStatus.lastRunTime).toLocaleString() : 'Never'}</div>
                  <div><strong className="text-dark">Interval:</strong> Every 15 minutes</div>
                </div>
              </div>

              <div>
                <p className="text-muted small mb-3">Fetches real-time water level data from the public portal.</p>
                <div className="d-grid gap-2">
                  {scraperStatus?.enabled ? (
                    <button 
                      className="btn btn-outline-danger rounded-pill" 
                      onClick={() => handleScraperAction('disable')}
                      disabled={actionLoading}
                    >
                      <i className="bi bi-stop-circle me-2"></i> Disable Cron
                    </button>
                  ) : (
                    <button 
                      className="btn btn-outline-success rounded-pill" 
                      onClick={() => handleScraperAction('enable')}
                      disabled={actionLoading}
                    >
                      <i className="bi bi-clock-history me-2"></i> Enable Cron
                    </button>
                  )}
                  {/* <button 
                    className="btn btn-primary shadow-sm rounded-pill" 
                    onClick={() => handleScraperAction('run')}
                    disabled={actionLoading || scraperStatus?.isRunning}
                  >
                    {actionLoading || scraperStatus?.isRunning ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span> Running...</>
                    ) : (
                      <><i className="bi bi-play-circle-fill me-2"></i> Trigger Scraper Run</>
                    )}
                  </button> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Forecast Scheduler Card */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-body">
            <div className="card-body p-4 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title fw-bold mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-cloud-sun text-primary"></i> Forecast Scheduler Control
                  </h5>
                  <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={fetchForecastStatus} disabled={forecastLoading}>
                    {forecastLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-arrow-clockwise"></i>}
                  </button>
                </div>

                {forecastMessage.text && (
                  <div className={`alert alert-${forecastMessage.type} py-2 mb-4 d-flex align-items-center small rounded-3`}>
                    <i className={`bi ${forecastMessage.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                    {forecastMessage.text}
                  </div>
                )}
                
                <div className="d-flex align-items-center mb-3">
                  <span className="fw-semibold me-3" style={{ width: '120px' }}>Scheduler:</span>
                  {forecastStatus?.enabled ? (
                    <span className="badge bg-success rounded-pill px-3 py-1.5"><i className="bi bi-check-circle me-1"></i> Enabled</span>
                  ) : (
                    <span className="badge bg-secondary rounded-pill px-3 py-1.5"><i className="bi bi-x-circle me-1"></i> Disabled</span>
                  )}
                </div>
                
                <div className="d-flex align-items-center mb-4">
                  <span className="fw-semibold me-3" style={{ width: '120px' }}>Current State:</span>
                  {forecastStatus?.isRunning ? (
                    <span className="badge bg-warning text-dark rounded-pill px-3 py-1.5">
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" style={{ width: '0.8rem', height: '0.8rem' }}></span>
                      Running
                    </span>
                  ) : (
                    <span className="badge bg-info text-dark rounded-pill px-3 py-1.5"><i className="bi bi-pause-circle me-1"></i> Idle</span>
                  )}
                </div>

                <div className="small text-muted bg-light p-3 rounded-4 border border-secondary-subtle mb-4">
                  <div className="mb-1">
                    <strong className="text-dark">Last Run:</strong> {forecastStatus?.lastRunTime ? new Date(forecastStatus.lastRunTime).toLocaleString() : 'Never'}
                  </div>
                  <div className="mb-1">
                    <strong className="text-dark">Total Records:</strong> {forecastStatus?.totalRecords?.toLocaleString() || 0}
                  </div>
                  <div>
                    <strong className="text-dark">Interval:</strong> Every 1 Hour
                  </div>
                </div>
              </div>

              <div>
                <p className="text-muted small mb-3">Fetches 7-day hourly forecasts from Open-Meteo for stations with coordinates.</p>
                <div className="d-grid gap-2">
                  {forecastStatus?.enabled ? (
                    <button 
                      className="btn btn-outline-danger rounded-pill" 
                      onClick={() => handleForecastAction('disable')}
                      disabled={forecastActionLoading}
                    >
                      <i className="bi bi-stop-circle me-2"></i> Disable Cron
                    </button>
                  ) : (
                    <button 
                      className="btn btn-outline-success rounded-pill" 
                      onClick={() => handleForecastAction('enable')}
                      disabled={forecastActionLoading}
                    >
                      <i className="bi bi-clock-history me-2"></i> Enable Cron
                    </button>
                  )}
                  {/* <button 
                    className="btn btn-primary shadow-sm rounded-pill" 
                    onClick={() => handleForecastAction('run')}
                    disabled={forecastActionLoading || forecastStatus?.isRunning}
                  >
                    {forecastActionLoading || forecastStatus?.isRunning ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span> Running...</>
                    ) : (
                      <><i className="bi bi-play-circle-fill me-2"></i> Trigger Forecast Run</>
                    )}
                  </button> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
