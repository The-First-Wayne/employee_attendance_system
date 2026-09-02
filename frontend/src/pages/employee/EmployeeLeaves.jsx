import React, { useState, useEffect } from 'react';
import { api } from '../../api/apiService.js';
import { fmtDate } from '../../utils/formatters.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Alert from '../../components/common/Alert.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export function EmployeeLeaves({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [dash, setDash] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ leave_type: 'casual_leave', start_date: '', end_date: '', reason: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = async () => {
    setLeaves(await api.myLeaves());
    setDash(await api.employeeDashboard());
  };

  useEffect(() => { load(); }, []);

  const submit = async e => {
    e.preventDefault();
    try {
      await api.requestLeave(form);
      setMsg({ type: 'success', text: '✅ Leave request submitted!' });
      setShowModal(false);
      setForm({ leave_type: 'casual_leave', start_date: '', end_date: '', reason: '' });
      load();
    } catch (x) {
      setMsg({ type: 'error', text: x.message });
    }
  };

  const bal = dash?.leave_balance;

  return (
    <>
      <Alert type={msg.type} message={msg.text} onDismiss={() => setMsg({ type: '', text: '' })} />

      {/* Leave Balance */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Leave Balance</h3>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Request Leave</button>
        </div>
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

      {/* Leave History */}
      <div className="card section">
        <div className="card-header"><h3 className="card-title">Leave Requests</h3></div>
        {leaves.length === 0 ? <EmptyState icon="📅" message="No leave requests yet." /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Type</th><th>Start Date</th><th>End Date</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l.id}>
                    <td style={{ textTransform: 'capitalize' }}>{l.leave_type.replace('_', ' ')}</td>
                    <td>{fmtDate(l.start_date)}</td>
                    <td>{fmtDate(l.end_date)}</td>
                    <td>{l.reason || '—'}</td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leave Request Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Request Leave"
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" form="leave-form">Submit Request</button></>}>
        <form id="leave-form" onSubmit={submit}>
          <div className="form-group">
            <label>Leave Type</label>
            <select value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })}>
              <option value="casual_leave">Casual Leave</option>
              <option value="sick_leave">Sick Leave</option>
              <option value="paid_leave">Paid Leave</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Reason</label>
            <textarea placeholder="Briefly describe your reason..." value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          </div>
        </form>
      </Modal>
    </>
  );
}

export default EmployeeLeaves;
