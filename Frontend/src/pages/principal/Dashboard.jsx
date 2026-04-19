import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { StatCard, RiskBadge } from '@/components/shared'
import { Users, AlertTriangle, UserPlus, TrendingUp } from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'

export default function PrincipalDashboard() {
  const { user } = useAuthStore()
  const [summary, setSummary] = useState(null)
  const [atRisk, setAtRisk] = useState([])
  const [facultyCount, setFacultyCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, r, f] = await Promise.all([
        api.get('/risk/summary').catch(() => ({ data: {} })),
        api.get('/students', { params: { riskLevel: 'high', limit: 8 } }).catch(() => ({ data: { data: [] } })),
        api.get('/principal/faculty').catch(() => ({ data: { data: [] } })),
      ])
      setSummary(s.data)
      const students = Array.isArray(r.data) ? r.data : (r.data?.data || [])
      setAtRisk(students.slice(0, 8))
      const faculty = Array.isArray(f.data) ? f.data : (f.data?.data || [])
      setFacultyCount(faculty.length)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const recalculate = async () => {
    try { await api.post('/risk/calculate-all'); toast.success('Risk updated!'); load() }
    catch { toast.error('Failed') }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{user?.college}</p>
        </div>
        <button onClick={recalculate} className="px-4 py-2 text-sm font-medium bg-violet-600 text-primary-foreground rounded-lg hover:bg-violet-700 transition-colors">
          Recalculate Risk
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={summary?.total ?? 0} icon={Users} />
        <StatCard title="High Risk"      value={summary?.high ?? 0}   icon={AlertTriangle} color="text-red-500" />
        <StatCard title="Medium Risk"    value={summary?.medium ?? 0} icon={TrendingUp}    color="text-amber-500" />
        <StatCard title="Faculty"        value={facultyCount}          icon={UserPlus}      color="text-violet-600" />
      </div>

      {loading ? <PageLoader /> : (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-sm font-semibold text-foreground">High Risk Students</p>
          </div>
          {atRisk.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No high-risk students 🎉</div>
          ) : (
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
          )}
        </div>
      )}
    </div>
  )
}
