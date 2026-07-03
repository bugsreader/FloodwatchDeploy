import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [roles, setRoles] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 10;
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: ''
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const skip = (page - 1) * limit;
      const response = await fetch(`${API_URL}/api/users/?skip=${skip}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotal(data.total);
      } else {
        setMessage({ type: 'danger', text: 'Failed to fetch users' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Network error fetching users' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Failed to fetch roles', error);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role_id: user.role_id || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role_id: roles.length > 0 ? roles.find(r => r.name === 'General User')?.id || roles[0].id : ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem('token');
      const isEdit = !!editingUser;
      const url = isEdit ? `${API_URL}/api/users/${editingUser.id}` : `${API_URL}/api/users/`;
      const method = isEdit ? 'PUT' : 'POST';
      
      const payload = { ...formData };
      if (isEdit && !payload.password) {
        delete payload.password; // Don't send empty password on edit
      }
      
      // Ensure role_id is integer
      payload.role_id = parseInt(payload.role_id, 10);
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: `User successfully ${isEdit ? 'updated' : 'created'}.` });
        handleCloseModal();
        fetchUsers();
      } else {
        setMessage({ type: 'danger', text: data.detail || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Network error saving user' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'User deleted successfully.' });
        fetchUsers();
      } else {
        const data = await response.json();
        setMessage({ type: 'danger', text: data.detail || 'Failed to delete user.' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Network error deleting user.' });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="card border-0 shadow-sm rounded-4 bg-body mt-4">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="card-title fw-bold mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-people text-primary"></i> User Management
          </h5>
          <button className="btn btn-primary rounded-pill px-3 shadow-sm fw-semibold" onClick={() => handleOpenModal()}>
            <i className="bi bi-person-plus-fill me-2"></i> Add User
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-4 d-flex align-items-center small rounded-3`}>
            <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
            {message.text}
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover align-middle border">
            <thead className="table-light">
              <tr>
                <th scope="col" className="text-secondary small text-uppercase">ID</th>
                <th scope="col" className="text-secondary small text-uppercase">Name</th>
                <th scope="col" className="text-secondary small text-uppercase">Email</th>
                <th scope="col" className="text-secondary small text-uppercase">Role</th>
                <th scope="col" className="text-secondary small text-uppercase text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">No users found.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td><span className="fw-semibold text-secondary">#{u.id}</span></td>
                    <td>{u.name} {currentUser?.id === u.id && <span className="badge bg-info ms-2">You</span>}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role_name === 'Admin' ? 'bg-primary' : u.role_name === 'Premium User' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                        {u.role_name}
                      </span>
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary rounded-3 me-2" onClick={() => handleOpenModal(u)}>
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger rounded-3" onClick={() => handleDelete(u.id)} disabled={u.id === currentUser?.id || u.id === 1}>
                        <i className="bi bi-trash3-fill"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="text-muted small">Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} users</span>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => p - 1)}>Previous</button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => p + 1)}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1045 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-bottom-0 pb-0">
                  <h5 className="modal-title fw-bold">
                    {editingUser ? 'Edit User' : 'Create New User'}
                  </h5>
                  <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                </div>
                <form onSubmit={handleSave}>
                  <div className="modal-body">
                    {message.text && modalLoading === false && (
                      <div className={`alert alert-${message.type} py-2 mb-3 small`}>{message.text}</div>
                    )}
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-bold">Full Name</label>
                      <input type="text" className="form-control rounded-3" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-bold">Email Address</label>
                      <input type="email" className="form-control rounded-3" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-bold">Role</label>
                      <select className="form-select rounded-3" value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})} required>
                        <option value="">Select a role...</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-bold">Password {editingUser && '(Leave blank to keep unchanged)'}</label>
                      <input type="password" className="form-control rounded-3" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} minLength={6} required={!editingUser} />
                    </div>
                  </div>
                  <div className="modal-footer border-top-0 pt-0">
                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={handleCloseModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4 shadow-sm" disabled={modalLoading}>
                      {modalLoading ? <span className="spinner-border spinner-border-sm"></span> : 'Save User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;
