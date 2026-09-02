import { USE_MOCK, API_BASE } from '../config/api.config.js';
import { mockApi, mockStore } from '../mock/mockData.js';

const getToken = () => localStorage.getItem('token');

async function realApi(path, options = {}) {
  const r = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}),
      ...(options.headers || {}),
    },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.detail || 'Request failed');
  return d;
}

export const api = {
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

export function getEmployeeName(id) {
  if (USE_MOCK) {
    return mockStore.users.find(u => u.id === id)?.name || `EMP#${id}`;
  }
  return `EMP#${id}`;
}

export function getEmployeeCode(id) {
  if (USE_MOCK) {
    return mockStore.users.find(u => u.id === id)?.employee_id || '';
  }
  return '';
}
