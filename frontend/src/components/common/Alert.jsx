import React from 'react';

export function Alert({ type, message, onDismiss }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type}`}>
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button className="modal-close" style={{ width: 24, height: 24, fontSize: '0.75rem' }} onClick={onDismiss}>
          ✕
        </button>
      )}
    </div>
  );
}

export default Alert;
