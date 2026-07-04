import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import StationFilters from '../components/StationFilters';
import StationTable from '../components/StationTable';
import Pagination from '../components/Pagination';
import EditStationModal from '../components/EditStationModal';
import { useAuth } from '../context/AuthContext';

const Stations = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin' || user?.role_name === 'Admin';
  
  const [stations, setStations] = useState([]);
  const [editingStation, setEditingStation] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    state: '',
    status: '',
    sortBy: 'last_updated',
    sortOrder: 'desc'
  });

  const fetchStations = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        state: filters.state,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const token = localStorage.getItem('token');
      // Adding Authorization header just in case it's protected
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/stations/?${queryParams}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setStations(data.stations);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch stations');
      }
    } catch (error) {
      console.error('Network error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add debounce for search
    const timer = setTimeout(() => {
      fetchStations();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleEditClick = (station) => {
    setEditingStation(station);
  };

  const handleModalClose = () => {
    setEditingStation(null);
  };

  const handleStationUpdated = (updatedStation) => {
    setStations(stations.map(st => st.station_id === updatedStation.station_id ? updatedStation : st));
    setEditingStation(null);
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1"><i className="bi bi-droplet-half text-primary me-2"></i>River Stations</h2>
          <p className="text-muted mb-0">Monitor water levels and alert status across the country</p>
        </div>
        <button className="btn btn-outline-primary rounded-circle" onClick={fetchStations} title="Refresh">
          <i className="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      <StationFilters filters={filters} onFilterChange={setFilters} />

      {loading ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading stations data...</p>
        </div>
      ) : (
        <>
          <StationTable stations={stations} isAdmin={isAdmin} onEdit={handleEditClick} />
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </>
      )}

      {editingStation && (
        <EditStationModal 
          station={editingStation} 
          onClose={handleModalClose} 
          onSave={handleStationUpdated} 
        />
      )}
    </div>
  );
};

export default Stations;
