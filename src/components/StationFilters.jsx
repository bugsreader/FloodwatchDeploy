import React from 'react';

const StationFilters = ({ filters, onFilterChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value, page: 1 }); // Reset page on filter change
  };

  return (
    <div className="card shadow-sm mb-4 border-0 rounded-4">
      <div className="card-body p-4">
        <div className="row g-3">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search stations, districts..."
                name="search"
                value={filters.search}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              name="state"
              value={filters.state}
              onChange={handleChange}
            >
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
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              name="status"
              value={filters.status}
              onChange={handleChange}
            >
              <option value="">All Statuses</option>
              <option value="Normal">Normal</option>
              <option value="Alert">Alert</option>
              <option value="Warning">Warning</option>
              <option value="Danger">Danger</option>
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              name="sortBy"
              value={filters.sortBy}
              onChange={handleChange}
            >
              <option value="last_updated">Sort: Last Updated</option>
              <option value="latest_water_level">Sort: Water Level</option>
              <option value="station_name">Sort: Name</option>
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              name="sortOrder"
              value={filters.sortOrder}
              onChange={handleChange}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationFilters;
