from datetime import date, datetime
from pydantic import BaseModel, EmailStr, ConfigDict

class RegisterIn(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    phone: str | None = None
    department: str | None = None
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: str
    name: str
    email: EmailStr
    phone: str | None
    department: str | None
    role: str

class LeaveIn(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: str | None = None

class LeaveOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: int
    leave_type: str
    start_date: date
    end_date: date
    reason: str | None
    status: str

class AttendanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: int
    date: date
    check_in: datetime | None
    check_out: datetime | None
    working_hours: float
    status: str
