import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

const EditStationModal = ({ station, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    station_name: '',
    state: '',
    district: '',
    basin: '',
    sub_basin: '',
    latitude: '',
    longitude: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (station) {
      setFormData({
        station_name: station.station_name || '',
        state: station.state || '',
        district: station.district || '',
        basin: station.basin || '',
        sub_basin: station.sub_basin || '',
        latitude: station.latitude ?? '',
        longitude: station.longitude ?? ''
      });
    }
  }, [station]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/stations/${station.station_id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update station');
      }
      
      onSave(data.station);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!station) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content rounded-4 border-0 shadow">
          <div className="modal-header border-bottom-0 pb-0">
            <h5 className="modal-title fw-bold">Edit Station: {station.station_id}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-12">
                  <label className="form-label fw-semibold">Station Name</label>
                  <input type="text" className="form-control" name="station_name" value={formData.station_name} onChange={handleChange} required />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold">State</label>
                  <input type="text" className="form-control" name="state" value={formData.state} onChange={handleChange} required />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold">District</label>
                  <input type="text" className="form-control" name="district" value={formData.district} onChange={handleChange} required />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Basin</label>
                  <input type="text" className="form-control" name="basin" value={formData.basin} onChange={handleChange} />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Sub Basin</label>
                  <input type="text" className="form-control" name="sub_basin" value={formData.sub_basin} onChange={handleChange} />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Latitude</label>
                  <input type="number" step="any" min="-90" max="90" className="form-control" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="e.g. 3.1490" />
                  <div className="form-text">Optional. Between -90 and 90.</div>
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Longitude</label>
                  <input type="number" step="any" min="-180" max="180" className="form-control" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="e.g. 101.6969" />
                  <div className="form-text">Optional. Between -180 and 180.</div>
                </div>
              </div>
              
              <div className="d-flex justify-content-end mt-4 pt-3 border-top gap-2">
                <button type="button" className="btn btn-light px-4" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...</>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStationModal;
