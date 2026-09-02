import React, { useState, useEffect } from 'react';
import { api } from './api/apiService.js';
import AppLayout from './components/layout/AppLayout.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';

import EmployeeDashboard from './pages/employee/EmployeeDashboard.jsx';
import EmployeeAttendance from './pages/employee/EmployeeAttendance.jsx';
import EmployeeLeaves from './pages/employee/EmployeeLeaves.jsx';
import EmployeeProfile from './pages/employee/EmployeeProfile.jsx';

import HRDashboard from './pages/hr/HRDashboard.jsx';
import HREmployees from './pages/hr/HREmployees.jsx';
import HRAttendance from './pages/hr/HRAttendance.jsx';
import HRLeaves from './pages/hr/HRLeaves.jsx';

const getToken = () => localStorage.getItem('token');

export function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getToken()) {
      api.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-body)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏱️</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPage('dashboard');
  };

  const renderPage = () => {
    if (user.role === 'hr') {
      switch (page) {
        case 'employees': return <HREmployees />;
        case 'attendance': return <HRAttendance />;
        case 'leaves': return <HRLeaves />;
        default: return <HRDashboard />;
      }
    } else {
      switch (page) {
        case 'attendance': return <EmployeeAttendance user={user} />;
        case 'leaves': return <EmployeeLeaves user={user} />;
        case 'profile': return <EmployeeProfile user={user} />;
        default: return <EmployeeDashboard user={user} />;
      }
    }
  };

  return (
    <AppLayout user={user} onLogout={logout} page={page} setPage={setPage}>
      {renderPage()}
    </AppLayout>
  );
}

export default App;
