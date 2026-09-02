import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/apiService.js';
import { fmtDate, fmtTime, fmtHours } from '../../utils/formatters.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Alert from '../../components/common/Alert.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export function EmployeeDashboard({ user }) {
  const [dash, setDash] = useState(null);
  const [att, setAtt] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [now, setNow] = useState(new Date());

  const load = useCallback(async () => {
    setDash(await api.employeeDashboard());
    setAtt(await api.myAttendance());
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const action = async (fn, successMsg) => {
    try {
      await fn();
      setMsg({ type: 'success', text: successMsg });
      load();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
  };

  const today = dash?.today;
  const bal = dash?.leave_balance;
  const hasCheckedIn = !!today?.check_in;
  const hasCheckedOut = !!today?.check_out;

  return (
    <>
      {/* Welcome Card */}
      <div className="welcome-card">
        <div>
          <h2>Welcome, {user.name.split(' ')[0]} 👋</h2>
          <p>{user.department} • {user.employee_id}</p>
        </div>
        <div className="welcome-clock">
          {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          <small>{now.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</small>
        </div>
      </div>

      <Alert type={msg.type} message={msg.text} onDismiss={() => setMsg({ type: '', text: '' })} />

      {/* Today's Status */}
      <div className="card today-card section">
        <div className="card-header">
          <h3 className="card-title">Today's Status</h3>
          {today && <StatusBadge status={today.status} />}
        </div>
        <div className="today-grid">
          <div className="today-item">
            <label>Check-In</label>
            <div className="value">{fmtTime(today?.check_in)}</div>
          </div>
          <div className="today-item">
            <label>Check-Out</label>
            <div className="value">{fmtTime(today?.check_out)}</div>
          </div>
          <div className="today-item">
            <label>Working Hours</label>
            <div className="value">{fmtHours(today?.working_hours)}</div>
          </div>
          <div className="today-item">
            <label>Status</label>
            <div className="value">{today?.status || 'Not checked in'}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-bar">
        <button className="btn btn-checkin" onClick={() => action(() => api.checkIn(), '✅ Checked in successfully!')} disabled={hasCheckedIn}>
          {hasCheckedIn ? '✓ Checked In' : '📥 Check In'}
        </button>
        <button className="btn btn-checkout" onClick={() => action(() => api.checkOut(), '✅ Checked out successfully!')} disabled={!hasCheckedIn || hasCheckedOut}>
          {hasCheckedOut ? '✓ Checked Out' : '📤 Check Out'}
        </button>
      </div>

      {/* Leave Balance */}
      <div className="section">
        <div className="section-header"><h3 className="section-title">Leave Balance</h3></div>
        <div className="leave-grid">
          <div className="leave-card">
            <div className="leave-card-icon" style={{ background: 'var(--primary-light)' }}>🏖️</div>
            <div className="leave-card-value">{bal?.casual_leave ?? '—'}</div>
            <div className="leave-card-label">Casual Leave</div>
          </div>
          <div className="leave-card">
            <div className="leave-card-icon" style={{ background: 'var(--clr-absent-bg)' }}>🏥</div>
            <div className="leave-card-value">{bal?.sick_leave ?? '—'}</div>
            <div className="leave-card-label">Sick Leave</div>
          </div>
          <div className="leave-card">
            <div className="leave-card-icon" style={{ background: 'var(--clr-present-bg)' }}>💰</div>
            <div className="leave-card-value">{bal?.paid_leave ?? '—'}</div>
            <div className="leave-card-label">Paid Leave</div>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="card section">
        <div className="card-header"><h3 className="card-title">Recent Attendance</h3></div>
        {att.length === 0 ? <EmptyState icon="📋" message="No attendance records yet." /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Check-In</th><th>Check-Out</th><th>Working Hours</th><th>Status</th></tr></thead>
              <tbody>
                {att.slice(0, 10).map(r => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.date)}</td>
                    <td>{fmtTime(r.check_in)}</td>
                    <td>{fmtTime(r.check_out)}</td>
                    <td>{fmtHours(r.working_hours)}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default EmployeeDashboard;
