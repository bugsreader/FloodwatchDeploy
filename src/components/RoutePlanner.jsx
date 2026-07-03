import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const LocationPicker = ({ onLocationSelect, pointType }) => {
  useMapEvents({
    click(e) {
      if (pointType) {
        onLocationSelect(e.latlng);
      }
    },
  });
  return null;
};

const decodePolyline = (encoded) => {
  if (!encoded) return [];
  var poly = [];
  var index = 0, len = encoded.length;
  var lat = 0, lng = 0;

  while (index < len) {
    var b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    var dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    var dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    var p = [lat / 1E5, lng / 1E5];
    poly.push(p);
  }
  return poly;
};

// Component to recenter map programmatically
const RecenterMap = ({ lat, lng, zoom = 12 }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], zoom);
    }
  }, [lat, lng, map]);
  return null;
};

const RoutePlanner = () => {
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [activePicker, setActivePicker] = useState(null); // 'start' or 'end'
  const [routeData, setRouteData] = useState(null);
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState([3.139, 101.6869]); // Default center (Kuala Lumpur area)

  useEffect(() => {
    const fetchHazards = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/routes/hazards`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.hazards) {
            setHazards(data.hazards);
          }
        }
      } catch (err) {
        console.error("Failed to fetch hazards", err);
      }
    };
    fetchHazards();
  }, []);

  const handleLocationSelect = (latlng) => {
    if (activePicker === 'start') {
      setStartPoint([latlng.lat, latlng.lng]);
      setActivePicker(null);
    } else if (activePicker === 'end') {
      setEndPoint([latlng.lat, latlng.lng]);
      setActivePicker(null);
    }
  };

  const locateUser = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setStartPoint([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setIsLocating(false);
      },
      (err) => {
        setError("Unable to retrieve your location.");
        setIsLocating(false);
      }
    );
  };

  const calculateRoute = async () => {
    if (!startPoint || !endPoint) {
      setError("Please select both a start and end point.");
      return;
    }

    try {
      setLoading(true);
      setError('');
      setRouteData(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/routes/safe`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          start_lat: startPoint[0],
          start_lon: startPoint[1],
          end_lat: endPoint[0],
          end_lon: endPoint[1],
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        if (data.status === 'unsafe') {
          setError(data.message);
        } else {
          // Map GeoJSON geometry to Leaflet format [lat, lon]
          if (data.route && data.route.geometry && data.route.geometry.coordinates) {
            data.route.path = data.route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setRouteData(data);
          } else {
            setError("Invalid route data received.");
          }
        }
      } else {
        setError(data.detail || "Failed to calculate route.");
      }
    } catch (err) {
      setError("Network error calculating route.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 bg-body overflow-hidden">
      <div className="card-header bg-white border-bottom p-4">
        <h5 className="card-title fw-bold mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-sign-turn-right-fill text-primary fs-4"></i>
          Safe-Route Planner
        </h5>
        
        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-5">
            <div className="d-flex gap-2">
              <button 
                className={`btn flex-grow-1 ${activePicker === 'start' ? 'btn-success' : 'btn-outline-success'} rounded-pill`}
                onClick={() => setActivePicker('start')}
              >
                <i className="bi bi-geo-alt-fill me-2"></i>
                {startPoint ? `Start: ${startPoint[0].toFixed(3)}, ${startPoint[1].toFixed(3)}` : 'Select Start Point'}
              </button>
              <button 
                className="btn btn-outline-secondary rounded-pill px-3" 
                onClick={locateUser} 
                title="Locate Me"
                disabled={isLocating}
              >
                {isLocating ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-crosshair"></i>}
              </button>
            </div>
          </div>
          <div className="col-md-5">
            <button 
              className={`btn w-100 ${activePicker === 'end' ? 'btn-danger' : 'btn-outline-danger'} rounded-pill`}
              onClick={() => setActivePicker('end')}
            >
              <i className="bi bi-geo-alt-fill me-2"></i>
              {endPoint ? `End: ${endPoint[0].toFixed(3)}, ${endPoint[1].toFixed(3)}` : 'Select End Point'}
            </button>
          </div>
          <div className="col-md-2">
            <button 
              className="btn btn-primary w-100 rounded-pill fw-bold"
              onClick={calculateRoute}
              disabled={loading || !startPoint || !endPoint}
            >
              {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Route'}
            </button>
          </div>
        </div>

        {activePicker && (
          <div className="alert alert-info py-2 mb-0 rounded-3 small">
            <i className="bi bi-info-circle-fill me-2"></i>
            Click on the map to set the {activePicker} point.
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger py-2 mb-0 rounded-3 small mt-2">
            <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
          </div>
        )}
        
        {routeData && (
          <div className={`alert ${routeData.status === 'rerouted' ? 'alert-warning' : 'alert-success'} py-2 mb-0 rounded-3 small mt-2`}>
            <i className={`bi ${routeData.status === 'rerouted' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2`}></i>
            {routeData.message}
          </div>
        )}
      </div>

      <div className="position-relative" style={{ height: '400px' }}>
        <MapContainer center={mapCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <RecenterMap lat={mapCenter[0]} lng={mapCenter[1]} />
          <LocationPicker onLocationSelect={handleLocationSelect} pointType={activePicker} />
          
          {startPoint && (
            <Marker position={startPoint} icon={startIcon}>
              <Popup><strong>You</strong> (Start)</Popup>
            </Marker>
          )}
          {endPoint && (
            <Marker position={endPoint} icon={endIcon}>
              <Popup>Destination</Popup>
            </Marker>
          )}

          {/* Plot Hazards */}
          {hazards.map((hazard, idx) => (
            <Circle 
              key={`hazard-${idx}`}
              center={[hazard.lat, hazard.lon]}
              radius={hazard.radius_km * 1000} // Leaflet uses meters
              pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}
            >
              <Popup>
                <div className="text-danger fw-bold"><i className="bi bi-exclamation-triangle-fill me-1"></i> Flood Hazard Zone</div>
                <div className="small">Radius: {hazard.radius_km}km</div>
              </Popup>
            </Circle>
          ))}
          
          {routeData && routeData.route && routeData.route.path && (
            <Polyline 
              positions={routeData.route.path} 
              color={routeData.status === 'rerouted' ? '#0d6efd' : '#0a58ca'} 
              weight={6}
              opacity={0.8}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default RoutePlanner;
