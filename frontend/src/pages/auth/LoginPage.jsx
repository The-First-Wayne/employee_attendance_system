import React, { useState } from 'react';
import { api } from '../../api/apiService.js';
import { sleep } from '../../utils/formatters.js';
import Alert from '../../components/common/Alert.jsx';

export function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', employee_id: '', name: '', phone: '', department: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await sleep(400); // simulate network
      if (mode === 'login') {
        const d = await api.login(form.email, form.password);
        onLogin(d.user);
      } else {
        await api.register(form);
        setMode('login');
        setErr('');
      }
    } catch (x) {
      setErr(x.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-content">
          <span className="auth-brand-icon">⏱️</span>
          <h1>Employee Attendance System</h1>
          <p>Track attendance, manage leaves, and monitor working hours — all in one place.</p>
        </div>
      </div>
      <div className="auth-form-panel">
        <div className="auth-form-container" key={mode}>
          <h2>{mode === 'login' ? 'Welcome back' : 'Create Account'}</h2>
          <p className="subtitle">{mode === 'login' ? 'Sign in to your account' : 'Register as a new employee'}</p>
          <Alert type="error" message={err} onDismiss={() => setErr('')} />
          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Employee ID</label>
                    <input required placeholder="e.g. EMP004" value={form.employee_id} onChange={e => set('employee_id', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input required placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input placeholder="Phone number" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input placeholder="e.g. Engineering" value={form.department} onChange={e => set('department', e.target.value)} />
                  </div>
                </div>
              </>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" required placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" required placeholder="Your password" value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
            <button className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button className="auth-link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
            </button>
          </div>
          <div className="auth-demo">
            <strong>Demo Credentials</strong><br/>
            HR: hr@example.com / Admin@123<br/>
            Employee: rahul@example.com / Pass@123
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
