import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { PageLoader } from '@/components/ui/loader'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine,
} from 'recharts'

const STATUS_COLOR = { present: '#22c55e', absent: '#ef4444', late: '#f59e0b' }
const PCT_COLOR = p => p >= 75 ? '#22c55e' : p >= 60 ? '#f59e0b' : '#ef4444'

export default function StudentAttendance() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)

  useEffect(() => {
    api.get('/students/my-profile').then(async r => {
      const att = await api.get(`/attendance/${r.data._id}`).catch(() => ({ data: { summary: {}, records: [] } }))
      setData(att.data)
      const subjects = Object.keys(att.data?.summary || {})
      if (subjects.length) setActive(subjects[0])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const summary = data?.summary || {}
  const records = data?.records || []
  const subjects = Object.keys(summary)

  if (!subjects.length) return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground mb-6">My Attendance</h1>
      <div className="bg-background rounded-xl border border-border py-16 text-center text-sm text-muted-foreground">No attendance records yet</div>
    </div>
  )

  // Bar chart data
  const barData = subjects.map(s => ({
    subject: s.length > 10 ? s.slice(0, 10) + '…' : s,
    pct: parseFloat(summary[s].percentage),
    full: s,
  }))

  // Pie chart for active subject
  const activeSummary = active ? summary[active] : null
  const pieData = activeSummary ? [
    { name: 'Present', value: activeSummary.present || 0 },
    { name: 'Absent', value: activeSummary.absent || 0 },
    { name: 'Late', value: activeSummary.late || 0 },
  ].filter(d => d.value > 0) : []

  // Recent records for active subject
  const activeRecords = records.filter(r => r.subject === active).slice(0, 20)

  const overallPct = subjects.length
    ? (subjects.reduce((s, sub) => s + parseFloat(summary[sub].percentage), 0) / subjects.length).toFixed(1)
    : null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">My Attendance</h1>
        {overallPct && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Overall</p>
            <p className="text-2xl font-bold" style={{ color: PCT_COLOR(Number(overallPct)) }}>{overallPct}%</p>
          </div>
        )}
      </div>

      {/* Overview bar chart */}
      <div className="bg-background rounded-xl border border-border p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Attendance by Subject</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} barSize={36} onClick={d => d?.activePayload && setActive(d.activePayload[0].payload.full)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <ReferenceLine y={75} stroke="#fbbf24" strokeDasharray="4 4"
              label={{ value: '75% min', fontSize: 10, fill: '#d97706', position: 'right' }} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
              formatter={v => [`${v}%`, 'Attendance']}
              cursor={{ fill: '#f5f3ff' }}
            />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]}
              label={{ position: 'top', fontSize: 10, fill: '#6b7280', formatter: v => `${v}%` }}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={PCT_COLOR(entry.pct)} opacity={entry.full === active ? 1 : 0.65} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-1">Click a bar to see subject breakdown</p>
      </div>

      {/* Subject tabs */}
      <div className="flex gap-2 flex-wrap">
        {subjects.map(s => (
          <button key={s} onClick={() => setActive(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${active === s ? 'bg-violet-600 text-primary-foreground border-violet-600' : 'bg-background text-muted-foreground border-border hover:border-violet-300'
              }`}>
            {s}
            <span className={`ml-1.5 font-bold ${parseFloat(summary[s].percentage) < 75 ? 'text-red-300' : 'text-green-300'}`}>
              {summary[s].percentage}%
            </span>
          </button>
        ))}
      </div>

      {/* Subject detail */}
      {active && activeSummary && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Pie chart */}
          <div className="bg-background rounded-xl border border-border p-5">
            <p className="text-sm font-semibold text-foreground mb-1">{active}</p>
            <p className="text-xs text-muted-foreground mb-3">{activeSummary.present}/{activeSummary.total} classes attended</p>
            {parseFloat(activeSummary.percentage) < 75 && (
              <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 font-medium">⚠ Below 75% — attendance shortage</p>
                <p className="text-xs text-red-500 mt-0.5">
                  Need {Math.ceil((0.75 * activeSummary.total - activeSummary.present) / 0.25)} more classes to reach 75%
                </p>
              </div>
            )}
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLOR[entry.name.toLowerCase()] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Recent records */}
          <div className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Recent Classes</p>
            </div>
            <div className="overflow-y-auto max-h-64 divide-y divide-gray-50">
              {activeRecords.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No records</p>
              ) : activeRecords.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted">
                  <p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${r.status === 'present' ? 'bg-green-50 text-green-700' :
                      r.status === 'late' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-600'
                    }`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All subjects summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {subjects.map(s => {
          const pct = parseFloat(summary[s].percentage)
          return (
            <button key={s} onClick={() => setActive(s)}
              className={`bg-background rounded-xl border p-4 text-left hover:shadow-sm transition-all ${active === s ? 'border-violet-300 ring-1 ring-violet-200' : 'border-border'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground truncate">{s}</p>
                <span className="text-sm font-bold shrink-0 ml-2" style={{ color: PCT_COLOR(pct) }}>{pct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: PCT_COLOR(pct) }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{summary[s].present}/{summary[s].total} present</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
