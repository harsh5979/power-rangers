# 🎓 Academic Risk Detection Platform

An AI-powered early warning system that identifies at-risk students using attendance, marks, and assignment data — enabling faculty and mentors to intervene before it's too late.

---

## 📸 Overview

The platform serves **6 roles** across a college hierarchy, each with a dedicated dashboard:

| Role | Responsibility |
|------|---------------|
| **Admin** | Creates colleges and college admins |
| **College Admin** | Manages departments, subjects, faculty, students |
| **Principal** | Oversees faculty, risk overview, reports |
| **Faculty** | Uploads marks & attendance, views subject analytics |
| **Mentor** | Monitors assigned batch students, logs interventions |
| **Student** | Views own risk score, marks, and attendance |

---

## ⚙️ Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS + Radix UI
- React Query (TanStack) — data fetching & caching
- Zustand — auth state
- Recharts — risk & performance charts
- React Router v6

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT (httpOnly cookie auth)
- bcrypt — password hashing
- Nodemailer — credential emails

---

## 🧠 Risk Engine

Risk is calculated per student using a weighted model (ported from `FutureModel.py`):

```
Risk Score (0–100) = Attendance Risk (20%) + Marks Risk (50%) + Assignment Risk (30%)
```

- **Current Risk** — based on actual data
- **Future Risk** — uses linear trend prediction on marks history
- **Overall Risk** = `max(current, future)`

| Score | Level |
|-------|-------|
| 0–39 | 🟢 Low |
| 40–69 | 🟡 Medium |
| 70–100 | 🔴 High |

Auto-alerts are sent to the faculty mentor when a student enters medium/high risk.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas URI

### 1. Clone
```bash
git clone <repo-url>
cd power-rangers
```

### 2. Backend
```bash
cd Backend
cp .env.example .env      # fill in MONGODB_URI, JWT_SECRET_KEY, senderEmail, senderPassword
npm install
node seed.js              # creates the first admin account
npm run dev               # starts on http://localhost:5000
```

**`Backend/.env`**
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/academic_risk_platform?retryWrites=true&w=majority
JWT_SECRET_KEY=your_long_random_secret_here

PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Email (Gmail App Password recommended)
senderEmail=you@gmail.com
senderPassword=your_app_password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
API_URL=http://localhost:5000/api
```

### 3. Frontend
```bash
cd Frontend
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm install
npm run dev               # starts on http://localhost:5173
```

**`Frontend/.env`**
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. First Login
After running `seed.js`, log in with:
```
Email:    [EMAIL_ADDRESS]
Password: [PASSWORD]
Role:     Admin
```

---

## 📁 Project Structure

```
goldrangers/
├── Backend/
│   ├── controllers/        # Route handlers (auth, students, faculty, marks, attendance, risk…)
│   ├── models/             # Mongoose schemas (User, Student, Subject, Department, Marks, Attendance…)
│   ├── routes/             # Express routers
│   ├── services/
│   │   ├── riskService.js  # Core ML risk calculation engine
│   │   └── mail.services.js
│   ├── middleware/         # auth (JWT), authorize (role guard)
│   ├── seed.js             # Creates initial admin user
│   └── server.js
│
└── Frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── admin/          # System admin dashboard
    │   │   ├── college_admin/  # College setup, departments, students
    │   │   ├── principal/      # Faculty management, risk overview, reports
    │   │   ├── faculty/        # Subject dashboard, marks, attendance
    │   │   ├── coordinator/    # Subject coordinator marks & attendance
    │   │   ├── student/        # Student self-view
    │   │   └── auth/           # Login, forgot/reset password
    │   ├── hooks/useApi.js     # All React Query hooks
    │   ├── store/authStore.js  # Zustand auth store
    │   ├── lib/axios.js        # Axios instance with cookie auth
    │   └── components/
    │       ├── DashboardLayout.jsx
    │       ├── Sidebar.jsx
    │       └── shared/         # RiskBadge, StatCard, SearchInput…
    └── public/
        └── samples/            # Sample CSV templates
```

---

## 🔑 Key Features

### Role-Based Access
Every route is protected by JWT + role guard middleware. Each role sees only their own data.

### Bulk Student Import
Upload a CSV to add hundreds of students at once. Auto-generates login credentials and emails them.

```csv
name,email,enrollment_no,department,semester,division,batch_year
Ravi Shah,ravi@college.edu,CE001,Computer Engineering,3,A,2023-24
```

### Marks & Attendance Entry
- Manual entry per student
- CSV bulk upload
- Subject selector when faculty teaches multiple subjects
- Edits blocked after 24 hours

### Auto Risk Recalculation
Every marks or attendance save triggers an automatic risk recalculation for affected students. Mentors receive alerts automatically.

### Password Recovery
- Forgot password → reset link via email (1-hour expiry)
- Principal/Admin can resend credentials to any faculty/student with one click

---

## 🌐 API Overview

```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password/:token

GET    /api/students
POST   /api/students/bulk
GET    /api/marks/:studentId
POST   /api/marks
POST   /api/attendance
GET    /api/attendance/:studentId

GET    /api/faculty/my-info
GET    /api/faculty/subject-summary?subject=DBMS
GET    /api/risk/summary
POST   /api/risk/calculate/:studentId

GET    /api/college-admin/departments
POST   /api/college-admin/departments/:id/subjects
PUT    /api/college-admin/subjects/:id/assign-faculty
POST   /api/college-admin/departments/:id/assign-mentor
POST   /api/college-admin/departments/:id/promote
```

---

## 📊 Sample CSV Formats

**Students** — `/samples/sample_students.csv`
```
name,email,enrollment_no,department,semester,division,batch_year
```

**Marks** — `/samples/sample_marks.csv`
```
enrollment_no,exam_type,marks_obtained,total_marks
```
`exam_type`: `internal1` | `internal2` | `assignment` | `practical` | `external`

**Attendance** — `enrollment_no,status,date`
`status`: `present` | `absent` | `late`

---

## 🔒 Security

- Passwords hashed with bcrypt (salt rounds: 10)
- Auth via httpOnly JWT cookie — not accessible to JavaScript
- `sameSite: lax` in dev, `strict` in production
- Role guard on every protected route
- Marks/attendance edits blocked after 24 hours
