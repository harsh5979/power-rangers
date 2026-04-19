import { useState, useEffect, useMemo } from 'react'
import api from '@/lib/axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { RiskBadge } from '@/components/shared'
import { Filter, RefreshCw } from 'lucide-react'

const COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }

// Generate batch years from 2018 to current year
const BATCH_YEARS = Array.from({ length: new Date().getFullYear() - 2017 }, (_, i) => {
  const y = new Date().getFullYear() - i
  return `${y}-${String(y + 1).slice(2)}`
})

export default function PrincipalRisk() {
  const [summary, setSummary]   = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(false)

  // Filter state
  const [filterDept, setFilterDept]   = useState('')
  const [filterSem, setFilterSem]     = useState('')
  const [filterBatch, setFilterBatch] = useState('')

  // Fetch data whenever filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const params = { limit: 1000 } // get all for distribution
        if (filterDept)  params.department = filterDept
        if (filterSem)   params.semester   = filterSem
        if (filterBatch) params.batchYear  = filterBatch

        const [riskRes, studentsRes] = await Promise.all([
          api.get('/risk/summary'),
          api.get('/students', { params }),
        ])
        setSummary(riskRes.data)
        setStudents(studentsRes.data?.data || studentsRes.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [filterDept, filterSem, filterBatch])

  // ── Derive unique filter options from student data ──
  const allStudents = useMemo(() => students, [students])

  const departments = useMemo(() => {
    const seen = new Set()
    allStudents.forEach(s => s.department && seen.add(s.department))
    return [...seen].sort()
  }, [allStudents])

  const semesters = useMemo(() => {
    const seen = new Set()
    allStudents.forEach(s => s.semester && seen.add(s.semester))
    return [...seen].sort((a, b) => a - b)
  }, [allStudents])

  const batchYears = useMemo(() => {
    const seen = new Set()
    allStudents.forEach(s => s.batchYear && seen.add(s.batchYear))
    return [...seen].sort((a, b) => b.localeCompare(a)) // newest first
  }, [allStudents])

  // ── Compute risk counts from filtered students ──
  const filteredRisk = useMemo(() => {
    const high   = allStudents.filter(s => s.riskLevel === 'high').length
    const medium = allStudents.filter(s => s.riskLevel === 'medium').length
    const low    = allStudents.filter(s => s.riskLevel === 'low').length
    return { high, medium, low, total: allStudents.length }
  }, [allStudents])

  // Use filtered risk when a filter is active, else use summary from API
  const isFiltered = filterDept || filterSem || filterBatch
  const displayRisk = isFiltered ? filteredRisk : (summary || { high: 0, medium: 0, low: 0, total: 0 })

  const pieData = [
    { name: 'High',   value: displayRisk.high,   color: COLORS.high },
    { name: 'Medium', value: displayRisk.medium, color: COLORS.medium },
    { name: 'Low',    value: displayRisk.low,    color: COLORS.low },
  ]

  // ── Department-wise risk (from filtered students) ──
  const deptMap = {}
  allStudents.forEach(s => {
    if (!s.department) return
    if (!deptMap[s.department]) deptMap[s.department] = { dept: s.department, high: 0, medium: 0, low: 0 }
    if (s.riskLevel) deptMap[s.department][s.riskLevel] = (deptMap[s.department][s.riskLevel] || 0) + 1
  })
  const deptData = Object.values(deptMap)

  // ── Semester-wise risk ──
  const semMap = {}
  allStudents.forEach(s => {
    if (!s.semester) return
    const key = `Sem ${s.semester}`
    if (!semMap[key]) semMap[key] = { sem: key, high: 0, medium: 0, low: 0 }
    if (s.riskLevel) semMap[key][s.riskLevel] = (semMap[key][s.riskLevel] || 0) + 1
  })
  const semData = Object.values(semMap).sort((a, b) => {
    const na = parseInt(a.sem.replace('Sem ', ''))
    const nb = parseInt(b.sem.replace('Sem ', ''))
    return na - nb
  })

  // ── Batch-wise risk ──
  const batchMap = {}
  allStudents.forEach(s => {
    if (!s.batchYear) return
    if (!batchMap[s.batchYear]) batchMap[s.batchYear] = { batch: s.batchYear, high: 0, medium: 0, low: 0 }
    if (s.riskLevel) batchMap[s.batchYear][s.riskLevel] = (batchMap[s.batchYear][s.riskLevel] || 0) + 1
  })
  const batchData = Object.values(batchMap).sort((a, b) => b.batch.localeCompare(a.batch))

  const clearFilters = () => { setFilterDept(''); setFilterSem(''); setFilterBatch('') }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Risk Overview</h1>
        {isFiltered && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground/90 border border-border rounded-lg px-3 py-1.5 transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Clear Filters
          </button>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-background rounded-xl border border-border px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-violet-600" />
          <p className="text-sm font-semibold text-foreground/90">Filter Risk Distribution</p>
          {loading && <span className="text-xs text-muted-foreground ml-2 animate-pulse">Loading...</span>}
        </div>
        <div className="flex flex-wrap gap-4">
          {/* Department Filter */}
          <div className="space-y-1.5 w-48">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Department</Label>
            <Select value={filterDept} onValueChange={v => setFilterDept(v === '_all' ? '' : v)}>
              <SelectTrigger className="h-9 text-sm border-border">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Departments</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Semester Filter */}
          <div className="space-y-1.5 w-36">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Semester</Label>
            <Select value={filterSem} onValueChange={v => setFilterSem(v === '_all' ? '' : v)}>
              <SelectTrigger className="h-9 text-sm border-border">
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Semesters</SelectItem>
                {semesters.map(s => (
                  <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Batch Filter */}
          <div className="space-y-1.5 w-40">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Batch Year</Label>
            <Select value={filterBatch} onValueChange={v => setFilterBatch(v === '_all' ? '' : v)}>
              <SelectTrigger className="h-9 text-sm border-border">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Batches</SelectItem>
                {(batchYears.length ? batchYears : BATCH_YEARS).map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter summary */}
        {isFiltered && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filterDept  && <span className="text-xs bg-violet-50 text-violet-700 border border-violet-100 rounded-full px-3 py-1">Dept: {filterDept}</span>}
            {filterSem   && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1">Sem: {filterSem}</span>}
            {filterBatch && <span className="text-xs bg-green-50 text-green-700 border border-green-100 rounded-full px-3 py-1">Batch: {filterBatch}</span>}
            <span className="text-xs text-muted-foreground py-1">{allStudents.length} students</span>
          </div>
        )}
      </div>

      {/* ── Risk Distribution Summary Cards ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: displayRisk.total,  bg: 'bg-muted',   text: 'text-foreground/90'  },
          { label: 'High Risk', value: displayRisk.high,   bg: 'bg-red-50',    text: 'text-red-700'   },
          { label: 'Medium',    value: displayRisk.medium, bg: 'bg-amber-50',  text: 'text-amber-700' },
          { label: 'Low Risk',  value: displayRisk.low,    bg: 'bg-green-50',  text: 'text-green-700' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl border border-border px-4 py-4 text-center`}>
            <p className={`text-2xl font-bold ${c.text}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie chart — overall distribution */}
        <Card>
          <CardHeader><CardTitle className="text-base">Risk Distribution</CardTitle></CardHeader>
          <CardContent>
            {pieData.every(d => d.value === 0) ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No data for selected filters</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Department bar chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Risk by Department</CardTitle></CardHeader>
          <CardContent>
            {deptData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No department data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="high"   fill={COLORS.high}   name="High" />
                  <Bar dataKey="medium" fill={COLORS.medium} name="Medium" />
                  <Bar dataKey="low"    fill={COLORS.low}    name="Low" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Semester-wise bar chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Risk by Semester</CardTitle></CardHeader>
          <CardContent>
            {semData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No semester data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={semData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sem" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="high"   fill={COLORS.high}   name="High" />
                  <Bar dataKey="medium" fill={COLORS.medium} name="Medium" />
                  <Bar dataKey="low"    fill={COLORS.low}    name="Low" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Batch-wise bar chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Risk by Batch</CardTitle></CardHeader>
          <CardContent>
            {batchData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No batch data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={batchData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="batch" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="high"   fill={COLORS.high}   name="High" />
                  <Bar dataKey="medium" fill={COLORS.medium} name="Medium" />
                  <Bar dataKey="low"    fill={COLORS.low}    name="Low" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top at-risk */}
      <Card>
        <CardHeader><CardTitle className="text-base">
          Top At-Risk Students {isFiltered && <span className="text-sm font-normal text-muted-foreground ml-2">(filtered)</span>}
        </CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allStudents.filter(s => s.riskLevel !== 'low').slice(0, 10).map(s => (
              <div key={s._id} className="flex items-center justify-between p-3 rounded-md bg-secondary/40">
                <div>
                  <p className="text-sm font-medium">{s.name} <span className="text-muted-foreground font-normal">({s.rollNumber})</span></p>
                  <p className="text-xs text-muted-foreground">
                    {s.department} · Sem {s.semester}
                    {s.batchYear && ` · ${s.batchYear}`}
                    {s.riskFactors?.length > 0 && ` · ${s.riskFactors.map(f => f.factor).join(' · ')}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-mono">{s.riskScore}</span>
                  <RiskBadge level={s.riskLevel} />
                </div>
              </div>
            ))}
            {allStudents.filter(s => s.riskLevel !== 'low').length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">No high/medium risk students found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
