import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

// ═══════════════════════════════════════════════════════════════════
//  CONFIGURATION
// ═══════════════════════════════════════════════════════════════════
const USE_MOCK = true;
const API_BASE = 'http://localhost:8000/api';

// ═══════════════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════
function fmtDate(d) {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(d) {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtHours(h) {
  if (!h || h === 0) return '—';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
}
function dateStr(d) { return d.toISOString().split('T')[0]; }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function initials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════════════
//  MOCK DATA STORE
// ═══════════════════════════════════════════════════════════════════
const mockStore = {
  nextUserId: 5,
  nextAttId: 100,
  nextLeaveId: 100,
  users: [
    { id: 1, employee_id: 'HR001', name: 'HR Admin', email: 'hr@example.com', phone: '9876543210', department: 'Human Resources', role: 'hr', password: 'Admin@123' },
    { id: 2, employee_id: 'EMP001', name: 'Rahul Sharma', email: 'rahul@example.com', phone: '9876543211', department: 'Engineering', role: 'employee', password: 'Pass@123' },
    { id: 3, employee_id: 'EMP002', name: 'Priya Patel', email: 'priya@example.com', phone: '9876543212', department: 'Design', role: 'employee', password: 'Pass@123' },
    { id: 4, employee_id: 'EMP003', name: 'Amit Kumar', email: 'amit@example.com', phone: '9876543213', department: 'Marketing', role: 'employee', password: 'Pass@123' },
  ],
  balances: {
    2: { casual_leave: 4, sick_leave: 5, paid_leave: 10 },
    3: { casual_leave: 6, sick_leave: 6, paid_leave: 11 },
    4: { casual_leave: 3, sick_leave: 4, paid_leave: 8 },
  },
  attendance: [],
  leaves: [
    { id: 1, employee_id: 2, leave_type: 'casual_leave', start_date: dateStr(daysAgo(5)), end_date: dateStr(daysAgo(5)), reason: 'Personal work', status: 'Approved', created_at: dateStr(daysAgo(7)) },
    { id: 2, employee_id: 3, leave_type: 'sick_leave', start_date: dateStr(daysAgo(6)), end_date: dateStr(daysAgo(6)), reason: 'Not feeling well', status: 'Approved', created_at: dateStr(daysAgo(8)) },
    { id: 3, employee_id: 4, leave_type: 'casual_leave', start_date: dateStr(daysAgo(2)), end_date: dateStr(daysAgo(1)), reason: 'Family function', status: 'Pending', created_at: dateStr(daysAgo(3)) },
  ],
};

// Generate realistic attendance for the past 7 working days
(function seedAttendance() {
  let id = 1;
  const patterns = {
    2: [ // Rahul
      { status: 'Present', ci: '09:12', co: '18:05', h: 8.88 },
      { status: 'Present', ci: '09:08', co: '18:15', h: 9.12 },
      { status: 'Late',    ci: '09:45', co: '18:10', h: 8.42 },
      { status: 'Present', ci: '09:05', co: '18:00', h: 8.92 },
      { status: 'On Leave' },
      { status: 'Present', ci: '09:20', co: '17:55', h: 8.58 },
      { status: 'Present', ci: '09:02', co: '18:08', h: 9.1 },
    ],
    3: [ // Priya
      { status: 'Present', ci: '09:00', co: '18:10', h: 9.17 },
      { status: 'Late',    ci: '09:50', co: '18:30', h: 8.67 },
      { status: 'Present', ci: '09:15', co: '18:00', h: 8.75 },
      { status: 'Present', ci: '09:10', co: '17:50', h: 8.67 },
      { status: 'Present', ci: '09:05', co: '18:20', h: 9.25 },
      { status: 'On Leave' },
      { status: 'Present', ci: '09:22', co: '18:05', h: 8.72 },
    ],
    4: [ // Amit
      { status: 'Late',    ci: '10:05', co: '17:30', h: 7.42 },
      { status: 'Present', ci: '09:10', co: '18:00', h: 8.83 },
      { status: 'Absent' },
      { status: 'Present', ci: '09:25', co: '18:15', h: 8.83 },
      { status: 'Half Day', ci: '09:10', co: '13:30', h: 4.33 },
      { status: 'Present', ci: '09:00', co: '18:05', h: 9.08 },
      { status: 'Present', ci: '09:15', co: '18:10', h: 8.92 },
    ],
  };
  for (const empId of [2, 3, 4]) {
    patterns[empId].forEach((p, i) => {
      const d = daysAgo(i + 1);
      if (d.getDay() === 0 || d.getDay() === 6) return;
      const ds = dateStr(d);
      const rec = { id: id++, employee_id: empId, date: ds, status: p.status, working_hours: p.h || 0, check_in: null, check_out: null };
      if (p.ci) rec.check_in = `${ds}T${p.ci}:00`;
      if (p.co) rec.check_out = `${ds}T${p.co}:00`;
      mockStore.attendance.push(rec);
    });
  }
  mockStore.nextAttId = id + 1;
})();

// ═══════════════════════════════════════════════════════════════════
//  MOCK API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════
function userOut(u) {
  const { password, ...rest } = u;
  return rest;
}

const mockApi = {
  login(email, password) {
    const u = mockStore.users.find(x => x.email === email);
    if (!u || u.password !== password) throw new Error('Invalid email or password');
    const token = btoa(JSON.stringify({ sub: u.id, role: u.role }));
    localStorage.setItem('token', token);
    return { access_token: token, user: userOut(u) };
  },
  register(data) {
    if (mockStore.users.find(x => x.email === data.email || x.employee_id === data.employee_id))
      throw new Error('Email or employee ID already exists');
    const u = { id: mockStore.nextUserId++, ...data, role: 'employee' };
    mockStore.users.push(u);
    mockStore.balances[u.id] = { casual_leave: 6, sick_leave: 6, paid_leave: 12 };
    return userOut(u);
  },
  me() {
    const t = localStorage.getItem('token');
    if (!t) throw new Error('Not authenticated');
    const { sub } = JSON.parse(atob(t));
    const u = mockStore.users.find(x => x.id === sub);
    if (!u) throw new Error('User not found');
    return userOut(u);
  },
  checkIn(userId) {
    const today = dateStr(new Date());
    let rec = mockStore.attendance.find(a => a.employee_id === userId && a.date === today);
    if (rec && rec.check_in) throw new Error('Already checked in today');
    const now = new Date();
    if (!rec) {
      rec = { id: mockStore.nextAttId++, employee_id: userId, date: today, check_in: null, check_out: null, working_hours: 0, status: 'Absent' };
      mockStore.attendance.push(rec);
    }
    rec.check_in = now.toISOString();
    const h = now.getHours(); const m = now.getMinutes();
    rec.status = (h > 9 || (h === 9 && m > 30)) ? 'Late' : 'Present';
    return { ...rec };
  },
  checkOut(userId) {
    const today = dateStr(new Date());
    const rec = mockStore.attendance.find(a => a.employee_id === userId && a.date === today);
    if (!rec || !rec.check_in) throw new Error('Please check in first');
    if (rec.check_out) throw new Error('Already checked out today');
    const now = new Date();
    rec.check_out = now.toISOString();
    rec.working_hours = Math.round(((now - new Date(rec.check_in)) / 3600000) * 100) / 100;
    if (rec.working_hours >= 8) rec.status = rec.status === 'Late' ? 'Late' : 'Present';
    else if (rec.working_hours >= 4) rec.status = 'Half Day';
    else rec.status = 'Late';
    return { ...rec };
  },
  myAttendance(userId) {
    return mockStore.attendance.filter(a => a.employee_id === userId).sort((a, b) => b.date.localeCompare(a.date));
  },
  allAttendance() {
    return [...mockStore.attendance].sort((a, b) => b.date.localeCompare(a.date));
  },
  employeeDashboard(userId) {
    const today = mockStore.attendance.find(a => a.employee_id === userId && a.date === dateStr(new Date()));
    const bal = mockStore.balances[userId] || { casual_leave: 0, sick_leave: 0, paid_leave: 0 };
    return { today: today || null, leave_balance: { ...bal } };
  },
  hrDashboard() {
    const today = dateStr(new Date());
    const emps = mockStore.users.filter(u => u.role === 'employee');
    const todayRecs = mockStore.attendance.filter(a => a.date === today);
    const present = todayRecs.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const onLeave = todayRecs.filter(a => a.status === 'On Leave').length;
    const late = todayRecs.filter(a => a.status === 'Late').length;
    return {
      total_employees: emps.length,
      present_today: present,
      absent_today: Math.max(emps.length - present - onLeave, 0),
      on_leave_today: onLeave,
      late_today: late,
    };
  },
  requestLeave(userId, data) {
    if (data.end_date < data.start_date) throw new Error('End date cannot be before start date');
    if (!['casual_leave', 'sick_leave', 'paid_leave'].includes(data.leave_type)) throw new Error('Invalid leave type');
    const req = { id: mockStore.nextLeaveId++, employee_id: userId, ...data, status: 'Pending', created_at: new Date().toISOString() };
    mockStore.leaves.push(req);
    return req;
  },
  myLeaves(userId) {
    return mockStore.leaves.filter(l => l.employee_id === userId).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  },
  allLeaves() {
    return [...mockStore.leaves].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  },
  decideLeave(leaveId, decision) {
    const leave = mockStore.leaves.find(l => l.id === leaveId);
    if (!leave) throw new Error('Leave not found');
    if (leave.status !== 'Pending') throw new Error('Leave already processed');
    if (decision === 'approve') {
      const s = new Date(leave.start_date); const e = new Date(leave.end_date);
      const days = Math.round((e - s) / 86400000) + 1;
      const bal = mockStore.balances[leave.employee_id];
      if (!bal || bal[leave.leave_type] < days) throw new Error('Insufficient leave balance');
      bal[leave.leave_type] -= days;
      leave.status = 'Approved';
      // Add "On Leave" attendance records
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        const ds = dateStr(d);
        if (!mockStore.attendance.find(a => a.employee_id === leave.employee_id && a.date === ds)) {
          mockStore.attendance.push({ id: mockStore.nextAttId++, employee_id: leave.employee_id, date: ds, check_in: null, check_out: null, working_hours: 0, status: 'On Leave' });
        }
      }
    } else {
      leave.status = 'Rejected';
    }
    return { ...leave };
  },
  allEmployees() {
    return mockStore.users.filter(u => u.role === 'employee').map(userOut);
  },
};

// ═══════════════════════════════════════════════════════════════════
//  API LAYER (delegates to mock or real backend)
// ═══════════════════════════════════════════════════════════════════
const getToken = () => localStorage.getItem('token');

async function realApi(path, options = {}) {
  const r = await fetch(API_BASE + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}), ...(options.headers || {}) },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.detail || 'Request failed');
  return d;
}

const api = {
  async login(email, password) {
    if (USE_MOCK) return mockApi.login(email, password);
    return realApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  async register(data) {
    if (USE_MOCK) return mockApi.register(data);
    return realApi('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  },
  async me() {
    if (USE_MOCK) return mockApi.me();
    return realApi('/me');
  },
  async checkIn() {
    if (USE_MOCK) { const u = mockApi.me(); return mockApi.checkIn(u.id); }
    return realApi('/attendance/check-in', { method: 'POST' });
  },
  async checkOut() {
    if (USE_MOCK) { const u = mockApi.me(); return mockApi.checkOut(u.id); }
    return realApi('/attendance/check-out', { method: 'POST' });
  },
  async myAttendance() {
    if (USE_MOCK) { const u = mockApi.me(); return mockApi.myAttendance(u.id); }
    return realApi('/attendance/my');
  },
  async allAttendance() {
    if (USE_MOCK) return mockApi.allAttendance();
    return realApi('/attendance');
  },
  async employeeDashboard() {
    if (USE_MOCK) { const u = mockApi.me(); return mockApi.employeeDashboard(u.id); }
    return realApi('/dashboard/employee');
  },
  async hrDashboard() {
    if (USE_MOCK) return mockApi.hrDashboard();
    return realApi('/dashboard/hr');
  },
  async requestLeave(data) {
    if (USE_MOCK) { const u = mockApi.me(); return mockApi.requestLeave(u.id, data); }
    return realApi('/leaves', { method: 'POST', body: JSON.stringify(data) });
  },
  async myLeaves() {
    if (USE_MOCK) { const u = mockApi.me(); return mockApi.myLeaves(u.id); }
    return realApi('/leaves/my');
  },
  async allLeaves() {
    if (USE_MOCK) return mockApi.allLeaves();
    return realApi('/leaves');
  },
  async decideLeave(id, decision) {
    if (USE_MOCK) return mockApi.decideLeave(id, decision);
    return realApi(`/leaves/${id}/${decision}`, { method: 'PATCH' });
  },
  async allEmployees() {
    if (USE_MOCK) return mockApi.allEmployees();
    return realApi('/employees');
  },
};

// ═══════════════════════════════════════════════════════════════════
//  SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function StatusBadge({ status }) {
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

function StatCard({ icon, label, value, color = 'blue' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function Alert({ type, message, onDismiss }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type}`}>
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && <button className="modal-close" style={{ width: 24, height: 24, fontSize: '0.75rem' }} onClick={onDismiss}>✕</button>}
    </div>
  );
}

function EmptyState({ icon, message }) {
  return <div className="table-empty"><span>{icon || '📋'}</span>{message || 'No records found.'}</div>;
}

// ═══════════════════════════════════════════════════════════════════
//  AUTH PAGE (Login / Register)
// ═══════════════════════════════════════════════════════════════════

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', employee_id: '', name: '', phone: '', department: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    setErr(''); setLoading(true);
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
    } catch (x) { setErr(x.message); }
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

// ═══════════════════════════════════════════════════════════════════
//  APP LAYOUT (Sidebar + Header + Content)
// ═══════════════════════════════════════════════════════════════════

function AppLayout({ user, onLogout, page, setPage, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const empNav = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'attendance', icon: '⏰', label: 'Attendance' },
    { id: 'leaves', icon: '📅', label: 'Leaves' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ];
  const hrNav = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'employees', icon: '👥', label: 'Employees' },
    { id: 'attendance', icon: '⏰', label: 'Attendance' },
    { id: 'leaves', icon: '📅', label: 'Leave Requests' },
  ];
  const nav = user.role === 'hr' ? hrNav : empNav;
  const pageTitle = nav.find(n => n.id === page)?.label || 'Dashboard';

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">⏱️</div>
          <div className="sidebar-brand-text">
            Attendance<br /><small>Management System</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">{user.role === 'hr' ? 'HR Panel' : 'Employee'}</div>
          {nav.map(n => (
            <button key={n.id} className={`sidebar-item ${page === n.id ? 'active' : ''}`}
              onClick={() => { setPage(n.id); setSidebarOpen(false); }}>
              <span className="sidebar-item-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials(user.name)}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role === 'hr' ? 'HR Admin' : user.department}</div>
          </div>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <span className="topbar-title">{pageTitle}</span>
          </div>
          <div className="topbar-right">
            <span className="topbar-time">{now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} • {fmtTime(now)}</span>
            <button className="btn-logout" onClick={onLogout}>Logout</button>
          </div>
        </header>
        <div className="content-area">{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  EMPLOYEE PAGES
// ═══════════════════════════════════════════════════════════════════

function EmployeeDashboard({ user }) {
  const [dash, setDash] = useState(null);
  const [att, setAtt] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [now, setNow] = useState(new Date());

  const load = useCallback(async () => {
    setDash(await api.employeeDashboard());
    setAtt(await api.myAttendance());
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const action = async (fn, successMsg) => {
    try {
      await fn();
      setMsg({ type: 'success', text: successMsg });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
  };

  const today = dash?.today;
  const bal = dash?.leave_balance;
  const hasCheckedIn = !!today?.check_in;
  const hasCheckedOut = !!today?.check_out;

  return (
    <>
      {/* Welcome Card */}
      <div className="welcome-card">
        <div>
          <h2>Welcome, {user.name.split(' ')[0]} 👋</h2>
          <p>{user.department} • {user.employee_id}</p>
        </div>
        <div className="welcome-clock">
          {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          <small>{now.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</small>
        </div>
      </div>

      <Alert type={msg.type} message={msg.text} onDismiss={() => setMsg({ type: '', text: '' })} />

      {/* Today's Status */}
      <div className="card today-card section">
        <div className="card-header">
          <h3 className="card-title">Today's Status</h3>
          {today && <StatusBadge status={today.status} />}
        </div>
        <div className="today-grid">
          <div className="today-item">
            <label>Check-In</label>
            <div className="value">{fmtTime(today?.check_in)}</div>
          </div>
          <div className="today-item">
            <label>Check-Out</label>
            <div className="value">{fmtTime(today?.check_out)}</div>
          </div>
          <div className="today-item">
            <label>Working Hours</label>
            <div className="value">{fmtHours(today?.working_hours)}</div>
          </div>
          <div className="today-item">
            <label>Status</label>
            <div className="value">{today?.status || 'Not checked in'}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-bar">
        <button className="btn btn-checkin" onClick={() => action(() => api.checkIn(), '✅ Checked in successfully!')} disabled={hasCheckedIn}>
          {hasCheckedIn ? '✓ Checked In' : '📥 Check In'}
        </button>
        <button className="btn btn-checkout" onClick={() => action(() => api.checkOut(), '✅ Checked out successfully!')} disabled={!hasCheckedIn || hasCheckedOut}>
          {hasCheckedOut ? '✓ Checked Out' : '📤 Check Out'}
        </button>
      </div>

      {/* Leave Balance */}
      <div className="section">
        <div className="section-header"><h3 className="section-title">Leave Balance</h3></div>
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

      {/* Recent Attendance */}
      <div className="card section">
        <div className="card-header"><h3 className="card-title">Recent Attendance</h3></div>
        {att.length === 0 ? <EmptyState icon="📋" message="No attendance records yet." /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Check-In</th><th>Check-Out</th><th>Working Hours</th><th>Status</th></tr></thead>
              <tbody>
                {att.slice(0, 10).map(r => (
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
    </>
  );
}

function EmployeeAttendance({ user }) {
  const [att, setAtt] = useState([]);
  const [filter, setFilter] = useState('all');
  useEffect(() => { api.myAttendance().then(setAtt); }, []);
  const filtered = filter === 'all' ? att : att.filter(a => a.status === filter);
  return (
    <>
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
    </>
  );
}

function EmployeeLeaves({ user }) {
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
    } catch (x) { setMsg({ type: 'error', text: x.message }); }
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

function EmployeeProfile({ user }) {
  return (
    <div className="card">
      <div className="card-header"><h3 className="card-title">My Profile</h3></div>
      <div className="profile-card">
        <div className="profile-avatar">{initials(user.name)}</div>
        <div className="profile-info">
          <h3>{user.name}</h3>
          <p className="text-muted">{user.role === 'hr' ? 'HR Admin' : 'Employee'}</p>
          <div className="profile-detail">
            <div className="profile-detail-item"><label>Employee ID</label><span>{user.employee_id}</span></div>
            <div className="profile-detail-item"><label>Email</label><span>{user.email}</span></div>
            <div className="profile-detail-item"><label>Phone</label><span>{user.phone || '—'}</span></div>
            <div className="profile-detail-item"><label>Department</label><span>{user.department || '—'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  HR PAGES
// ═══════════════════════════════════════════════════════════════════

function HRDashboard() {
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
  const empName = (id) => mockStore.users.find(u => u.id === id)?.name || `EMP#${id}`;
  const empEmpId = (id) => mockStore.users.find(u => u.id === id)?.employee_id || '';

  const decide = async (id, d) => {
    try {
      await api.decideLeave(id, d);
      setMsg({ type: 'success', text: `Leave ${d}d successfully!` });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
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
                    <td><div className="emp-row"><div className="emp-avatar">{initials(empName(r.employee_id))}</div><span className="emp-name">{empName(r.employee_id)}</span></div></td>
                    <td className="text-muted">{empEmpId(r.employee_id)}</td>
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
        <div className="card-header"><h3 className="card-title">Pending Leave Requests</h3><span className="badge badge-pending">{pending.length} pending</span></div>
        {pending.length === 0 ? <EmptyState icon="✅" message="No pending leave requests." /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Actions</th></tr></thead>
              <tbody>
                {pending.map(l => (
                  <tr key={l.id}>
                    <td><div className="emp-row"><div className="emp-avatar">{initials(empName(l.employee_id))}</div><span className="emp-name">{empName(l.employee_id)}</span></div></td>
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

function HREmployees() {
  const [emps, setEmps] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  useEffect(() => { api.allEmployees().then(setEmps); }, []);

  const depts = [...new Set(emps.map(e => e.department).filter(Boolean))];
  const filtered = emps.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.employee_id.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="card">
      <div className="card-header"><h3 className="card-title">All Employees</h3><span className="badge badge-leave">{emps.length} total</span></div>
      <div className="filter-bar">
        <input className="search-input" placeholder="Search by name, ID, or email..." value={search} onChange={e => setSearch(e.target.value)} />
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
                  <td><div className="emp-row"><div className="emp-avatar">{initials(e.name)}</div><span className="emp-name">{e.name}</span></div></td>
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

function HRAttendance() {
  const [att, setAtt] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  useEffect(() => { api.allAttendance().then(setAtt); }, []);

  const empName = (id) => mockStore.users.find(u => u.id === id)?.name || `EMP#${id}`;
  const empEmpId = (id) => mockStore.users.find(u => u.id === id)?.employee_id || '';

  const filtered = att.filter(a => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const name = empName(a.employee_id).toLowerCase();
    const eid = empEmpId(a.employee_id).toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || eid.includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="card">
      <div className="card-header"><h3 className="card-title">All Attendance Records</h3></div>
      <div className="filter-bar">
        <input className="search-input" placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
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
                  <td><div className="emp-row"><div className="emp-avatar">{initials(empName(r.employee_id))}</div><span className="emp-name">{empName(r.employee_id)}</span></div></td>
                  <td className="text-muted">{empEmpId(r.employee_id)}</td>
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

function HRLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = async () => setLeaves(await api.allLeaves());
  useEffect(() => { load(); }, []);

  const empName = (id) => mockStore.users.find(u => u.id === id)?.name || `EMP#${id}`;

  const decide = async (id, d) => {
    try {
      await api.decideLeave(id, d);
      setMsg({ type: 'success', text: `Leave ${d}d successfully!` });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
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
                    <td><div className="emp-row"><div className="emp-avatar">{initials(empName(l.employee_id))}</div><span className="emp-name">{empName(l.employee_id)}</span></div></td>
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

// ═══════════════════════════════════════════════════════════════════
//  APP ROOT
// ═══════════════════════════════════════════════════════════════════

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getToken()) {
      api.me().then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-body)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏱️</div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    </div>
  );

  if (!user) return <LoginPage onLogin={setUser} />;

  const logout = () => { localStorage.removeItem('token'); setUser(null); setPage('dashboard'); };

  const renderPage = () => {
    if (user.role === 'hr') {
      switch (page) {
        case 'employees': return <HREmployees />;
        case 'attendance': return <HRAttendance />;
        case 'leaves': return <HRLeaves />;
        default: return <HRDashboard />;
      }
    } else {
      switch (page) {
        case 'attendance': return <EmployeeAttendance user={user} />;
        case 'leaves': return <EmployeeLeaves user={user} />;
        case 'profile': return <EmployeeProfile user={user} />;
        default: return <EmployeeDashboard user={user} />;
      }
    }
  };

  return (
    <AppLayout user={user} onLogout={logout} page={page} setPage={setPage}>
      {renderPage()}
    </AppLayout>
  );
}

createRoot(document.getElementById('root')).render(<App />);
