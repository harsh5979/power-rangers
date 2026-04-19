import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import useAuthStore from '@/store/authStore'
import { Menu, LogOut, GraduationCap } from 'lucide-react'

const ROLE_LABEL = {
  admin: 'Admin',
  college_admin: 'College Admin',
  principal: 'Principal',
  faculty: 'Faculty',
  mentor: 'Mentor',
  subject_coordinator: 'Subject Coordinator',
  student: 'Student',
}

// Map route segments to readable page names
const PAGE_NAMES = {
  '':              'Dashboard',
  'students':      'Students',
  'add-students':  'Add Students',
  'faculty':       'Faculty',
  'marks':         'Upload Marks',
  'attendance':    'Attendance',
  'interventions': 'Interventions',
  'alerts':        'Alerts',
  'risk':          'Risk Overview',
  'reports':       'Reports',
}

export default function DashboardLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Get last segment of path for page name
  const segments = location.pathname.split('/').filter(Boolean)
  const lastSeg  = segments[segments.length - 1] || ''
  const pageName = PAGE_NAMES[lastSeg] || 'Dashboard'
  const roleLabel = ROLE_LABEL[user?.role] || ''

  return (
    <div className="flex h-screen bg-muted overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-primary/30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-50 shadow-xl">
            <Sidebar onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 shrink-0 bg-background border-b border-border flex items-center justify-between px-4 md:px-6">
          {/* Left: hamburger + title */}
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="md:hidden text-muted-foreground hover:text-foreground/80">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-violet-600 shrink-0" />
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-semibold text-foreground">{roleLabel}</span>
                <span className="text-foreground/70 hidden sm:inline">/</span>
                <span className="text-muted-foreground hidden sm:inline">{pageName}</span>
              </div>
            </div>
          </div>

          {/* Right: user + logout */}
          <div className="flex items-center gap-3">

            {/* Avatar + name */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium text-foreground leading-tight">{user?.name}</p>
                <p className="text-xs text-muted-foreground leading-tight">{user?.email}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => logout(navigate)}
              title="Logout"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
