import React, { useState, useEffect } from 'react';
import { api, getEmployeeName } from '../../api/apiService.js';
import { fmtDate, initials } from '../../utils/formatters.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Alert from '../../components/common/Alert.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export function HRLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = async () => setLeaves(await api.allLeaves());
  useEffect(() => { load(); }, []);

  const decide = async (id, d) => {
    try {
      await api.decideLeave(id, d);
      setMsg({ type: 'success', text: `Leave ${d}d successfully!` });
      load();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  return (
    <>
      <Alert type={msg.type} message={msg.text} onDismiss={() => setMsg({ type: '', text: '' })} />
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Leave Requests</h3>
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        {filtered.length === 0 ? <EmptyState icon="📅" message="No leave requests found." /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(l => (
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
                    <td><StatusBadge status={l.status} /></td>
                    <td>
                      {l.status === 'Pending' ? (
                        <div className="table-actions">
                          <button className="btn btn-success btn-sm" onClick={() => decide(l.id, 'approve')}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => decide(l.id, 'reject')}>Reject</button>
                        </div>
                      ) : '—'}
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

export default HRLeaves;
