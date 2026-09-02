import React, { useState, useEffect } from 'react';
import { api } from '../../api/apiService.js';
import { initials } from '../../utils/formatters.js';
import EmptyState from '../../components/common/EmptyState.jsx';

export function HREmployees() {
  const [emps, setEmps] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    api.allEmployees().then(setEmps);
  }, []);

  const depts = [...new Set(emps.map(e => e.department).filter(Boolean))];
  const filtered = emps.filter(e => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">All Employees</h3>
        <span className="badge badge-leave">{emps.length} total</span>
      </div>
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Search by name, ID, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="all">All Departments</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? <EmptyState icon="👥" message="No employees found." /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Employee</th><th>Employee ID</th><th>Email</th><th>Phone</th><th>Department</th></tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td>
                    <div className="emp-row">
                      <div className="emp-avatar">{initials(e.name)}</div>
                      <span className="emp-name">{e.name}</span>
                    </div>
                  </td>
                  <td className="text-muted">{e.employee_id}</td>
                  <td>{e.email}</td>
                  <td>{e.phone || '—'}</td>
                  <td>{e.department || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HREmployees;
