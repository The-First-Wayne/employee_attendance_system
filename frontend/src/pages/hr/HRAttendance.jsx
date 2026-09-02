import React, { useState, useEffect } from 'react';
import { api, getEmployeeName, getEmployeeCode } from '../../api/apiService.js';
import { fmtDate, fmtTime, fmtHours, initials } from '../../utils/formatters.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export function HRAttendance() {
  const [att, setAtt] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.allAttendance().then(setAtt);
  }, []);

  const filtered = att.filter(a => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const name = getEmployeeName(a.employee_id).toLowerCase();
    const eid = getEmployeeCode(a.employee_id).toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || eid.includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="card">
      <div className="card-header"><h3 className="card-title">All Attendance Records</h3></div>
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Search employee..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
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
            <thead><tr><th>Employee</th><th>ID</th><th>Date</th><th>Check-In</th><th>Check-Out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="emp-row">
                      <div className="emp-avatar">{initials(getEmployeeName(r.employee_id))}</div>
                      <span className="emp-name">{getEmployeeName(r.employee_id)}</span>
                    </div>
                  </td>
                  <td className="text-muted">{getEmployeeCode(r.employee_id)}</td>
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

export default HRAttendance;
