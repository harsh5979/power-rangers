import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, FileSpreadsheet, UserPlus, Pencil, Trash2, X, Check, Calendar } from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'
import Pagination from '@/components/ui/Pagination'
import { TabBar, SearchInput } from '@/components/shared'
import { useStudents, useCreateStudent, useBulkCreateStudents, useUpdateStudent, useDeleteStudent, useBulkDeleteStudents, useDepartments } from '@/hooks/useApi'
import { PAGE_SIZE } from '@/lib/constants'
import useAuthStore from '@/store/authStore'

// Generate batch years: e.g. "2026-27", "2025-26", ... "2018-19"
const BATCH_YEARS = Array.from({ length: new Date().getFullYear() - 2017 }, (_, i) => {
  const y = new Date().getFullYear() - i
  return `${y}-${String(y + 1).slice(2)}`
})

// Calculate display semester from batchYear
function displaySemester(batchYear) {
  if (!batchYear) return '—'
  const admStartYear = parseInt(batchYear.split('-')[0], 10)
  if (isNaN(admStartYear)) return '—'
  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()
  const currentAcadStartYear = month >= 6 ? year : year - 1
  const currentYear = currentAcadStartYear - admStartYear + 1
  if (currentYear < 1) return '1'
  const isSecondHalf = month >= 12 || month <= 5
  const semester = (currentYear - 1) * 2 + (isSecondHalf ? 2 : 1)
  return String(semester)
}

function displayYear(batchYear) {
  if (!batchYear) return '—'
  const admStartYear = parseInt(batchYear.split('-')[0], 10)
  if (isNaN(admStartYear)) return '—'
  const now = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()
  const currentAcadStartYear = month >= 6 ? year : year - 1
  const yr = currentAcadStartYear - admStartYear + 1
  return yr < 1 ? '1' : String(yr)
}

const empty = { name: '', email: '', rollNumber: '', department: '', batchYear: '' }
const TABS  = [{ key: 'manual', label: 'Manual' }, { key: 'csv', label: 'CSV Import' }]

export default function CollegeAdminAddStudents() {
  const { user }  = useAuthStore()
  const [tab, setTab]         = useState('manual')
  const [form, setForm]       = useState(empty)
  const [csvPreview, setCsv]  = useState([])
  const [lastAdded, setLast]  = useState(null)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [editId, setEditId]   = useState(null)
  const [editData, setEditData] = useState({})

  const [selected, setSelected]   = useState(new Set())

  const { data, isLoading }   = useStudents({ page, limit: PAGE_SIZE, search })
  const { data: departments } = useDepartments()
  const createMutation        = useCreateStudent()
  const bulkMutation          = useBulkCreateStudents()
  const updateMutation        = useUpdateStudent()
  const deleteMutation        = useDeleteStudent()
  const bulkDeleteMutation    = useBulkDeleteStudents()

  const deptList = departments || []

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submitManual = async (e) => {
    e.preventDefault()
    await createMutation.mutateAsync(form)
    setLast(form.name)
    setForm(empty)
    setPage(1)
  }

  const handleCsv = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const lines = ev.target.result.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/ /g, '_'))
      setCsv(lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim())
        return headers.reduce((o, h, i) => { o[h] = vals[i]; return o }, {})
      }).filter(r => r.name && r.email))
    }
    reader.readAsText(file)
  }

  const submitCsv = async () => {
    const students = csvPreview.map(r => ({
      name: r.name, email: r.email,
      rollNumber: r.roll_number || r.rollnumber || r.roll_no,
      department: r.department,
      division: r.division || '',
      batchYear: r.batch_year || r.batchyear || r.batch
    }))
    try {
      const result = await bulkMutation.mutateAsync(students)
      if (result.failed.length === 0) {
        setCsv([])
        document.querySelector('input[type=file]').value = ''
      }
      setPage(1)
    } catch {}
  }

  const saveEdit = (id) => {
    updateMutation.mutate({ id, ...editData }, { onSuccess: () => setEditId(null) })
  }

  const students  = data?.data  || []
  const total     = data?.total || 0
  const allIds    = students.map(s => s._id)
  const allChecked = allIds.length > 0 && allIds.every(id => selected.has(id))
  const toggleAll  = () => setSelected(allChecked ? new Set() : new Set(allIds))
  const toggleOne  = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const bulkDelete = () => {
    if (!confirm(`Delete ${selected.size} student(s)?`)) return
    bulkDeleteMutation.mutate([...selected], { onSuccess: () => setSelected(new Set()) })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Add Students</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{user?.college} — students receive login credentials via email automatically</p>
        </div>
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'manual' && (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-violet-600" />
            <p className="text-sm font-semibold text-foreground">Add Single Student</p>
          </div>
          <form onSubmit={submitManual} className="px-5 py-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { k: 'name',       label: 'Full Name',   ph: 'Arjun Mehta',          req: true },
                { k: 'email',      label: 'Email',       ph: 'student@college.edu',  req: true, type: 'email' },
                { k: 'rollNumber', label: 'Roll Number', ph: '22CE001',              req: true },
              ].map(({ k, label, ph, req, type = 'text' }) => (
                <div key={k} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
                  <Input type={type} className="h-9 text-sm border-border" placeholder={ph}
                    value={form[k]} onChange={e => set(k, e.target.value)} required={req} />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Department</Label>
                {deptList.length > 0 ? (
                  <Select value={form.department} onValueChange={v => set('department', v)}>
                    <SelectTrigger className="h-9 text-sm border-border"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {deptList.map(d => <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input className="h-9 text-sm border-border" placeholder="Computer Engineering"
                    value={form.department} onChange={e => set('department', e.target.value)} required />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Batch Year (Admission)</Label>
                <Select value={form.batchYear} onValueChange={v => set('batchYear', v)}>
                  <SelectTrigger className="h-9 text-sm border-border"><SelectValue placeholder="e.g. 2024-25" /></SelectTrigger>
                  <SelectContent>
                    {BATCH_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.batchYear && (
                  <p className="text-xs text-violet-600 flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    Currently Year {displayYear(form.batchYear)} · Semester {displaySemester(form.batchYear)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={createMutation.isPending}
                className="h-8 px-5 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-primary-foreground rounded-lg disabled:opacity-50 transition-colors">
                {createMutation.isPending ? 'Adding...' : 'Add Student'}
              </button>
              {lastAdded && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />{lastAdded} added</p>}
            </div>
          </form>
        </div>
      )}

      {tab === 'csv' && (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Bulk Import via CSV</p>
            <p className="text-xs text-muted-foreground mt-1">
              Columns: <code className="bg-muted px-1 rounded">name, email, roll_number, department, batch_year, division</code>
              {' · '}
              <a href="/samples/sample_students.csv" download className="text-violet-600 hover:underline">Download sample</a>
            </p>
          </div>
          <div className="px-5 py-5 space-y-4">
            <Input type="file" accept=".csv" onChange={handleCsv} className="text-sm border-border" />
            {csvPreview.length > 0 && (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-2.5 bg-muted border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground">{csvPreview.length} students detected</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border">
                      {['Name', 'Email', 'Roll No', 'Dept', 'Batch Year', 'Division'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {csvPreview.slice(0, PAGE_SIZE).map((r, i) => (
                        <tr key={i} className="hover:bg-muted">
                          <td className="px-4 py-2.5 font-medium text-foreground">{r.name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{r.email}</td>
                          <td className="px-4 py-2.5 font-mono text-muted-foreground">{r.roll_number || r.rollnumber || r.roll_no}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{r.department}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{r.batch_year || r.batchyear || r.batch}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{r.division || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvPreview.length > PAGE_SIZE && <div className="px-4 py-2 bg-muted border-t text-xs text-muted-foreground">+{csvPreview.length - PAGE_SIZE} more</div>}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button onClick={submitCsv} disabled={bulkMutation.isPending || !csvPreview.length}
                className="h-8 px-4 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-primary-foreground rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {bulkMutation.isPending ? 'Importing...' : `Import ${csvPreview.length || ''} Students`}
              </button>
              {csvPreview.length > 0 && (
                <button onClick={() => { setCsv([]); document.querySelector('input[type=file]').value = '' }}
                  className="h-8 px-4 text-sm font-medium text-muted-foreground hover:text-red-500 border border-border hover:border-red-300 rounded-lg transition-colors">
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Students list */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">All Students <span className="text-muted-foreground font-normal">({total})</span></p>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <button onClick={bulkDelete} disabled={bulkDeleteMutation.isPending}
                className="h-7 px-3 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1.5">
                <Trash2 className="h-3 w-3" />
                Delete {selected.size}
              </button>
            )}
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} className="w-48" />
          </div>
        </div>
        {isLoading ? <PageLoader /> : students.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No students yet.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-4 py-2.5 w-8">
                      <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded border-border" />
                    </th>
                    {['Name', 'Roll No', 'Dept', 'Batch Year', 'Year', 'Sem', ''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map(s => (
                    <tr key={s._id} className={`hover:bg-muted transition-colors ${selected.has(s._id) ? 'bg-muted/60' : ''}`}>
                      {editId === s._id ? (
                        <>
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2"><Input className="h-7 text-xs border-border w-32" value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} /></td>
                          <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{s.rollNumber}</td>
                          <td className="px-4 py-2"><Input className="h-7 text-xs border-border w-32" value={editData.department} onChange={e => setEditData(p => ({ ...p, department: e.target.value }))} /></td>
                          <td className="px-4 py-2"><Input className="h-7 text-xs border-border w-20" value={editData.batchYear || ''} onChange={e => setEditData(p => ({ ...p, batchYear: e.target.value }))} /></td>
                          <td className="px-4 py-2 text-xs text-muted-foreground">{displayYear(editData.batchYear)}</td>
                          <td className="px-4 py-2 text-xs text-muted-foreground">{displaySemester(editData.batchYear)}</td>
                          <td className="px-4 py-2 flex items-center gap-2">
                            <button onClick={() => saveEdit(s._id)} className="text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setEditId(null)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2.5">
                            <input type="checkbox" checked={selected.has(s._id)} onChange={() => toggleOne(s._id)} className="rounded border-border" />
                          </td>
                          <td className="px-4 py-2.5 font-medium text-foreground">{s.name}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{s.rollNumber}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{s.department}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{s.batchYear || s.batch || '—'}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{displayYear(s.batchYear)}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{s.semester || displaySemester(s.batchYear)}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setEditId(s._id); setEditData({ name: s.name, department: s.department, batchYear: s.batchYear || '' }) }}
                                className="text-muted-foreground hover:text-violet-600 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                              <button onClick={() => { if (confirm(`Delete ${s.name}?`)) deleteMutation.mutate(s._id) }}
                                className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
