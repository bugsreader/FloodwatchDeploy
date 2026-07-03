import React from 'react';
import UserManagement from '../components/UserManagement';

const UsersPage = () => {
  return (
    <div className="container-fluid p-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold mb-0">
            <i className="bi bi-people-fill me-2 text-primary"></i>User Management
          </h2>
          <p className="text-muted">Manage system users, roles, and access controls.</p>
        </div>
      </div>
      <UserManagement />
    </div>
  );
};

export default UsersPage;
