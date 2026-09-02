import React from 'react';
import { initials } from '../../utils/formatters.js';

export function EmployeeProfile({ user }) {
  return (
    <div className="card">
      <div className="card-header"><h3 className="card-title">My Profile</h3></div>
      <div className="profile-card">
        <div className="profile-avatar">{initials(user.name)}</div>
        <div className="profile-info">
          <h3>{user.name}</h3>
          <p className="text-muted">{user.role === 'hr' ? 'HR Admin' : 'Employee'}</p>
          <div className="profile-detail">
            <div className="profile-detail-item"><label>Employee ID</label><span>{user.employee_id}</span></div>
            <div className="profile-detail-item"><label>Email</label><span>{user.email}</span></div>
            <div className="profile-detail-item"><label>Phone</label><span>{user.phone || '—'}</span></div>
            <div className="profile-detail-item"><label>Department</label><span>{user.department || '—'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeProfile;
