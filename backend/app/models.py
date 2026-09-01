from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    employee_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(120), nullable=False)
    email = Column(String(160), unique=True, nullable=False)
    phone = Column(String(30))
    department = Column(String(100))
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="employee", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    attendance = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leaves = relationship("LeaveRequest", back_populates="employee", cascade="all, delete-orphan")
    balance = relationship("LeaveBalance", back_populates="employee", uselist=False, cascade="all, delete-orphan")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    check_in = Column(DateTime)
    check_out = Column(DateTime)
    working_hours = Column(Float, default=0)
    status = Column(String(30), default="Absent")
    employee = relationship("User", back_populates="attendance")

class LeaveBalance(Base):
    __tablename__ = "leave_balance"
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    casual_leave = Column(Float, default=6)
    sick_leave = Column(Float, default=6)
    paid_leave = Column(Float, default=12)
    employee = relationship("User", back_populates="balance")

class LeaveRequest(Base):
    __tablename__ = "leaves"
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    leave_type = Column(String(30), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text)
    status = Column(String(20), default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    employee = relationship("User", back_populates="leaves")
