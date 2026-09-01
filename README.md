# ⏱️ Employee Attendance & Leave Management System

A full-stack Employee Attendance & Leave Management Application built with **React (Vite)** on the frontend and **FastAPI + SQLAlchemy + MySQL** on the backend. Designed with role-based access control for **Employees** and **HR Administrators**.

---

## 🌟 Key Features

### 1. 🔐 Employee Registration & Role-Based Authentication
* **Registration**: Employee ID, Name, Email, Phone, Department, Password.
* **Authentication**: Secure JWT (JSON Web Token) authentication with password hashing (`bcrypt`).
* **Role-Based Access**:
  * **Employee Role**: Personal dashboard, daily check-in/check-out, leave requests, individual history.
  * **HR / Admin Role**: Organization-wide dashboard, employee directory, leave approval workflow, attendance logs.

### 2. ⏰ Attendance Check-In / Check-Out
* One-click **Check-In** & **Check-Out** tracking.
* Prevents multiple check-ins on the same day.
* Stores date, check-in timestamp, check-out timestamp, total working hours, and status.

### 3. 📐 Automatic Working Hours & Status Rules
Calculates working hours automatically: `Working Hours = Check-Out Time - Check-In Time`

* **Status Rules**:
  * **🟢 Present**: $\ge 8$ hours working time & check-in by 9:30 AM.
  * **🟡 Late**: Check-in after 9:30 AM or working hours between 4h and 8h (if late arrival).
  * **🟠 Half Day**: Working hours between 4 and 8 hours.
  * **🔴 Absent**: Working hours $< 4$ hours or missed check-in without approved leave.
  * **🔵 On Leave**: Approved leave for the date.
  * **⚪ Holiday**: Non-working days.

### 4. 📅 Leave Management & Automatic Deduction
* Supports **Casual Leave**, **Sick Leave**, and **Paid Leave**.
* **Leave Balances**: Tracks remaining balances per employee (e.g. 6 Casual, 6 Sick, 12 Paid).
* **HR Workflow**: HR can view pending requests and **Approve** or **Reject** them.
* **Auto-Deduction**: Approving a leave automatically deducts days from the employee's balance and logs "On Leave" attendance records for those dates.

### 5. 📊 HR Dashboard & Admin Controls
* **Overview Cards**: Total Employees, Present Today, Absent Today, On Leave, Late Employees.
* **Attendance Logs**: View and filter attendance for all employees by date, status, or search query.
* **Employee Directory**: Searchable directory with employee metadata and department filters.
* **Leave Approvals**: One-click approval/rejection for pending leave applications.

### 6. 👤 Employee Dashboard & Self-Service
* Real-time greeting with live clock.
* Today's check-in/out status card and duration tracker.
* Interactive leave balance cards.
* Personal attendance history table with status indicators.
* Modal dialog to submit new leave requests with date range and reason.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite 5, JavaScript (ES6+), Vanilla CSS (Design Tokens, Glassmorphism, Micro-animations).
* **Backend**: FastAPI (Python 3.10+), Pydantic v2, Python-Jose (JWT), Passlib (Bcrypt).
* **Database**: MySQL 8.0 / MariaDB, SQLAlchemy ORM, PyMySQL.
* **Containerization**: Docker Compose (MySQL Database container).

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js** (v18+ recommended) & `npm`
* **Python** (v3.10+ recommended) & `pip`
* **MySQL Server** (Running locally on port 3306/3307 or via Docker)

---

### Step 1: Database Setup

#### Option A: Using Docker (Recommended)
```bash
docker compose up -d db
```
*This starts a MySQL 8.0 instance listening on `localhost:3307` with database `attendance_db`.*

#### Option B: Manual MySQL Installation
Create a MySQL database named `attendance_db`:
```sql
CREATE DATABASE attendance_db;
```

---

### Step 2: Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   * **Windows**:
     ```cmd
     python -m venv venv
     venv\Scripts\activate
     ```
   * **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure Environment Variables (Optional):
   Copy `.env.example` to `.env` or set default configuration in `database.py`:
   ```env
   DATABASE_URL=mysql+pymysql://attendance:attendance123@127.0.0.1:3307/attendance_db
   SECRET_KEY=your-custom-secret-key
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The API will be available at `http://localhost:8000` with interactive API docs at `http://localhost:8000/docs`.*

---

### Step 3: Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Standalone Demo Mode vs. Live Backend Connection:
   In `frontend/src/main.jsx`, locate line 7:
   * **`const USE_MOCK = true;`**: Runs standalone with built-in in-memory mock data (no backend needed).
   * **`const USE_MOCK = false;`**: Connects to the live FastAPI backend at `http://localhost:8000/api`.

4. Start the frontend dev server:
   ```bash
   npm run dev
   ```
   *Open your browser at `http://localhost:5173`.*

---

## 🔑 Pre-seeded Demo Credentials

When running the application, you can test both roles using these pre-configured accounts:

| Role | Email | Password | Employee ID | Department |
| :--- | :--- | :--- | :--- | :--- |
| **HR Admin** | `hr@example.com` | `Admin@123` | `HR001` | Human Resources |
| **Employee** | `rahul@example.com` | `Pass@123` | `EMP001` | Engineering |
| **Employee** | `priya@example.com` | `Pass@123` | `EMP002` | Design |
| **Employee** | `amit@example.com` | `Pass@123` | `EMP003` | Marketing |

> [!NOTE]
> When connecting to the backend for the first time, the HR account `hr@example.com` is automatically seeded upon application startup.

---

## 📁 Repository Structure

```text
employee_attendance_system/
├── backend/
│   ├── app/
│   │   ├── auth.py          # JWT authentication & password verification helpers
│   │   ├── database.py      # SQLAlchemy DB session & connection setup
│   │   ├── main.py          # FastAPI routes, endpoints & Business logic
│   │   ├── models.py        # SQLAlchemy DB Models (User, Attendance, Leave, Balance)
│   │   └── schemas.py       # Pydantic Request/Response models
│   ├── .env.example
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── index.html           # HTML5 Entry Point
│   ├── package.json         # Node.js dependencies & scripts
│   └── src/
│       ├── main.jsx         # React App, Dashboard views, State management & Mock API
│       └── style.css        # Modular CSS Design System & Theme Tokens
├── docker-compose.yml       # MySQL Docker setup
└── README.md                # Project documentation
```

---
