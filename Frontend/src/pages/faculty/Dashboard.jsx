import { useState } from 'react'
import { RiskBadge, StatCard } from '@/components/shared'
import { Users, AlertTriangle, Bell, BookOpen, TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import useAuthStore from '@/store/authStore'
import { useStudents, useAlerts, useMyFacultyInfo, useSubjectSummary, useUpdateMySubjects } from '@/hooks/useApi'
import { PAGE_SIZE } from '@/lib/constants'
import Pagination from '@/components/ui/Pagination'
import toast from 'react-hot-toast'

const RISK_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }
const RISK_BAR   = { high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-green-500' }

function StudentDetailCard({ s }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0 ${s.riskLevel === 'high' ? 'bg-red-500' : s.riskLevel === 'medium' ? 'bg-amber-400' : 'bg-green-500'}`}>
          {s.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
          <p className="text-xs text-muted-foreground">{s.rollNumber} · Div {s.division} · Sem {s.semester}</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {s.avgMarks !== null && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.avgMarks >= 60 ? 'bg-green-50 text-green-700' : s.avgMarks >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
              {s.avgMarks}%
            </span>
          )}
          {s.attendancePct !== null && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.attendancePct >= 75 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {s.attendancePct}% att
            </span>
          )}
          <RiskBadge level={s.riskLevel} />
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>

      {open && (
        <div className="px-5 pb-4 bg-muted border-t border-border">
          <div className="pt-3 grid sm:grid-cols-3 gap-4">
            {/* Risk gauge */}
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%"
                    startAngle={210} endAngle={-30} data={[{ value: s.riskScore, fill: RISK_COLOR[s.riskLevel] }]} barSize={8}>
                    <RadialBar background={{ fill: '#f3f4f6' }} dataKey="value" cornerRadius={4} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-foreground">{s.riskScore}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Risk Score</p>
                <RiskBadge level={s.riskLevel} />
                {s.riskLevel === 'high'   && <TrendingDown className="h-3.5 w-3.5 text-red-500 mt-1" />}
                {s.riskLevel === 'medium' && <Minus className="h-3.5 w-3.5 text-amber-500 mt-1" />}
                {s.riskLevel === 'low'    && <TrendingUp className="h-3.5 w-3.5 text-green-500 mt-1" />}
              </div>
            </div>

            {/* Marks */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Marks</p>
              {s.marks?.length ? (
                <div className="space-y-1">
                  {s.marks.map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{m.examType.replace('_', ' ')}</span>
                      <span className={`font-medium ${(m.marksObtained / m.totalMarks) >= 0.5 ? 'text-green-600' : 'text-red-500'}`}>
                        {m.marksObtained}/{m.totalMarks}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground">No marks yet</p>}
            </div>

            {/* Risk factors */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Risk Factors</p>
              {s.riskFactors?.length ? s.riskFactors.map((f, i) => (
                <p key={i} className="text-xs text-muted-foreground flex items-start gap-1 mb-1">
                  <span className="text-red-400 shrink-0">•</span>{f.factor}
                </p>
              )) : <p className="text-xs text-muted-foreground">No risk factors</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FacultyDashboard() {
  const { user }  = useAuthStore()
  const [activeSubject, setActiveSubject] = useState(null)
  const [page, setPage]   = useState(1)
  const [editSubjects, setEditSubjects] = useState(false)
  const [subjectInput, setSubjectInput] = useState('')

  const { data: info }                  = useMyFacultyInfo()
  const { data: alertsData = [] }       = useAlerts()
  const { data: studentsRes, isLoading } = useStudents({ limit: 100 })
  const { data: subjectData = [], isLoading: loadingSubject } = useSubjectSummary(activeSubject)
  const updateSubjectsMutation = useUpdateMySubjects()

  const subjects  = info?.subjects || user?.subjects || []
  const students  = studentsRes?.data || []
  const alerts    = alertsData.filter(a => !a.isRead).slice(0, 5)
  const high      = students.filter(s => s.riskLevel === 'high').length
  const medium    = students.filter(s => s.riskLevel === 'medium').length

  // Chart data for subject performance
  const chartData = subjectData.map(s => ({
    name: s.rollNumber,
    marks: s.avgMarks ?? 0,
    att:   s.attendancePct ?? 0,
  }))

  const paginated = subjectData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const saveSubjects = () => {
    const arr = subjectInput.split(',').map(s => s.trim()).filter(Boolean)
    updateSubjectsMutation.mutate(arr, { onSuccess: () => setEditSubjects(false) })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Faculty Dashboard</h1>
          <p className="text-sm text-muted-foreground">{user?.college} · {user?.department}
            {info?.division && <span className="ml-2 text-violet-600 font-medium">Division {info.division}</span>}
          </p>
        </div>
        <button onClick={() => { setEditSubjects(true); setSubjectInput(subjects.join(', ')) }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-background border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
          <Settings className="h-3.5 w-3.5" /> Manage Subjects
        </button>
      </div>

      {/* Manage subjects inline */}
      {editSubjects && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-4 flex items-center gap-3 flex-wrap">
          <p className="text-sm font-medium text-violet-800">My Subjects:</p>
          <input className="flex-1 min-w-48 h-8 px-3 text-sm border border-violet-300 rounded-lg outline-none focus:border-violet-500 bg-background"
            placeholder="DBMS, OS, CN, DSA" value={subjectInput} onChange={e => setSubjectInput(e.target.value)} />
          <button onClick={saveSubjects} disabled={updateSubjectsMutation.isPending}
            className="h-8 px-4 text-sm font-medium bg-violet-600 text-primary-foreground rounded-lg hover:bg-violet-700 disabled:opacity-50">
            {updateSubjectsMutation.isPending ? 'Saving...' : 'Save'}
          </button>
          <button onClick={() => setEditSubjects(false)} className="text-muted-foreground hover:text-muted-foreground text-sm">Cancel</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Students" value={info?.studentCount ?? students.length} icon={Users} />
        <StatCard title="High Risk"   value={high}   icon={AlertTriangle} color="text-red-500" />
        <StatCard title="Medium Risk" value={medium} icon={AlertTriangle} color="text-amber-500" />
        <StatCard title="Subjects"    value={subjects.length} icon={BookOpen} color="text-violet-600" />
      </div>

      {/* Subject tabs */}
      {subjects.length > 0 && (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-3 flex-wrap">
            <p className="text-sm font-semibold text-foreground">Subject Analysis</p>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setActiveSubject(null)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${!activeSubject ? 'bg-violet-600 text-primary-foreground border-violet-600' : 'bg-background text-muted-foreground border-border hover:border-border'}`}>
                Overview
              </button>
              {subjects.map(s => (
                <button key={s} onClick={() => { setActiveSubject(s); setPage(1) }}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${activeSubject === s ? 'bg-violet-600 text-primary-foreground border-violet-600' : 'bg-background text-muted-foreground border-border hover:border-border'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {!activeSubject ? (
            /* Overview — at-risk students */
            isLoading ? <PageLoader /> : (
              <div className="divide-y divide-border">
                {students.filter(s => s.riskLevel !== 'low').slice(0, 8).map(s => (
                  <div key={s._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.name}
                        <span className="text-muted-foreground font-normal ml-2 text-xs">{s.rollNumber}</span>
                        {s.division && <span className="ml-2 text-xs text-violet-500">Div {s.division}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.riskFactors?.slice(0, 2).map(f => f.factor).join(' · ')}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono text-muted-foreground">{s.riskScore}</span>
                      <RiskBadge level={s.riskLevel} />
                    </div>
                  </div>
                ))}
                {students.filter(s => s.riskLevel !== 'low').length === 0 && (
                  <div className="py-10 text-center text-sm text-muted-foreground">All students on track 🎉</div>
                )}
              </div>
            )
          ) : (
            /* Subject detail */
            loadingSubject ? <PageLoader /> : (
              <>
                {/* Bar chart */}
                {chartData.length > 0 && (
                  <div className="px-5 pt-4 pb-2">
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={chartData.slice(0, 20)} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 11 }} />
                        <Bar dataKey="marks" fill="#7c3aed" name="Marks %" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="att"   fill="#06b6d4" name="Attendance %" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="divide-y divide-border">
                  {paginated.map(s => <StudentDetailCard key={s._id} s={s} />)}
                </div>
                <Pagination page={page} total={subjectData.length} pageSize={PAGE_SIZE} onChange={setPage} />
              </>
            )
          )}
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-background rounded-xl border border-red-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <Bell className="h-4 w-4 text-red-600" />
            <p className="text-sm font-semibold text-red-800">{alerts.length} Unread Alert{alerts.length > 1 ? 's' : ''}</p>
          </div>
          <div className="divide-y divide-border">
            {alerts.map(a => (
              <div key={a._id} className="flex items-start justify-between px-5 py-3.5 hover:bg-muted">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.student?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
                </div>
                <RiskBadge level={a.riskLevel} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
