import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Suspense, lazy, useEffect } from 'react'
import useAuthStore from './store/authStore'
import DashboardLayout from './components/DashboardLayout'

const Login        = lazy(() => import('./pages/auth/Login'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword  = lazy(() => import('./pages/auth/ResetPassword'))

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))

const CollegeAdminDashboard      = lazy(() => import('./pages/college_admin/Dashboard'))
const CollegeAdminDepartments    = lazy(() => import('./pages/college_admin/Departments'))
const CollegeAdminDepartmentDetail = lazy(() => import('./pages/college_admin/DepartmentDetail'))
const CollegeAdminAddStudents    = lazy(() => import('./pages/college_admin/AddStudents'))

const PrincipalDashboard = lazy(() => import('./pages/principal/Dashboard'))
const PrincipalStudents  = lazy(() => import('./pages/principal/Students'))
const PrincipalFaculty   = lazy(() => import('./pages/principal/Faculty'))
const PrincipalRisk      = lazy(() => import('./pages/principal/RiskOverview'))
const PrincipalReports   = lazy(() => import('./pages/principal/Reports'))

const FacultyDashboard    = lazy(() => import('./pages/faculty/Dashboard'))
const FacultyStudents     = lazy(() => import('./pages/faculty/Students'))
const FacultyInterventions = lazy(() => import('./pages/faculty/Interventions'))
const FacultyAlerts       = lazy(() => import('./pages/faculty/Alerts'))
const FacultyAddStudents  = lazy(() => import('./pages/faculty/AddStudents'))
const FacultyHighRisk     = lazy(() => import('./pages/faculty/HighRiskStudents'))

// Mentor pages (reuse faculty pages for division student management)
const MentorDashboard    = lazy(() => import('./pages/faculty/Dashboard'))
const MentorStudents     = lazy(() => import('./pages/faculty/Students'))
const MentorInterventions = lazy(() => import('./pages/faculty/Interventions'))
const MentorAlerts       = lazy(() => import('./pages/faculty/Alerts'))

const CoordinatorDashboard  = lazy(() => import('./pages/coordinator/Dashboard'))
const CoordinatorMarks      = lazy(() => import('./pages/coordinator/Marks'))
const CoordinatorAttendance = lazy(() => import('./pages/coordinator/Attendance'))
const CoordinatorStudents   = lazy(() => import('./pages/coordinator/Students'))

const StudentDashboard  = lazy(() => import('./pages/student/Dashboard'))
const StudentRisk       = lazy(() => import('./pages/student/RiskScore'))
const StudentMarks      = lazy(() => import('./pages/student/Marks'))
const StudentAttendance = lazy(() => import('./pages/student/Attendance'))

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-muted">
    <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
  </div>
)

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isCheckingAuth } = useAuthStore()
  if (isCheckingAuth) return <Spinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { checkAuth } = useAuthStore()
  useEffect(() => { checkAuth() }, [])

  return (
    <Router>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/login"          element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
          </Route>

          <Route path="/college-admin" element={<ProtectedRoute allowedRoles={['college_admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<CollegeAdminDashboard />} />
            <Route path="departments"      element={<CollegeAdminDepartments />} />
            <Route path="departments/:id" element={<CollegeAdminDepartmentDetail />} />
            <Route path="faculty"      element={<PrincipalFaculty />} />
            <Route path="students"     element={<PrincipalStudents />} />
            <Route path="add-students" element={<CollegeAdminAddStudents />} />
            <Route path="risk"         element={<PrincipalRisk />} />
            <Route path="reports"      element={<PrincipalReports />} />
          </Route>

          {/* Principal */}
          <Route path="/principal" element={<ProtectedRoute allowedRoles={['principal']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<PrincipalDashboard />} />
            <Route path="departments"      element={<CollegeAdminDepartments />} />
            <Route path="departments/:id"  element={<CollegeAdminDepartmentDetail />} />
            <Route path="faculty"          element={<PrincipalFaculty />} />
            <Route path="students"         element={<PrincipalStudents />} />
            <Route path="add-students"     element={<CollegeAdminAddStudents />} />
            <Route path="risk"             element={<PrincipalRisk />} />
            <Route path="reports"          element={<PrincipalReports />} />
          </Route>

          {/* Faculty — subject teacher: marks + attendance */}
          <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<FacultyDashboard />} />
            <Route path="marks"      element={<CoordinatorMarks />} />
            <Route path="attendance" element={<CoordinatorAttendance />} />
            <Route path="students"   element={<CoordinatorStudents />} />
            <Route path="high-risk"  element={<FacultyHighRisk />} />
          </Route>

          {/* Mentor — division mentor: students + interventions + alerts */}
          <Route path="/mentor" element={<ProtectedRoute allowedRoles={['mentor']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<MentorDashboard />} />
            <Route path="students"      element={<MentorStudents />} />
            <Route path="interventions" element={<MentorInterventions />} />
            <Route path="alerts"        element={<MentorAlerts />} />
          </Route>

          {/* Coordinator */}
          <Route path="/coordinator" element={<ProtectedRoute allowedRoles={['subject_coordinator']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<CoordinatorDashboard />} />
            <Route path="marks"      element={<CoordinatorMarks />} />
            <Route path="attendance" element={<CoordinatorAttendance />} />
            <Route path="students"   element={<CoordinatorStudents />} />
          </Route>

          {/* Student */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="risk"       element={<StudentRisk />} />
            <Route path="marks"      element={<StudentMarks />} />
            <Route path="attendance" element={<StudentAttendance />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#fff', color: '#111827', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / .1)' },
      }} />
    </Router>
  )
}
