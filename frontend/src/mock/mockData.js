import { dateStr, daysAgo } from '../utils/formatters.js';

export const mockStore = {
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

export function userOut(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

export const mockApi = {
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
