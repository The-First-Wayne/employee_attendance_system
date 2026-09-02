import React from 'react';

export function EmptyState({ icon, message }) {
  return (
    <div className="table-empty">
      <span>{icon || '📋'}</span>
      {message || 'No records found.'}
    </div>
  );
}

export default EmptyState;
