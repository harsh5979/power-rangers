import { PAGE_SIZE } from '@/lib/constants'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/axios'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'

const EXAM_TYPES = [
  { value: 'internal1', label: 'Internal 1' },
  { value: 'internal2', label: 'Internal 2' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'practical', label: 'Practical' },
  { value: 'external', label: 'External' },
]

const PCT_COLOR = p => Number(p) >= 60 ? 'text-green-600 bg-green-50' : Number(p) >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'
const empty = { studentId: '', examType: '', marksObtained: '', totalMarks: '' }

export default function CoordinatorMarks() {
  const { user } = useAuthStore()
  const subjects = user?.subjects || []
  const [subject, setSubject] = useState(subjects[0] || '')

  const [tab, setTab] = useState('manual')
  const [students, setStudents] = useState([])
  const [form, setForm] = useState(empty)
  const [csvPreview, setCsvPreview] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(null)
  const [records, setRecords] = useState([])   // uploaded records shown in table
  const [recPage, setRecPage] = useState(1)

  const loadRecords = useCallback(async () => {
    if (!students.length) return
    // fetch marks for all students of this coordinator's subject
    const all = await Promise.all(
      students.map(s => api.get(`/marks/${s._id}`).then(r => r.data.map(m => ({ ...m, studentName: s.name, rollNumber: s.rollNumber }))).catch(() => []))
    )
    const flat = all.flat().filter(m => m.subject === subject).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    setRecords(flat)
  }, [students, subject])

  useEffect(() => { api.get('/students').then(r => setStudents(r.data?.data || r.data || [])) }, [])
  useEffect(() => { if (students.length) loadRecords() }, [students, loadRecords])
  useEffect(() => { setForm(empty); setRecords([]); setSaved(null) }, [subject])

  const submitManual = async (e) => {
    e.preventDefault()
    if (!subject) return toast.error('No subject linked to your account')
    setLoading(true)
    try {
      await api.post('/marks', {
        records: [{ ...form, subject, marksObtained: Number(form.marksObtained), totalMarks: Number(form.totalMarks) }]
      })
      const student = students.find(s => s._id === form.studentId)
      setSaved({ name: student?.name, examType: form.examType, marks: `${form.marksObtained}/${form.totalMarks}` })
      setForm(empty)
      toast.success('Marks saved!')
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
        return s ? { studentId: s._id, subject, examType: row.exam_type, marksObtained: Number(row.marks_obtained), totalMarks: Number(row.total_marks) } : null
      }).filter(Boolean)
      if (!recs.length) return toast.error('No matching students found')
      await api.post('/marks', { records: recs })
      toast.success(`${recs.length} records uploaded!`)
      setCsvPreview([])
      loadRecords()
    } catch (err) { toast.error(err.response?.data?.error || 'Upload failed') }
    finally { setLoading(false) }
  }

  const pct = form.marksObtained && form.totalMarks
    ? ((Number(form.marksObtained) / Number(form.totalMarks)) * 100).toFixed(0) : null

  return (
    <div className=" space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Upload Marks</h1>
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
        <div className="flex rounded-lg border border-border bg-background overflow-hidden text-sm">
          {['manual', 'csv'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 font-medium transition-colors ${tab === t ? 'bg-violet-600 text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
              {t === 'manual' ? 'Manual Entry' : 'CSV Upload'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'manual' && (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-medium text-foreground">Enter Marks</p>
            <p className="text-xs text-muted-foreground mt-0.5">Risk score will be recalculated automatically after saving</p>
          </div>

          <form onSubmit={submitManual} className="px-5 py-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Student</Label>
                <Select value={form.studentId} onValueChange={v => setForm(p => ({ ...p, studentId: v }))} required>
                  <SelectTrigger className="h-9 text-sm border-border">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s._id} value={s._id}>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground ml-1.5 text-xs">{s.rollNumber}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Exam Type</Label>
                <Select value={form.examType} onValueChange={v => setForm(p => ({ ...p, examType: v }))} required>
                  <SelectTrigger className="h-9 text-sm border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Marks Obtained</Label>
                <Input type="number" placeholder="e.g. 38" value={form.marksObtained}
                  onChange={e => setForm(p => ({ ...p, marksObtained: e.target.value }))}
                  className="h-9 text-sm border-border" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Total Marks</Label>
                <Input type="number" placeholder="e.g. 50" value={form.totalMarks}
                  onChange={e => setForm(p => ({ ...p, totalMarks: e.target.value }))}
                  className="h-9 text-sm border-border" required />
              </div>
            </div>

            {/* Live percentage preview */}
            {pct && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${Number(pct) >= 60 ? 'bg-green-50 text-green-700' : Number(pct) >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                }`}>
                <div className="h-2 flex-1 bg-background/60 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-current transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span>{pct}%</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <Button type="submit" disabled={loading}
                className="bg-violet-600 hover:bg-violet-700 text-primary-foreground h-8 text-sm gap-2 px-5">
                <Upload className="h-3.5 w-3.5" />
                {loading ? 'Saving...' : 'Save Marks'}
              </Button>

              {saved && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved: {saved.name} · {saved.examType} · {saved.marks}
                </p>
              )}
            </div>
          </form>
        </div>
      )}

      {tab === 'csv' && (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-medium text-foreground">Bulk Upload via CSV</p>
            <p className="text-xs text-muted-foreground mt-1">
              Required columns: <code className="bg-muted px-1 rounded">enrollment_no, exam_type, marks_obtained, total_marks</code>
              {' · '}
              <a href="/samples/sample_marks.csv" download className="text-violet-600 hover:underline">Download sample</a>
            </p>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Choose CSV File</Label>
              <Input type="file" accept=".csv" onChange={handleCsv} className="text-sm border-border" />
            </div>

            {csvPreview.length > 0 && (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-2.5 bg-muted border-b border-border flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">{csvPreview.length} rows detected</p>
                  <p className="text-xs text-muted-foreground">
                    {csvPreview.filter(r => students.some(s => s.rollNumber === r.enrollment_no)).length} matched
                  </p>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {['Enrollment No', 'Exam Type', 'Obtained', 'Total', '%', 'Match'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {csvPreview.slice(0, 10).map((row, i) => {
                      const matched = students.some(s => s.rollNumber === row.enrollment_no)
                      const p = row.marks_obtained && row.total_marks
                        ? ((Number(row.marks_obtained) / Number(row.total_marks)) * 100).toFixed(0)
                        : '—'
                      return (
                        <tr key={i} className="hover:bg-muted">
                          <td className="px-4 py-2.5 font-mono text-foreground/80">{row.enrollment_no}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{row.exam_type}</td>
                          <td className="px-4 py-2.5 text-foreground/80">{row.marks_obtained}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{row.total_marks}</td>
                          <td className="px-4 py-2.5">
                            <span className={`font-medium ${Number(p) >= 60 ? 'text-green-600' : Number(p) >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                              {p}%
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            {matched
                              ? <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" />OK</span>
                              : <span className="text-red-400">Not found</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {csvPreview.length > 10 && (
                  <div className="px-4 py-2 bg-muted border-t border-border text-xs text-muted-foreground">
                    +{csvPreview.length - 10} more rows
                  </div>
                )}
              </div>
            )}

            <Button onClick={submitCsv} disabled={loading || !csvPreview.length}
              className="bg-violet-600 hover:bg-violet-700 text-primary-foreground h-8 text-sm gap-2">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {loading ? 'Uploading...' : `Upload ${csvPreview.length || ''} Records`}
            </Button>
          </div>
        </div>
      )}

      {/* ── Uploaded Records Table ── */}
      {records.length > 0 && (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Uploaded Records</p>
            <span className="text-xs text-muted-foreground">{records.length} entries · {subject}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {['Student', 'Roll No', 'Exam Type', 'Marks', '%', 'Date'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.slice((recPage - 1) * PAGE_SIZE, recPage * PAGE_SIZE).map((r, i) => {
                  const p = ((r.marksObtained / r.totalMarks) * 100).toFixed(0)
                  return (
                    <tr key={i} className="hover:bg-muted transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">{r.studentName}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.rollNumber}</td>
                      <td className="px-4 py-2.5 text-muted-foreground capitalize">{r.examType.replace('_', ' ')}</td>
                      <td className="px-4 py-2.5 text-foreground/80">{r.marksObtained}/{r.totalMarks}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PCT_COLOR(p)}`}>{p}%</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={recPage} total={records.length} pageSize={PAGE_SIZE} onChange={setRecPage} />
        </div>
      )}
    </div>
  )
}
