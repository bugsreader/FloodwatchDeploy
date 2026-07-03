import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { MapContainer, TileLayer, LayersControl, ZoomControl, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import StationStatusBadge from '../components/StationStatusBadge';
import PredictionPanel from '../components/PredictionPanel';

// Helper to create custom colored markers
const getMarkerIcon = (status) => {
  let color = '#198754'; // Normal - green
  if (status === 'Alert') color = '#ffc107'; // yellow
  else if (status === 'Warning') color = '#fd7e14'; // orange
  else if (status === 'Danger') color = '#dc3545'; // red

  const markerHtml = `
    <div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      display: block;
      left: -10px;
      top: -10px;
      position: relative;
      border-radius: 3rem 3rem 0;
      transform: rotate(45deg);
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 5px rgba(0,0,0,0.4);
    "></div>
  `;

  return new L.divIcon({
    className: 'custom-pin',
    iconAnchor: [0, 20],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -22],
    html: markerHtml
  });
};

const Dashboard = () => {
  const mapCenter = [4.2105, 108.9758]; // Center of Malaysia
  
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ state: '', status: '' });

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const queryParams = new URLSearchParams({
          limit: 10000,
          state: filters.state,
          status: filters.status
        });

        const response = await fetch(`${API_URL}/api/stations?${queryParams}`, { headers });
        if (!response.ok) throw new Error('Failed to fetch stations');
        
        const data = await response.json();
        setStations(data.stations || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
    
    // Auto-refresh every 5 minutes
    const intervalId = setInterval(fetchStations, 5 * 60 * 1000); 
    return () => clearInterval(intervalId);
  }, [filters.state, filters.status]);

  return (
    <>
    <div className="d-flex flex-column position-relative w-100" style={{ height: '70vh' }}>
      
      {/* Loading & Error Overlays */}
      {loading && (
        <div className="position-absolute top-50 start-50 translate-middle z-3 bg-white p-3 rounded-4 shadow d-flex align-items-center" style={{ zIndex: 1000 }}>
          <div className="spinner-border text-primary me-3" role="status"></div>
          <span className="fw-semibold">Loading map data...</span>
        </div>
      )}

      {error && (
        <div className="position-absolute top-50 start-50 translate-middle z-3 bg-danger text-white p-3 rounded-4 shadow" style={{ zIndex: 1000 }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i> Error: {error}
        </div>
      )}

      {/* Filters Overlay */}
      <div className="position-absolute top-0 start-0 m-3 z-3" style={{ zIndex: 1000 }}>
        <div className="card shadow-sm border-0 bg-white bg-opacity-75" style={{ backdropFilter: 'blur(10px)' }}>
          <div className="card-body p-2 d-flex flex-column flex-md-row gap-2">
            <select className="form-select form-select-sm border-0 shadow-none" value={filters.state} onChange={(e) => setFilters({...filters, state: e.target.value})}>
              <option value="">All States</option>
              <option value="Johor">Johor</option>
              <option value="Kedah">Kedah</option>
              <option value="Kelantan">Kelantan</option>
              <option value="Melaka">Melaka</option>
              <option value="Negeri Sembilan">Negeri Sembilan</option>
              <option value="Pahang">Pahang</option>
              <option value="Perak">Perak</option>
              <option value="Perlis">Perlis</option>
              <option value="Pulau Pinang">Pulau Pinang</option>
              <option value="Sabah">Sabah</option>
              <option value="Sarawak">Sarawak</option>
              <option value="Selangor">Selangor</option>
              <option value="Terengganu">Terengganu</option>
              <option value="Kuala Lumpur">Kuala Lumpur</option>
              <option value="Labuan">Labuan</option>
              <option value="Putrajaya">Putrajaya</option>
            </select>
            <select className="form-select form-select-sm border-0 shadow-none" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option value="">All Statuses</option>
              <option value="Normal">Normal</option>
              <option value="Alert">Alert</option>
              <option value="Warning">Warning</option>
              <option value="Danger">Danger</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prediction Panel Overlay */}
      <div className="position-absolute top-0 end-0 m-3 z-3" style={{ zIndex: 1000, width: '320px', maxWidth: 'calc(100vw - 2rem)' }}>
        <PredictionPanel />
      </div>

      {/* Legend Overlay */}
      <div className="position-absolute bottom-0 start-0 m-3 p-3 bg-white bg-opacity-75 rounded-4 shadow-sm z-3" style={{ zIndex: 1000, backdropFilter: 'blur(10px)' }}>
        <h6 className="fw-bold mb-2 text-dark small text-uppercase">Flood Status</h6>
        <div className="d-flex align-items-center mb-1"><span className="d-inline-block rounded-circle me-2 shadow-sm" style={{width:'12px', height:'12px', backgroundColor:'#198754'}}></span> <span className="small">Normal</span></div>
        <div className="d-flex align-items-center mb-1"><span className="d-inline-block rounded-circle me-2 shadow-sm" style={{width:'12px', height:'12px', backgroundColor:'#ffc107'}}></span> <span className="small">Alert</span></div>
        <div className="d-flex align-items-center mb-1"><span className="d-inline-block rounded-circle me-2 shadow-sm" style={{width:'12px', height:'12px', backgroundColor:'#fd7e14'}}></span> <span className="small">Warning</span></div>
        <div className="d-flex align-items-center"><span className="d-inline-block rounded-circle me-2 shadow-sm" style={{width:'12px', height:'12px', backgroundColor:'#dc3545'}}></span> <span className="small">Danger</span></div>
      </div>

      {/* Map Container */}
      <div className="flex-grow-1 w-100 z-1 position-relative">
        <MapContainer 
          center={mapCenter} 
          zoom={6} 
          style={{ height: '100%', width: '100%' }} 
          zoomControl={false}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Light Map">
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Dark Map">
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Terrain">
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          
          <ZoomControl position="bottomright" />

          {/* Removed MarkerClusterGroup due to React 19 compatibility issue */}
          {stations.filter(s => s.latitude != null && s.longitude != null && !isNaN(parseFloat(s.latitude)) && !isNaN(parseFloat(s.longitude))).map(station => {
            const position = [parseFloat(station.latitude), parseFloat(station.longitude)];

            return (
              <Marker 
                key={station.station_id} 
                position={position}
                icon={getMarkerIcon(station.status)}
              >
                <Popup className="station-popup" minWidth={250}>
                  <div className="p-1">
                    <h6 className="fw-bold mb-1 border-bottom pb-2">{station.station_name}</h6>
                    <div className="small text-muted mb-2">{station.district}, {station.state}</div>
                    
                    <div className="d-flex justify-content-between align-items-center mb-2 bg-light p-2 rounded">
                      <span className="small fw-semibold">Level:</span>
                      <span className="fs-5 fw-bold text-primary">{station.latest_water_level_m}m</span>
                    </div>
                    
                    <div className="mb-3">
                      <StationStatusBadge status={station.status} />
                    </div>
                    
                    <div className="small mb-3">
                      <div className="d-flex justify-content-between text-muted"><span style={{fontSize:'0.75rem'}}>Normal:</span> <span style={{fontSize:'0.75rem'}}>{station.normal_threshold || '-'}m</span></div>
                      <div className="d-flex justify-content-between text-muted"><span style={{fontSize:'0.75rem'}}>Alert:</span> <span style={{fontSize:'0.75rem'}}>{station.alert_threshold || '-'}m</span></div>
                      <div className="d-flex justify-content-between text-muted"><span style={{fontSize:'0.75rem'}}>Warning:</span> <span style={{fontSize:'0.75rem'}}>{station.warning_threshold || '-'}m</span></div>
                      <div className="d-flex justify-content-between text-muted"><span style={{fontSize:'0.75rem'}}>Danger:</span> <span style={{fontSize:'0.75rem'}}>{station.danger_threshold || '-'}m</span></div>
                    </div>

                    <div className="text-center">
                      <Link to={`/stations/${station.station_id}`} className="btn btn-sm btn-outline-primary w-100">
                        View History
                      </Link>
                    </div>
                    
                    <div className="text-center mt-2" style={{fontSize: '0.7rem', color: '#adb5bd'}}>
                      Updated: {station.updated_at ? new Date(station.updated_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Disclaimer Overlay */}
      <div className="position-absolute bottom-0 start-50 translate-middle-x mb-2 p-2 bg-dark bg-opacity-75 text-white rounded-3 shadow z-3 text-center" style={{ zIndex: 1000, maxWidth: '80%', backdropFilter: 'blur(10px)' }}>
        <p className="small mb-0 opacity-75">
          <i className="bi bi-info-circle me-1"></i>
          <strong>Disclaimer:</strong> AI predictions are probabilistic. Users should consult official channels.
        </p>
      </div>

    </div>
    
    </>
  );
};

export default Dashboard;
