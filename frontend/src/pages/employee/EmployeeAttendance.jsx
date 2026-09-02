import React, { useState, useEffect } from 'react';
import { api } from '../../api/apiService.js';
import { fmtDate, fmtTime, fmtHours } from '../../utils/formatters.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export function EmployeeAttendance({ user }) {
  const [att, setAtt] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.myAttendance().then(setAtt);
  }, []);

  const filtered = filter === 'all' ? att : att.filter(a => a.status === filter);

  return (
    <div className="card section">
      <div className="card-header">
        <h3 className="card-title">Attendance History</h3>
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Late">Late</option>
          <option value="Absent">Absent</option>
          <option value="On Leave">On Leave</option>
          <option value="Half Day">Half Day</option>
        </select>
      </div>
      {filtered.length === 0 ? <EmptyState icon="📋" message="No records found." /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Check-In</th><th>Check-Out</th><th>Working Hours</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(r => (
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
  );
}

export default EmployeeAttendance;
