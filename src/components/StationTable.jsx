import React from 'react';
import { Link } from 'react-router-dom';
import StationStatusBadge from './StationStatusBadge';

const StationTable = ({ stations, isAdmin, onEdit }) => {
  if (stations.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="display-1 text-muted mb-3"><i className="bi bi-inbox"></i></div>
        <h4 className="text-muted">No stations found</h4>
        <p className="text-muted">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive bg-white rounded-4 shadow-sm">
      <table className="table table-hover table-borderless align-middle mb-0">
        <thead className="table-light border-bottom">
          <tr>
            <th className="py-3 px-4">Station</th>
            <th className="py-3">Location</th>
            <th className="py-3">Coordinates</th>
            <th className="py-3">Water Level (m)</th>
            <th className="py-3">Status</th>
            <th className="py-3 text-end px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {stations.map(station => (
            <tr key={station.station_id} className="border-bottom">
              <td className="py-3 px-4">
                <div className="fw-bold text-dark">{station.station_name}</div>
                <div className="small text-muted">{station.station_id}</div>
              </td>
              <td className="py-3">
                <div>{station.district}</div>
                <div className="small text-muted">{station.state}</div>
              </td>
              <td className="py-3">
                <div className="small text-muted mb-1">
                  <span className="fw-semibold">Lat:</span> {station.latitude !== null ? station.latitude : 'N/A'}
                </div>
                <div className="small text-muted">
                  <span className="fw-semibold">Lng:</span> {station.longitude !== null ? station.longitude : 'N/A'}
                </div>
              </td>
              <td className="py-3">
                <div className="fw-bold fs-5 text-primary">{station.latest_water_level_m !== null ? station.latest_water_level_m : '-'}</div>
                <div className="small text-muted">
                  N: {station.normal_threshold || '-'} | A: {station.alert_threshold || '-'} | W: {station.warning_threshold || '-'} | D: {station.danger_threshold || '-'}
                </div>
              </td>
              <td className="py-3">
                <StationStatusBadge status={station.status} />
              </td>
              <td className="py-3 text-end px-4">
                <div className="d-flex flex-column align-items-end gap-2">
                  <div className="small text-muted">
                    {station.updated_at ? new Date(station.updated_at).toLocaleString() : 'N/A'}
                  </div>
                  <div>
                    {isAdmin && (
                      <button 
                        className="btn btn-sm btn-outline-secondary rounded-pill px-3 me-2"
                        onClick={() => onEdit(station)}
                      >
                        <i className="bi bi-pencil me-1"></i> Edit
                      </button>
                    )}
                    <Link to={`/stations/${station.station_id}`} className="btn btn-sm btn-outline-primary rounded-pill px-3">
                      View Details
                    </Link>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StationTable;
