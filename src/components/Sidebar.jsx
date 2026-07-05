import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();

  return (
    <div className={`d-flex flex-column flex-shrink-0 p-3 text-white bg-dark sidebar shadow ${isOpen ? 'show' : ''}`} style={{ width: '280px', minHeight: '100vh', zIndex: 1040 }}>
      <div className="d-flex align-items-center justify-content-between mb-4 mt-2 px-2 w-100">
        <a href="/" className="d-flex align-items-center text-white text-decoration-none">
          <div className="bg-primary rounded p-2 me-3 shadow-sm d-flex align-items-center justify-content-center">
            <i className="bi bi-tsunami fs-5 text-white"></i>
          </div>
          <span className="fs-4 fw-bold tracking-tight">FloodWatch</span>
        </a>
        <button
          className="btn btn-link text-white d-md-none p-0 ms-auto"
          onClick={() => setIsOpen(false)}
        >
          <i className="bi bi-x-lg fs-4"></i>
        </button>
      </div>

      <p className="text-uppercase text-secondary fw-bold mb-2 px-3" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Menu</p>
      <ul className="nav nav-pills flex-column mb-auto gap-1">
        <li className="nav-item">
          <NavLink to="/" className={({ isActive }) => `nav-link text-white d-flex align-items-center rounded-3 py-2 px-3 ${isActive ? 'active bg-primary shadow-sm' : 'hover-bg-light text-opacity-75'}`}>
            <i className="bi bi-grid-1x2-fill me-3 fs-5"></i>
            Dashboard
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink to="/stations" className={({ isActive }) => `nav-link text-white d-flex align-items-center rounded-3 py-2 px-3 ${isActive ? 'active bg-primary shadow-sm' : 'hover-bg-light text-opacity-75'}`}>
            <i className="bi bi-droplet-half me-3 fs-5"></i>
            River Stations
          </NavLink>
        </li>
        {user && ['Admin', 'Premium User', 'Emergency/Municipal Role'].includes(user.role || user.role_name) && (
          <li className="nav-item">
            <NavLink to="/route-planner" className={({ isActive }) => `nav-link text-white d-flex align-items-center rounded-3 py-2 px-3 ${isActive ? 'active bg-primary shadow-sm' : 'hover-bg-light text-opacity-75'}`}>
              <i className="bi bi-sign-turn-right-fill me-3 fs-5"></i>
              Route Planner
            </NavLink>
          </li>
        )}
        <li>
          <NavLink to="/settings" className={({ isActive }) => `nav-link text-white d-flex align-items-center rounded-3 py-2 px-3 ${isActive ? 'active bg-primary shadow-sm' : 'hover-bg-light text-opacity-75'}`}>
            <i className="bi bi-gear-fill me-3 fs-5"></i>
            Settings
          </NavLink>
        </li>
        {user && (user.role === 'Admin' || user.role_name === 'Admin') && (
          <>
            <li>
              <NavLink to="/admin" className={({ isActive }) => `nav-link text-white d-flex align-items-center rounded-3 py-2 px-3 ${isActive ? 'active bg-primary shadow-sm' : 'hover-bg-light text-opacity-75'}`}>
                <i className="bi bi-shield-lock-fill me-3 fs-5"></i>
                System Monitoring
              </NavLink>
            </li>
            <li>
              <NavLink to="/users" className={({ isActive }) => `nav-link text-white d-flex align-items-center rounded-3 py-2 px-3 ${isActive ? 'active bg-primary shadow-sm' : 'hover-bg-light text-opacity-75'}`}>
                <i className="bi bi-people-fill me-3 fs-5"></i>
                User Management
              </NavLink>
            </li>
          </>
        )}
      </ul>
      <div className="mt-auto">
        <hr className="border-secondary mb-3 mt-0" />
        <div className="dropdown px-2">
          <a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
            <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=0D8ABC&color=fff&rounded=true`} alt="" width="38" height="38" className="rounded-circle me-3 border border-2 border-secondary" />
            <div className="d-flex flex-column">
              <strong className="lh-1">{user?.name || 'User'}</strong>
              <small className="text-secondary mt-1 text-capitalize">{user?.role || user?.role_name || 'User'}</small>
            </div>
          </a>
          <ul className="dropdown-menu dropdown-menu-dark text-small shadow border-0 rounded-3 mt-2" aria-labelledby="dropdownUser1">
            <li><Link className="dropdown-item py-2 d-flex align-items-center" to="/profile"><i className="bi bi-person me-2"></i> Profile</Link></li>
            <li><Link className="dropdown-item py-2 d-flex align-items-center" to="/settings"><i className="bi bi-gear me-2"></i> Preferences</Link></li>
            <li><hr className="dropdown-divider border-secondary opacity-50" /></li>
            <li><button className="dropdown-item py-2 d-flex align-items-center text-danger" onClick={logout}><i className="bi bi-box-arrow-right me-2"></i> Sign out</button></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
