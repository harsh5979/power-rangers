import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Pencil, RefreshCw, AlertTriangle, Users, TrendingUp } from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'
import { RiskBadge, StatCard } from '@/components/shared'
import useAuthStore from '@/store/authStore'
import { useMyCollege, useUpdateMyCollege, useAutoSemester, useRiskSummary, useStudents } from '@/hooks/useApi'

export default function CollegeAdminDashboard() {
  const { user } = useAuthStore()
  const [editMode, setEditMode] = useState(false)
  const [deptInput, setDeptInput]     = useState('')
  const [semDuration, setSemDuration] = useState('')
  const [acadYear, setAcadYear]       = useState('')

  const { data: college, isLoading: loadingCollege } = useMyCollege()
  const { data: summary }                            = useRiskSummary()
  const { data: studentsRes }                        = useStudents({ limit: 5, riskLevel: 'high' })
  const updateMutation  = useUpdateMyCollege()
  const autoSemMutation = useAutoSemester()

  const atRisk = studentsRes?.data || []

  const startEdit = () => {
    setDeptInput(college?.departments?.join(', ') || '')
    setSemDuration(college?.semesterDurationMonths || 6)
    setAcadYear(college?.currentAcademicYear || '')
    setEditMode(true)
  }

  const save = () => {
    updateMutation.mutate({
      departments: deptInput.split(',').map(d => d.trim()).filter(Boolean),
      semesterDurationMonths: Number(semDuration),
      currentAcademicYear: acadYear,
    }, { onSuccess: () => setEditMode(false) })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{user?.college}</p>
        </div>
        <button onClick={() => autoSemMutation.mutate()} disabled={autoSemMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-primary-foreground rounded-lg disabled:opacity-50 transition-colors">
          <RefreshCw className={`h-3.5 w-3.5 ${autoSemMutation.isPending ? 'animate-spin' : ''}`} />
          Recalculate Risk
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={summary?.total ?? 0}  icon={Users} />
        <StatCard title="High Risk"      value={summary?.high ?? 0}   icon={AlertTriangle} color="text-red-500" />
        <StatCard title="Medium Risk"    value={summary?.medium ?? 0} icon={TrendingUp}    color="text-amber-500" />
        <StatCard title="Low Risk"       value={summary?.low ?? 0}    icon={TrendingUp}    color="text-green-500" />
      </div>

      {/* College Settings */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-violet-600" />
            <p className="text-sm font-semibold text-foreground">College Settings</p>
          </div>
          {!editMode && (
            <button onClick={startEdit} className="text-muted-foreground hover:text-violet-600 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {loadingCollege ? <PageLoader /> : (
          <div className="px-5 py-5">
            {editMode ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Departments (comma separated)</Label>
                  <Input className="h-9 text-sm border-border" placeholder="Computer Engineering, Information Technology, Mechanical"
                    value={deptInput} onChange={e => setDeptInput(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Semester Duration (months)</Label>
                    <Input type="number" className="h-9 text-sm border-border" placeholder="6"
                      value={semDuration} onChange={e => setSemDuration(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Academic Year</Label>
                    <Input className="h-9 text-sm border-border" placeholder="2024-25"
                      value={acadYear} onChange={e => setAcadYear(e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={save} disabled={updateMutation.isPending}
                    className="h-8 px-4 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-primary-foreground rounded-lg disabled:opacity-50 transition-colors">
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditMode(false)} className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground/80">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Departments</p>
                  <div className="flex flex-wrap gap-1.5">
                    {college?.departments?.length ? college.departments.map(d => (
                      <span key={d} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 font-medium">{d}</span>
                    )) : <span className="text-sm text-muted-foreground">No departments — click edit to add</span>}
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Semester Duration</p>
                    <p className="font-medium text-foreground/80">{college?.semesterDurationMonths || 6} months</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Academic Year</p>
                    <p className="font-medium text-foreground/80">{college?.currentAcademicYear || '—'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* High Risk Students */}
      {atRisk.length > 0 && (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-sm font-semibold text-foreground">High Risk Students</p>
          </div>
          <div className="divide-y divide-border">
            {atRisk.map(s => (
              <div key={s._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.name}
                    <span className="text-muted-foreground font-normal ml-2 text-xs">{s.rollNumber}</span>
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.riskFactors?.slice(0, 2).map((f, i) => (
                      <span key={i} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{f.factor}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <RiskBadge level={s.riskLevel} />
                  <p className="text-xs text-muted-foreground mt-1">Score: {s.riskScore}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
