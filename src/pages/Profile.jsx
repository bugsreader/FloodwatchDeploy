import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, login } = useAuth(); // Assuming login updates user context or we could just rely on fetch
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/myprofile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          password: ''
        });
      } else if (response.status === 401) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
      setMessage({ type: 'danger', text: 'Failed to load profile data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
      password: ''
    });
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/myprofile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setProfile(data);
        setFormData({ ...formData, password: '' });
        // Optionally update auth context if needed
      } else {
        setMessage({ type: 'danger', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrength = () => {
    if (!formData.password) return { text: '', color: '' };
    if (formData.password.length < 6) return { text: 'Weak', color: 'text-danger' };
    if (formData.password.length < 10) return { text: 'Medium', color: 'text-warning' };
    return { text: 'Strong', color: 'text-success' };
  };

  const pwdStrength = getPasswordStrength();

  if (loading) {
    return (
      <div className="container-fluid p-4 d-flex justify-content-center align-items-center h-100">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold mb-0">
            My Profile
          </h2>
          <p className="text-muted">Manage your personal account settings and preferences.</p>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 bg-body">
            <div className="card-body p-4 p-md-5">

              {message.text && (
                <div className={`alert alert-${message.type} rounded-3 mb-4 d-flex align-items-center`}>
                  <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2 fs-5`}></i>
                  {message.text}
                </div>
              )}

              <div className="d-flex flex-column flex-sm-row align-items-center mb-5 pb-4 border-bottom">
                <div className="text-center text-sm-start">
                  <h4 className="fw-bold mb-1">{profile?.name || 'Loading...'}</h4>
                  <div className="d-flex align-items-center justify-content-center justify-content-sm-start gap-2 mb-1">
                    <span className="text-muted">{profile?.email}</span>
                  </div>
                  <span className="badge bg-primary rounded-pill text-capitalize px-3 py-2 mt-2 shadow-sm">
                    <i className="bi bi-shield-lock-fill me-1"></i> {profile?.role_name || profile?.role || 'User'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Full Name</label>
                    <input
                      type="text"
                      className="form-control rounded-3 py-2"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control rounded-3 py-2"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">New Password <span className="text-muted fw-normal fs-6">(Optional)</span></label>
                    <input
                      type="password"
                      className="form-control rounded-3 py-2"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                    />
                    {formData.password && (
                      <div className="form-text mt-2">
                        Strength: <strong className={pwdStrength.color}>{pwdStrength.text}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="d-flex gap-3 mt-5 pt-4 border-top justify-content-end">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary shadow-sm rounded-pill px-4" disabled={saving}>
                    {saving ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                    ) : (
                      <><i className="bi bi-save me-2"></i>Save Changes</>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
