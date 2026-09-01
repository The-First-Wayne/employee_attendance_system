from datetime import datetime, date, time
from calendar import monthrange
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from .database import Base, engine, get_db
from .models import User, Attendance, LeaveBalance, LeaveRequest
from .schemas import RegisterIn, LoginIn, UserOut, LeaveIn, LeaveOut, AttendanceOut
from .auth import hash_password, verify_password, create_token, current_user, hr_only

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Employee Attendance Management System", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def seed_hr():
    db = next(get_db())
    try:
        if not db.query(User).filter(User.email == "hr@example.com").first():
            u = User(employee_id="HR001", name="HR Admin", email="hr@example.com", department="HR", password_hash=hash_password("Admin@123"), role="hr")
            db.add(u); db.commit()
    finally: db.close()

def attendance_status(hours, check_in):
    if not check_in: return "Absent"
    if hours >= 8: return "Present" if check_in.time() <= time(9,30) else "Late"
    if hours >= 4: return "Half Day"
    return "Late"

@app.get("/api/health")
def health(): return {"status": "ok"}

@app.post("/api/auth/register", response_model=UserOut)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter((User.email == data.email) | (User.employee_id == data.employee_id)).first():
        raise HTTPException(400, "Email or employee ID already exists")
    user = User(employee_id=data.employee_id, name=data.name, email=data.email, phone=data.phone, department=data.department, password_hash=hash_password(data.password))
    db.add(user); db.flush(); db.add(LeaveBalance(employee_id=user.id)); db.commit(); db.refresh(user)
    return user

@app.post("/api/auth/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash): raise HTTPException(401, "Invalid email or password")
    return {"access_token": create_token(user), "token_type": "bearer", "user": UserOut.model_validate(user)}

@app.get("/api/me", response_model=UserOut)
def me(user=Depends(current_user)): return user

@app.post("/api/attendance/check-in", response_model=AttendanceOut)
def check_in(db: Session = Depends(get_db), user=Depends(current_user)):
    today = date.today(); row = db.query(Attendance).filter_by(employee_id=user.id, date=today).first()
    if row and row.check_in: raise HTTPException(400, "Already checked in today")
    if not row: row = Attendance(employee_id=user.id, date=today); db.add(row)
    row.check_in = datetime.now(); row.status = "Late" if row.check_in.time() > time(9,30) else "Present"
    db.commit(); db.refresh(row); return row

@app.post("/api/attendance/check-out", response_model=AttendanceOut)
def check_out(db: Session = Depends(get_db), user=Depends(current_user)):
    row = db.query(Attendance).filter_by(employee_id=user.id, date=date.today()).first()
    if not row or not row.check_in: raise HTTPException(400, "Check in first")
    if row.check_out: raise HTTPException(400, "Already checked out today")
    row.check_out = datetime.now(); row.working_hours = round((row.check_out - row.check_in).total_seconds()/3600, 2); row.status = attendance_status(row.working_hours, row.check_in)
    db.commit(); db.refresh(row); return row

@app.get("/api/attendance/my", response_model=list[AttendanceOut])
def my_attendance(db: Session = Depends(get_db), user=Depends(current_user)):
    return db.query(Attendance).filter_by(employee_id=user.id).order_by(Attendance.date.desc()).all()

@app.get("/api/attendance", response_model=list[AttendanceOut])
def all_attendance(db: Session = Depends(get_db), user=Depends(hr_only)):
    return db.query(Attendance).order_by(Attendance.date.desc()).all()

@app.post("/api/leaves", response_model=LeaveOut)
def request_leave(data: LeaveIn, db: Session = Depends(get_db), user=Depends(current_user)):
    if data.end_date < data.start_date: raise HTTPException(400, "End date cannot be before start date")
    if data.leave_type not in {"casual_leave", "sick_leave", "paid_leave"}: raise HTTPException(400, "Invalid leave type")
    row = LeaveRequest(employee_id=user.id, **data.model_dump()); db.add(row); db.commit(); db.refresh(row); return row

@app.get("/api/leaves/my", response_model=list[LeaveOut])
def my_leaves(db: Session = Depends(get_db), user=Depends(current_user)):
    return db.query(LeaveRequest).filter_by(employee_id=user.id).order_by(LeaveRequest.created_at.desc()).all()

@app.get("/api/leaves", response_model=list[LeaveOut])
def all_leaves(db: Session = Depends(get_db), user=Depends(hr_only)):
    return db.query(LeaveRequest).order_by(LeaveRequest.created_at.desc()).all()

@app.patch("/api/leaves/{leave_id}/{decision}", response_model=LeaveOut)
def decide_leave(leave_id: int, decision: str, db: Session = Depends(get_db), user=Depends(hr_only)):
    if decision not in {"approve", "reject"}: raise HTTPException(400, "Invalid decision")
    leave = db.get(LeaveRequest, leave_id)
    if not leave: raise HTTPException(404, "Leave not found")
    if leave.status != "Pending": raise HTTPException(400, "Leave already processed")
    if decision == "approve":
        days = (leave.end_date - leave.start_date).days + 1
        balance = db.query(LeaveBalance).filter_by(employee_id=leave.employee_id).first()
        remaining = getattr(balance, leave.leave_type)
        if remaining < days: raise HTTPException(400, "Insufficient leave balance")
        setattr(balance, leave.leave_type, remaining - days)
        leave.status = "Approved"
        d = leave.start_date
        while d <= leave.end_date:
            if d.weekday() < 5:
                existing = db.query(Attendance).filter_by(employee_id=leave.employee_id, date=d).first()
                if not existing: db.add(Attendance(employee_id=leave.employee_id, date=d, status="On Leave"))
            d = date.fromordinal(d.toordinal()+1)
    else: leave.status = "Rejected"
    db.commit(); db.refresh(leave); return leave

@app.get("/api/dashboard/employee")
def employee_dashboard(db: Session = Depends(get_db), user=Depends(current_user)):
    today = db.query(Attendance).filter_by(employee_id=user.id, date=date.today()).first()
    balance = db.query(LeaveBalance).filter_by(employee_id=user.id).first()
    return {"today": AttendanceOut.model_validate(today) if today else None, "leave_balance": {"casual_leave": balance.casual_leave, "sick_leave": balance.sick_leave, "paid_leave": balance.paid_leave}}

@app.get("/api/dashboard/hr")
def hr_dashboard(db: Session = Depends(get_db), user=Depends(hr_only)):
    today = date.today()
    total = db.query(User).filter(User.role == "employee").count()
    present = db.query(Attendance).filter(Attendance.date == today, Attendance.status.in_(["Present", "Late"])).count()
    leave = db.query(Attendance).filter(Attendance.date == today, Attendance.status == "On Leave").count()
    return {"total_employees": total, "present_today": present, "absent_today": max(total-present-leave, 0), "on_leave_today": leave}
