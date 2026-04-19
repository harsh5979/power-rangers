import { PAGE_SIZE } from '@/lib/constants'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/axios'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'


const STATUS_CONFIG = {
  present:  { label: 'Present', active: 'bg-green-50 border-green-500 text-green-700' },
  absent:   { label: 'Absent',  active: 'bg-red-50 border-red-500 text-red-700' },
  late:     { label: 'Late',    active: 'bg-amber-50 border-amber-500 text-amber-700' },
}

const STATUS_BADGE = {
  present: 'bg-green-50 text-green-700',
  absent:  'bg-red-50 text-red-600',
  late:    'bg-amber-50 text-amber-700',
}

export default function CoordinatorAttendance() {
  const { user } = useAuthStore()
  const subjects = user?.subjects || []
  const [subject, setSubject] = useState(subjects[0] || '')

  const [tab, setTab] = useState('manual')
  const [students, setStudents] = useState([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState({})
  const [csvPreview, setCsvPreview] = useState([])
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])   // submitted records
  const [recPage, setRecPage] = useState(1)

  const loadRecords = useCallback(async () => {
    if (!students.length) return
    const all = await Promise.all(
      students.map(s =>
        api.get(`/attendance/${s._id}`, { params: { subject } })
          .then(r => r.data.records.map(rec => ({ ...rec, studentName: s.name, rollNumber: s.rollNumber })))
          .catch(() => [])
      )
    )
    const flat = all.flat().sort((a, b) => new Date(b.date) - new Date(a.date))
    setRecords(flat)
  }, [students, subject])

  useEffect(() => { api.get('/students').then(r => setStudents(r.data?.data || r.data || [])) }, [])
  useEffect(() => { if (students.length) loadRecords() }, [students, loadRecords])
  useEffect(() => { setAttendance({}) }, [subject])
  
  // Load existing attendance for selected date
  useEffect(() => {
    if (!students.length || !date || !subject) return
    const loadDateAttendance = async () => {
      const existing = {}
      for (const s of students) {
        try {
          const res = await api.get(`/attendance/${s._id}`, { params: { subject } })
          const record = res.data.records.find(r => new Date(r.date).toISOString().split('T')[0] === date)
          if (record) existing[s._id] = record.status
        } catch (err) {}
      }
      setAttendance(existing)
    }
    loadDateAttendance()
  }, [students, date, subject])

  const markAll = (status) => {
    const all = {}
    students.forEach(s => { all[s._id] = status })
    setAttendance(all)
  }

  const submitManual = async () => {
    if (!subject) return toast.error('No subject linked to your account')
    setLoading(true)
    try {
      await api.post('/attendance', {
        records: students.map(s => ({ studentId: s._id, subject, date, status: attendance[s._id] || 'absent' }))
      })
      toast.success('Attendance saved!')
      setAttendance({})
      loadRecords()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  const handleCsv = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = ev.target.result.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      setCsvPreview(lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim())
        return headers.reduce((o, h, i) => { o[h] = vals[i]; return o }, {})
      }).filter(r => r.enrollment_no))
    }
    reader.readAsText(file)
  }

  const submitCsv = async () => {
    if (!subject) return toast.error('No subject linked to your account')
    setLoading(true)
    try {
      const recs = csvPreview.map(row => {
        const s = students.find(s => s.rollNumber === row.enrollment_no)
        return s ? { studentId: s._id, subject, date: row.date || date, status: row.status?.toLowerCase() || 'absent' } : null
      }).filter(Boolean)
      if (!recs.length) return toast.error('No matching students found')
      await api.post('/attendance', { records: recs })
      toast.success(`${recs.length} records saved!`)
      setCsvPreview([])
      loadRecords()
    } catch (err) { toast.error(err.response?.data?.error || 'Upload failed') }
    finally { setLoading(false) }
  }

  const present = Object.values(attendance).filter(v => v === 'present').length
  const absent  = Object.values(attendance).filter(v => v === 'absent').length
  const late    = Object.values(attendance).filter(v => v === 'late').length

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Attendance</h1>
          {subjects.length > 1 ? (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {subjects.map(s => (
                <button key={s} onClick={() => setSubject(s)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${subject === s ? 'bg-violet-600 text-primary-foreground border-violet-600' : 'bg-background text-muted-foreground border-border hover:border-violet-400'}`}>
                  {s}
                </button>
              ))}
            </div>
          ) : subject ? (
            <p className="text-sm text-muted-foreground mt-0.5">
              Subject: <span className="font-medium text-foreground/80">{subject}</span>
            </p>
          ) : null}
        </div>
        {/* Tab switcher */}
        <div className="flex rounded-lg border border-border bg-background overflow-hidden text-sm">
          {['manual', 'csv'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 font-medium transition-colors ${tab === t ? 'bg-violet-600 text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
              {t === 'manual' ? 'Manual' : 'CSV Upload'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'manual' && (
        <>
          {/* Controls row */}
          <div className="bg-background rounded-xl border border-border px-5 py-4 flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44 h-8 text-sm" />
            </div>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => markAll('present')}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
                All Present
              </button>
              <button onClick={() => markAll('absent')}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">
                All Absent
              </button>
              <button onClick={() => setAttendance({})}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-muted text-muted-foreground border border-border hover:bg-muted transition-colors">
                Clear
              </button>
            </div>
          </div>

          {/* Summary bar */}
          {students.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Present', count: present, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
                { label: 'Absent', count: absent, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
                { label: 'Late', count: late, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Student list */}
          <div className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-medium text-foreground/80">{students.length} Students</p>
              <p className="text-xs text-muted-foreground">{Object.keys(attendance).length} marked</p>
            </div>

            {students.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No students found</div>
            ) : (
              <div className="divide-y divide-border">
                {students.map((s, idx) => {
                  const status = attendance[s._id]
                  return (
                    <div key={s._id} className="flex items-center justify-between px-5 py-3 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6 text-right">{idx + 1}</span>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${status ? STATUS_CONFIG[status].active.split(' ')[0] + ' ' + STATUS_CONFIG[status].active.split(' ')[2] : 'bg-muted text-muted-foreground'
                          }`}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.rollNumber}</p>
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                          <button key={key} onClick={() => setAttendance(a => ({ ...a, [s._id]: key }))}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${status === key ? cfg.active : 'border-border text-muted-foreground hover:border-border hover:bg-muted'
                              }`}>
                            {cfg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {students.length > 0 && (
              <div className="px-5 py-3 border-t border-border flex justify-end">
                <Button onClick={submitManual} disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-primary-foreground h-8 text-sm px-5">
                  {loading ? 'Saving...' : 'Submit Attendance'}
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'csv' && (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-medium text-foreground">Upload CSV</p>
            <p className="text-xs text-muted-foreground mt-1">
              Columns: <code className="bg-muted px-1 rounded">enrollment_no, status, date (optional)</code>
              &nbsp;· status: present / absent / late
              {' · '}
              <a href="/samples/sample_attendance.csv" download className="text-violet-600 hover:underline">Download sample</a>
            </p>
          </div>

          <div className="px-5 py-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">CSV File</Label>
                <Input type="file" accept=".csv" onChange={handleCsv} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Default Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>

            {csvPreview.length > 0 && (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      {['Enrollment No', 'Status', 'Date', 'Match'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {csvPreview.slice(0, 12).map((row, i) => {
                      const matched = students.some(s => s.rollNumber === row.enrollment_no)
                      return (
                        <tr key={i} className="hover:bg-muted">
                          <td className="px-4 py-2.5 font-mono text-foreground/80">{row.enrollment_no}</td>
                          <td className="px-4 py-2.5 capitalize text-muted-foreground">{row.status}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{row.date || date}</td>
                          <td className="px-4 py-2.5">
                            {matched
                              ? <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" />Found</span>
                              : <span className="text-red-500">Not found</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {csvPreview.length > 12 && (
                  <div className="px-4 py-2 bg-muted border-t border-border text-xs text-muted-foreground">
                    +{csvPreview.length - 12} more rows
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={submitCsv} disabled={loading || !csvPreview.length}
                className="bg-violet-600 hover:bg-violet-700 text-primary-foreground h-8 text-sm gap-2">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {loading ? 'Uploading...' : `Upload ${csvPreview.length || ''} Records`}
              </Button>
              {csvPreview.length > 0 && (
                <span className="text-xs text-muted-foreground">{csvPreview.filter(r => students.some(s => s.rollNumber === r.enrollment_no)).length} will be saved</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Submitted Records Table ── */}
      {records.length > 0 && (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Submitted Records</p>
            <span className="text-xs text-muted-foreground">{records.length} entries · {subject}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {['Student', 'Roll No', 'Date', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.slice((recPage - 1) * PAGE_SIZE, recPage * PAGE_SIZE).map((r, i) => (
                  <tr key={i} className="hover:bg-muted transition-colors">
                    <td className="px-4 py-2.5 font-medium text-foreground">{r.studentName}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.rollNumber}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[r.status] || 'bg-muted text-muted-foreground'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={recPage} total={records.length} pageSize={PAGE_SIZE} onChange={setRecPage} />
        </div>
      )}
    </div>
  )
}
