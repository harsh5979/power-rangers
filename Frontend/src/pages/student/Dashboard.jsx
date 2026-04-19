import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { PageLoader } from '@/components/ui/loader'
import useAuthStore from '@/store/authStore'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Legend,
} from 'recharts'
import { TrendingUp, BookOpen, ClipboardList, AlertTriangle, CheckCircle2, User } from 'lucide-react'

const RISK_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }
const PCT_COLOR  = p => Number(p) >= 75 ? '#22c55e' : Number(p) >= 50 ? '#f59e0b' : '#ef4444'

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const [profile, setProfile]   = useState(null)
  const [marks, setMarks]       = useState([])
  const [attData, setAttData]   = useState({})
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      if (!mounted) return
      
      try {
        const profileRes = await api.get('/students/my-profile')
        if (!mounted) return
        
        setProfile(profileRes.data)
        
        const [m, a, n] = await Promise.all([
          api.get(`/marks/${profileRes.data._id}`).catch(() => ({ data: [] })),
          api.get(`/attendance/${profileRes.data._id}`).catch(() => ({ data: { summary: {} } })),
          api.get('/notifications/my').catch(() => ({ data: [] })),
        ])
        
        if (!mounted) return
        
        setMarks(m.data)
        setAttData(a.data?.summary || {})
        setNotifications(n.data.filter(notif => notif.type === 'faculty_message' && !notif.isRead))
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    loadData()
    
    return () => { mounted = false }
  }, [])

  if (loading) return <PageLoader />
  if (!profile) return <div className="py-20 text-center text-sm text-muted-foreground">Profile not found</div>

  // Marks by subject for bar chart
  const bySubject = marks.reduce((acc, m) => {
    if (!acc[m.subject]) acc[m.subject] = []
    acc[m.subject].push(m)
    return acc
  }, {})

  const marksChart = Object.entries(bySubject).map(([subject, ms]) => ({
    subject: subject.length > 8 ? subject.slice(0, 8) + '…' : subject,
    avg: Number((ms.reduce((s, m) => s + (m.marksObtained / m.totalMarks) * 100, 0) / ms.length).toFixed(1)),
  }))

  const attChart = Object.entries(attData).map(([subject, s]) => ({
    subject: subject.length > 8 ? subject.slice(0, 8) + '…' : subject,
    pct: parseFloat(s.percentage),
  }))

  const overallAtt = attChart.length
    ? (attChart.reduce((s, a) => s + a.pct, 0) / attChart.length).toFixed(1)
    : null

  const avgMarks = marks.length
    ? (marks.reduce((s, m) => s + (m.marksObtained / m.totalMarks) * 100, 0) / marks.length).toFixed(1)
    : null

  const riskColor = RISK_COLOR[profile.riskLevel] || '#6366f1'

  // Radial gauge data
  const gaugeData = [{ name: 'Risk', value: profile.riskScore, fill: riskColor }]

  const suggestions = []
  profile.riskFactors?.forEach(f => {
    if (f.factor.toLowerCase().includes('attendance')) suggestions.push('Attend all classes — your attendance needs improvement.')
    if (f.factor.toLowerCase().includes('marks'))      suggestions.push('Focus on internal assessments and seek faculty help.')
    if (f.factor.toLowerCase().includes('assignment')) suggestions.push('Complete pending assignments before deadlines.')
    if (f.factor.toLowerCase().includes('predicted'))  suggestions.push('Your marks trend is declining — start revision now.')
  })

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Profile header */}
      <div className="bg-background rounded-xl border border-border px-5 py-4 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-violet-700">{profile.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-foreground">{profile.name}</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
              profile.riskLevel === 'high'   ? 'bg-red-50 text-red-700 border-red-200' :
              profile.riskLevel === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                               'bg-green-50 text-green-700 border-green-200'
            }`}>{profile.riskLevel?.toUpperCase()} RISK</span>
          </div>
          <p className="text-sm text-muted-foreground">{profile.rollNumber} · {profile.department} · Sem {profile.semester}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">{user?.college}</p>
          {profile.lastRiskCalculated && (
            <p className="text-xs text-muted-foreground">Updated {new Date(profile.lastRiskCalculated).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      {/* Faculty Messages Alert */}
      {notifications.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-sm font-semibold text-red-900">Important Messages from Faculty</h2>
          </div>
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n._id} className="bg-background rounded-lg p-3 border border-red-100">
                <p className="text-xs font-semibold text-red-900 mb-1">{n.title}</p>
                <p className="text-sm text-foreground/80">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top row: Risk gauge + quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Risk gauge */}
        <div className="col-span-2 bg-background rounded-xl border border-border p-5 flex items-center gap-5">
          <div className="relative h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="100%"
                startAngle={210} endAngle={-30} data={gaugeData} barSize={10}>
                <RadialBar background={{ fill: '#f3f4f6' }} dataKey="value" cornerRadius={6} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{profile.riskScore}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[160px]">
              {profile.riskLevel === 'low'    ? '✅ You\'re on track! Keep it up.' :
               profile.riskLevel === 'medium' ? '⚠️ Some areas need attention.' :
                                                '🚨 Immediate action required.'}
            </p>
            {profile.riskFactors?.slice(0, 2).map((f, i) => (
              <p key={i} className="text-xs text-red-500 mt-1">• {f.factor}</p>
            ))}
          </div>
        </div>

        {/* Avg Marks */}
        <div className="bg-background rounded-xl border border-border p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Marks</p>
            <BookOpen className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{avgMarks ? `${avgMarks}%` : '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">{marks.length} assessments</p>
          </div>
          {avgMarks && (
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full transition-all" style={{ width: `${avgMarks}%`, background: PCT_COLOR(avgMarks) }} />
            </div>
          )}
        </div>

        {/* Attendance */}
        <div className="bg-background rounded-xl border border-border p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Attendance</p>
            <ClipboardList className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{overallAtt ? `${overallAtt}%` : '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">{attChart.length} subjects</p>
          </div>
          {overallAtt && (
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full transition-all" style={{ width: `${overallAtt}%`, background: PCT_COLOR(overallAtt) }} />
            </div>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Marks bar chart */}
        {marksChart.length > 0 && (
          <div className="bg-background rounded-xl border border-border p-5">
            <p className="text-sm font-semibold text-foreground mb-4">Marks by Subject</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={marksChart} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
                  formatter={v => [`${v}%`, 'Avg']}
                />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}
                  fill="#7c3aed"
                  label={{ position: 'top', fontSize: 10, fill: '#6b7280', formatter: v => `${v}%` }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Attendance bar chart */}
        {attChart.length > 0 && (
          <div className="bg-background rounded-xl border border-border p-5">
            <p className="text-sm font-semibold text-foreground mb-4">Attendance by Subject</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={attChart} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
                  formatter={v => [`${v}%`, 'Attendance']}
                />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}
                  fill="#06b6d4"
                  label={{ position: 'top', fontSize: 10, fill: '#6b7280', formatter: v => `${v}%` }}
                />
              </BarChart>
            </ResponsiveContainer>
            {/* 75% warning line indicator */}
            <p className="text-xs text-muted-foreground mt-2">Minimum required: <span className="text-amber-600 font-medium">75%</span></p>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Improvement Suggestions
          </p>
          <ul className="space-y-1.5">
            {[...new Set(suggestions)].map((s, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="mt-0.5 shrink-0">→</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk factors detail */}
      {profile.riskFactors?.length > 0 && (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Risk Factor Breakdown</p>
          </div>
          <div className="divide-y divide-gray-50">
            {profile.riskFactors.map((f, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                <p className="text-sm text-foreground/80">{f.factor}</p>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(f.weight, 50) * 2}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">wt: {f.weight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
