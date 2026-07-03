import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

const Settings = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="container-fluid p-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold mb-0">Settings</h2>
          <p className="text-muted">Manage your application preferences and configurations.</p>
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 mb-4 bg-body">
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4 d-flex align-items-center gap-2">
                <i className="bi bi-palette text-primary"></i> Appearance
              </h5>
              
              <div className="d-flex justify-content-between align-items-center p-3 rounded-3 border border-secondary-subtle">
                <div>
                  <h6 className="fw-bold mb-1">Theme Mode</h6>
                  <p className="text-muted small mb-0">Toggle between dark and light themes</p>
                </div>
                <div className="form-check form-switch fs-4 mb-0">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    role="switch" 
                    id="themeSwitch" 
                    checked={theme === 'dark'}
                    onChange={toggleTheme}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
