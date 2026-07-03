import React from 'react';
import RoutePlanner from '../components/RoutePlanner';

const RoutePlannerPage = () => {
  return (
    <div className="container-fluid py-4 px-md-4 h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1"><i className="bi bi-sign-turn-right-fill text-primary me-2"></i>Route Planner</h2>
          <p className="text-muted mb-0">Find safe routes bypassing active flood hazards.</p>
        </div>
      </div>
      
      <div className="flex-grow-1" style={{ minHeight: '600px' }}>
        <RoutePlanner />
      </div>
    </div>
  );
};

export default RoutePlannerPage;
