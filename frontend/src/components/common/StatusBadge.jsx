import React from 'react';

export function StatusBadge({ status }) {
  const map = {
    'Present':  { cls: 'badge-present', icon: '🟢' },
    'Late':     { cls: 'badge-late', icon: '🟡' },
    'Absent':   { cls: 'badge-absent', icon: '🔴' },
    'On Leave': { cls: 'badge-leave', icon: '🔵' },
    'Half Day': { cls: 'badge-halfday', icon: '🟠' },
    'Holiday':  { cls: 'badge-holiday', icon: '⚪' },
    'Pending':  { cls: 'badge-pending', icon: '⏳' },
    'Approved': { cls: 'badge-approved', icon: '✅' },
    'Rejected': { cls: 'badge-rejected', icon: '❌' },
  };
  const m = map[status] || { cls: 'badge-holiday', icon: '⚪' };
  return <span className={`badge ${m.cls}`}>{m.icon} {status}</span>;
}

export default StatusBadge;
