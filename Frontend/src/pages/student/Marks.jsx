import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { PageLoader } from '@/components/ui/loader'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { BookOpen } from 'lucide-react'

const PCT_COLOR = p => p >= 75 ? '#22c55e' : p >= 50 ? '#f59e0b' : '#ef4444'
const EXAM_LABEL = { internal1: 'Internal 1', internal2: 'Internal 2', assignment: 'Assignment', practical: 'Practical', external: 'External' }

export default function StudentMarks() {
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)  // active subject tab

  useEffect(() => {
    api.get('/students/my-profile').then(async r => {
      const m = await api.get(`/marks/${r.data._id}`).catch(() => ({ data: [] }))
      setMarks(m.data)
      const subjects = [...new Set(m.data.map(x => x.subject))]
      if (subjects.length) setActive(subjects[0])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const subjects = [...new Set(marks.map(m => m.subject))]

  const bySubject = subjects.reduce((acc, s) => {
    acc[s] = marks.filter(m => m.subject === s)
    return acc
  }, {})

  // Overall chart data
  const overallChart = subjects.map(s => {
    const ms = bySubject[s]
    const avg = ms.reduce((sum, m) => sum + (m.marksObtained / m.totalMarks) * 100, 0) / ms.length
    return { subject: s.length > 10 ? s.slice(0, 10) + '…' : s, avg: Number(avg.toFixed(1)), full: s }
  })

  // Active subject detail chart
  const detailChart = active ? bySubject[active]?.map(m => ({
    exam: EXAM_LABEL[m.examType] || m.examType,
    pct: Number(((m.marksObtained / m.totalMarks) * 100).toFixed(1)),
    obtained: m.marksObtained,
    total: m.totalMarks,
  })) : []

  const avgAll = marks.length
    ? (marks.reduce((s, m) => s + (m.marksObtained / m.totalMarks) * 100, 0) / marks.length).toFixed(1)
    : null

  if (!marks.length) return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground mb-6">My Marks</h1>
      <div className="bg-background rounded-xl border border-border py-16 text-center text-sm text-muted-foreground">No marks uploaded yet</div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">My Marks</h1>
        {avgAll && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Overall Average</p>
            <p className="text-2xl font-bold" style={{ color: PCT_COLOR(Number(avgAll)) }}>{avgAll}%</p>
          </div>
        )}
      </div>

      {/* Overall bar chart */}
      <div className="bg-background rounded-xl border border-border p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Subject-wise Average</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={overallChart} barSize={36} onClick={d => d?.activePayload && setActive(d.activePayload[0].payload.full)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <ReferenceLine y={50} stroke="#fca5a5" strokeDasharray="4 4" label={{ value: 'Pass 50%', fontSize: 10, fill: '#f87171', position: 'right' }} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
              formatter={v => [`${v}%`, 'Average']}
              cursor={{ fill: '#f5f3ff' }}
            />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}
              label={{ position: 'top', fontSize: 10, fill: '#6b7280', formatter: v => `${v}%` }}>
              {overallChart.map((entry, i) => (
                <Cell key={i} fill={entry.full === active ? '#7c3aed' : PCT_COLOR(entry.avg)} opacity={entry.full === active ? 1 : 0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-1">Click a bar to see subject details below</p>
      </div>

      {/* Subject tabs */}
      <div className="flex gap-2 flex-wrap">
        {subjects.map(s => (
          <button key={s} onClick={() => setActive(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${active === s ? 'bg-violet-600 text-primary-foreground border-violet-600' : 'bg-background text-muted-foreground border-border hover:border-violet-300'
              }`}>
            {s}
          </button>
        ))}
      </div>

      {/* Subject detail */}
      {active && (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-500" />{active}
            </p>
            <span className="text-sm font-bold" style={{ color: PCT_COLOR(detailChart.reduce((s, d) => s + d.pct, 0) / detailChart.length) }}>
              {(detailChart.reduce((s, d) => s + d.pct, 0) / detailChart.length).toFixed(1)}% avg
            </span>
          </div>

          {/* Detail bar chart */}
          <div className="px-5 pt-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={detailChart} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="exam" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <ReferenceLine y={50} stroke="#fca5a5" strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, _, props) => [`${props.payload.obtained}/${props.payload.total} (${v}%)`, 'Marks']}
                />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}
                  label={{ position: 'top', fontSize: 10, fill: '#6b7280', formatter: v => `${v}%` }}>
                  {detailChart.map((entry, i) => (
                    <Cell key={i} fill={PCT_COLOR(entry.pct)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Records table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-t border-border">
                  {['Exam Type', 'Obtained', 'Total', '%', 'Status'].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bySubject[active].map((m, i) => {
                  const pct = ((m.marksObtained / m.totalMarks) * 100).toFixed(1)
                  return (
                    <tr key={i} className="hover:bg-muted">
                      <td className="px-5 py-2.5 text-foreground/80">{EXAM_LABEL[m.examType] || m.examType}</td>
                      <td className="px-5 py-2.5 font-mono text-foreground">{m.marksObtained}</td>
                      <td className="px-5 py-2.5 font-mono text-muted-foreground">{m.totalMarks}</td>
                      <td className="px-5 py-2.5 font-semibold" style={{ color: PCT_COLOR(Number(pct)) }}>{pct}%</td>
                      <td className="px-5 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${Number(pct) >= 50 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                          }`}>{Number(pct) >= 50 ? 'Pass' : 'Fail'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
