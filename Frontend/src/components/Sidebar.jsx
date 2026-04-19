import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import useAuthStore from '@/store/authStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LayoutDashboard, Users, BookOpen, ClipboardList, Bell, BarChart3, GraduationCap, TrendingUp, FileText, UserPlus, Building2, AlertTriangle } from 'lucide-react'

const NAV = {
  admin: [
    { to: '/admin', label: 'System Admin', icon: LayoutDashboard, end: true },
  ],
  college_admin: [
    { to: '/college-admin',              label: 'Dashboard',    icon: LayoutDashboard, end: true },
    { to: '/college-admin/departments',  label: 'Departments',  icon: Building2 },
    { to: '/college-admin/faculty',      label: 'Faculty',      icon: UserPlus },
    { to: '/college-admin/students',     label: 'All Students', icon: Users },
    { to: '/college-admin/add-students', label: 'Add Students', icon: GraduationCap },
    { to: '/college-admin/risk',         label: 'Risk Overview',icon: TrendingUp },
    { to: '/college-admin/reports',      label: 'Reports',      icon: FileText },
  ],
  principal: [
    { to: '/principal',              label: 'Dashboard',    icon: LayoutDashboard, end: true },
    { to: '/principal/departments',  label: 'Departments',  icon: Building2 },
    { to: '/principal/faculty',      label: 'Faculty',      icon: UserPlus },
    { to: '/principal/students',     label: 'All Students', icon: Users },
    { to: '/principal/add-students', label: 'Add Students', icon: GraduationCap },
    { to: '/principal/risk',         label: 'Risk Overview',icon: TrendingUp },
    { to: '/principal/reports',      label: 'Reports',      icon: FileText },
  ],
  faculty: [
    { to: '/faculty',             label: 'Dashboard',   icon: LayoutDashboard, end: true },
    { to: '/faculty/marks',       label: 'Upload Marks',icon: BookOpen },
    { to: '/faculty/attendance',  label: 'Attendance',  icon: ClipboardList },
    { to: '/faculty/students',    label: 'Students',    icon: Users },
    { to: '/faculty/high-risk',   label: 'High Risk Students', icon: AlertTriangle },
  ],
  mentor: [
    { to: '/mentor',              label: 'Dashboard',     icon: LayoutDashboard, end: true },
    { to: '/mentor/students',     label: 'My Division',   icon: Users },
    { to: '/mentor/interventions',label: 'Interventions', icon: ClipboardList },
    { to: '/mentor/alerts',       label: 'Alerts',        icon: Bell },
  ],
  subject_coordinator: [
    { to: '/coordinator', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/coordinator/marks', label: 'Upload Marks', icon: BookOpen },
    { to: '/coordinator/attendance', label: 'Attendance', icon: ClipboardList },
    { to: '/coordinator/students', label: 'Students', icon: Users },
  ],
  student: [
    { to: '/student', label: 'My Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/risk', label: 'Risk Score', icon: TrendingUp },
    { to: '/student/marks', label: 'My Marks', icon: BarChart3 },
    { to: '/student/attendance', label: 'Attendance', icon: ClipboardList },
  ],
}

const ROLE_LABEL = { admin: 'Admin', college_admin: 'College Admin', principal: 'Principal', faculty: 'Faculty', mentor: 'Mentor', subject_coordinator: 'Subject Coordinator', student: 'Student' }

export default function Sidebar({ onClose }) {
  const { user } = useAuthStore()
  const items = NAV[user?.role] || []

  return (
    <aside className="flex flex-col h-full w-60 bg-background border-r border-border">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
        <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <GraduationCap className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">Academic Risk</p>
          {user?.college
            ? <p className="text-xs text-violet-600 font-medium truncate">{user.college}</p>
            : <p className="text-xs text-muted-foreground">Power-Rangers</p>
          }
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
              isActive ? 'bg-violet-50 text-violet-700 font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-violet-100 text-violet-700 text-xs font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABEL[user?.role]}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
