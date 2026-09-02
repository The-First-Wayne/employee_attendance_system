import React, { useState, useEffect, useCallback } from 'react';
import { api, getEmployeeName, getEmployeeCode } from '../../api/apiService.js';
import { fmtDate, fmtTime, fmtHours, dateStr, initials } from '../../utils/formatters.js';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Alert from '../../components/common/Alert.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export function HRDashboard() {
  const [dash, setDash] = useState(null);
  const [att, setAtt] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = useCallback(async () => {
    setDash(await api.hrDashboard());
    setAtt(await api.allAttendance());
    setLeaves(await api.allLeaves());
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending = leaves.filter(l => l.status === 'Pending');
  const todayAtt = att.filter(a => a.date === dateStr(new Date()));

  const decide = async (id, d) => {
    try {
      await api.decideLeave(id, d);
      setMsg({ type: 'success', text: `Leave ${d}d successfully!` });
      load();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
  };

  return (
    <>
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="👥" label="Total Employees" value={dash?.total_employees ?? 0} color="blue" />
        <StatCard icon="✅" label="Present Today" value={dash?.present_today ?? 0} color="green" />
        <StatCard icon="❌" label="Absent Today" value={dash?.absent_today ?? 0} color="red" />
        <StatCard icon="🔵" label="On Leave" value={dash?.on_leave_today ?? 0} color="purple" />
        <StatCard icon="⏰" label="Late Today" value={dash?.late_today ?? 0} color="yellow" />
      </div>

      <Alert type={msg.type} message={msg.text} onDismiss={() => setMsg({ type: '', text: '' })} />

      {/* Today's Attendance */}
      <div className="card section">
        <div className="card-header"><h3 className="card-title">Today's Attendance</h3></div>
        {todayAtt.length === 0 ? <EmptyState icon="📋" message="No attendance records for today." /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Employee</th><th>ID</th><th>Check-In</th><th>Check-Out</th><th>Hours</th><th>Status</th></tr></thead>
              <tbody>
                {todayAtt.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="emp-row">
                        <div className="emp-avatar">{initials(getEmployeeName(r.employee_id))}</div>
                        <span className="emp-name">{getEmployeeName(r.employee_id)}</span>
                      </div>
                    </td>
                    <td className="text-muted">{getEmployeeCode(r.employee_id)}</td>
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

      {/* Pending Leave Requests */}
      <div className="card section">
        <div className="card-header">
          <h3 className="card-title">Pending Leave Requests</h3>
          <span className="badge badge-pending">{pending.length} pending</span>
        </div>
        {pending.length === 0 ? <EmptyState icon="✅" message="No pending leave requests." /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Actions</th></tr></thead>
              <tbody>
                {pending.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div className="emp-row">
                        <div className="emp-avatar">{initials(getEmployeeName(l.employee_id))}</div>
                        <span className="emp-name">{getEmployeeName(l.employee_id)}</span>
                      </div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{l.leave_type.replace('_', ' ')}</td>
                    <td>{fmtDate(l.start_date)}</td>
                    <td>{fmtDate(l.end_date)}</td>
                    <td>{l.reason || '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-success btn-sm" onClick={() => decide(l.id, 'approve')}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => decide(l.id, 'reject')}>Reject</button>
                      </div>
                    </td>
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

export default HRDashboard;
