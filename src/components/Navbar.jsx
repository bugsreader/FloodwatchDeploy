import React from 'react';
import PredictionPanel from './PredictionPanel';

const Navbar = ({ toggleSidebar }) => {
  return (
    <nav className="navbar navbar-expand-lg bg-body border-bottom shadow-sm px-3 px-md-4 py-3 sticky-top z-3">
      <div className="container-fluid p-0 d-flex flex-nowrap align-items-center justify-content-between">
        <div className="d-flex align-items-center flex-grow-1 flex-md-grow-0 me-3">
          <button 
            className="btn bg-body-secondary d-md-none me-3 p-2 d-flex align-items-center justify-content-center border-0 shadow-sm" 
            onClick={toggleSidebar}
            style={{width: '42px', height: '42px'}}
          >
            <i className="bi bi-list fs-4 text-secondary"></i>
          </button>
          <form className="d-flex flex-grow-1 w-md-50 max-w-500">
            <div className="input-group bg-body-secondary rounded-pill">
              <span className="input-group-text bg-transparent border-0 pe-2 ps-3 d-none d-sm-flex">
                <i className="bi bi-search text-body-secondary"></i>
              </span>
              <input 
                className="form-control bg-transparent border-0 shadow-none px-3 px-sm-1 py-2 text-body" 
                type="search" 
                placeholder="Search locations, sensors..." 
                aria-label="Search" 
              />
            </div>
          </form>
        </div>

        <div className="d-flex align-items-center gap-3">
          <PredictionPanel />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
