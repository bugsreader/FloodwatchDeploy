import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Stations from './pages/Stations';
import StationDetails from './pages/StationDetails';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import RoutePlannerPage from './pages/RoutePlannerPage';
import UsersPage from './pages/UsersPage';
import AlertModal from './components/AlertModal';
import './App.css';

const AppContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const location = useLocation();

  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="d-flex bg-body-tertiary min-vh-100 position-relative">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-md-none" 
          style={{ zIndex: 1030 }}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-grow-1 d-flex flex-column main-content" style={{ overflowX: 'hidden' }}>
        <Navbar toggleSidebar={toggleSidebar} />
        <AlertModal />
        <main className="flex-grow-1 overflow-auto">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/stations" element={<ProtectedRoute><Stations /></ProtectedRoute>} />
            <Route path="/stations/:id" element={<ProtectedRoute><StationDetails /></ProtectedRoute>} />
            <Route path="/route-planner" element={<ProtectedRoute allowedRoles={['Admin', 'Premium User', 'Emergency/Municipal Role']}><RoutePlannerPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><Admin /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute requireAdmin={true}><UsersPage /></ProtectedRoute>} />
            <Route path="*" element={<div className="p-5 text-center text-muted"><h2>Page Not Found</h2></div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
