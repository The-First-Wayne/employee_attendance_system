import React, { useState, useEffect } from 'react';
import { fmtTime, initials } from '../../utils/formatters.js';

export function AppLayout({ user, onLogout, page, setPage, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const empNav = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'attendance', icon: '⏰', label: 'Attendance' },
    { id: 'leaves', icon: '📅', label: 'Leaves' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ];
  const hrNav = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'employees', icon: '👥', label: 'Employees' },
    { id: 'attendance', icon: '⏰', label: 'Attendance' },
    { id: 'leaves', icon: '📅', label: 'Leave Requests' },
  ];
  const nav = user.role === 'hr' ? hrNav : empNav;
  const pageTitle = nav.find(n => n.id === page)?.label || 'Dashboard';

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">⏱️</div>
          <div className="sidebar-brand-text">
            Attendance<br /><small>Management System</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">{user.role === 'hr' ? 'HR Panel' : 'Employee'}</div>
          {nav.map(n => (
            <button
              key={n.id}
              className={`sidebar-item ${page === n.id ? 'active' : ''}`}
              onClick={() => { setPage(n.id); setSidebarOpen(false); }}
            >
              <span className="sidebar-item-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials(user.name)}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role === 'hr' ? 'HR Admin' : user.department}</div>
          </div>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <span className="topbar-title">{pageTitle}</span>
          </div>
          <div className="topbar-right">
            <span className="topbar-time">
              {now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} • {fmtTime(now)}
            </span>
            <button className="btn-logout" onClick={onLogout}>Logout</button>
          </div>
        </header>
        <div className="content-area">{children}</div>
      </div>
    </div>
  );
}

export default AppLayout;
