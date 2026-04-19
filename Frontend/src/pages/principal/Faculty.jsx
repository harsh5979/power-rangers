import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Mail, User, BookOpen, Pencil, Trash2, X, Check, GraduationCap, RefreshCw } from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'
import Pagination from '@/components/ui/Pagination'
import { SearchInput } from '@/components/shared'
import { useFaculty, useCreateFaculty, useUpdateFaculty, useDeleteFaculty, useCollegeInfo } from '@/hooks/useApi'
import { PAGE_SIZE } from '@/lib/constants'
import useAuthStore from '@/store/authStore'
import api from '@/lib/axios'
import toast from 'react-hot-toast'

const emptyForm = { name: '', email: '', role: 'faculty', department: '', subjects: [] }

const ROLE_BADGE = {
  faculty: 'bg-blue-50 text-blue-700',
  mentor: 'bg-violet-50 text-violet-700',
  subject_coordinator: 'bg-green-50 text-green-700',
}
const ROLE_LABEL = { faculty: 'Faculty', mentor: 'Mentor', subject_coordinator: 'Subject Coordinator' }

// No batch years needed here since mentoring is assigned in Department Details

export default function PrincipalFaculty() {
  const { user } = useAuthStore()
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})

  const { data, isLoading } = useFaculty({ page, limit: PAGE_SIZE, search })
  const { data: collegeInfo } = useCollegeInfo(user?.role)
  const createMutation = useCreateFaculty()
  const updateMutation = useUpdateFaculty()
  const deleteMutation = useDeleteFaculty()

  const faculty = data?.data || []
  const total = data?.total || 0
  const departments = collegeInfo?.departments || []
  const subjectsByDept = collegeInfo?.subjectsByDepartment || {}

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const toggleSubject = (subjectName) => {
    setForm(p => {
      const isSelected = p.subjects.includes(subjectName)
      const newSubjects = isSelected ? p.subjects.filter(s => s !== subjectName) : [...p.subjects, subjectName]
      return { ...p, subjects: newSubjects }
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    const payload = { ...form }
    if (form.batch) payload.batch = form.batch
    await createMutation.mutateAsync(payload)
    setForm(emptyForm)
    setPage(1)
  }

  const saveEdit = (id) => {
    const payload = { id, name: editData.name, department: editData.department }
    if (typeof editData.subjects === 'string') {
      payload.subjects = editData.subjects.split(',').map(s => s.trim()).filter(Boolean)
    } else {
      payload.subjects = editData.subjects || []
    }
    updateMutation.mutate(payload, { onSuccess: () => setEditId(null) })
  }

  const resendCredentials = async (id, name) => {
    if (!confirm(`Resend new login credentials to ${name}? This will reset their password.`)) return
    const base = user?.role === 'college_admin' ? '/college-admin' : '/principal'
    try {
      await api.post(`${base}/faculty/${id}/resend-credentials`)
      toast.success(`New credentials sent to ${name}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend')
    }
  }

  const availableSubjects = subjectsByDept[form.department] || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Faculty Management</h1>
        <p className="text-sm text-muted-foreground">{user?.college}</p>
      </div>

      {/* Create form */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-violet-600" />
          <p className="text-sm font-semibold text-foreground">Add Faculty</p>
        </div>
        <form onSubmit={submit} className="px-5 py-5 space-y-4">
          {/* Row 1: name, email */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="pl-8 h-9 text-sm border-border" placeholder="Prof. Anita Shah"
                  value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input type="email" className="pl-8 h-9 text-sm border-border" placeholder="faculty@college.edu"
                  value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Department */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Department</Label>
              {departments.length > 0 ? (
                <Select value={form.department} onValueChange={v => { set('department', v); set('subjects', []) }}>
                  <SelectTrigger className="h-9 text-sm border-border">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input className="h-9 text-sm border-border" placeholder="e.g. Computer Science"
                  value={form.department} onChange={e => set('department', e.target.value)} />
              )}
            </div>
            {/* Role */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Role</Label>
              <Select value={form.role} onValueChange={v => set('role', v)}>
                <SelectTrigger className="h-9 text-sm border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="faculty">Faculty (No Attendance)</SelectItem>
                  <SelectItem value="subject_coordinator">Subject Coordinator (Can Take Attendance)</SelectItem>
                  <SelectItem value="mentor">Mentor (Batch Mentor)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subjects selection (shows if department is selected) */}
          {form.department && availableSubjects.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Assign Subjects</Label>
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map((sub, idx) => {
                  const isSelected = form.subjects.includes(sub.name)
                  return (
                    <button type="button" key={idx} onClick={() => toggleSubject(sub.name)}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-colors ${isSelected
                          ? 'bg-violet-50 text-violet-700 border-violet-200'
                          : 'bg-background text-muted-foreground border-border hover:border-border hover:bg-muted'
                        }`}>
                      <BookOpen className={`h-3 w-3 inline mr-1.5 ${isSelected ? 'text-violet-500' : 'text-muted-foreground'}`} />
                      {sub.name} <span className="text-[10px] opacity-70 ml-1">(Sem {sub.semester})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <button type="submit" disabled={createMutation.isPending}
            className="h-9 px-4 sm:px-5 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-primary-foreground rounded-lg disabled:opacity-50 transition-colors w-full sm:w-auto">
            {createMutation.isPending ? 'Creating...' : (
              <>
                <span className="sm:hidden">Create & Send</span>
                <span className="hidden sm:inline">Create & Send Credentials</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Faculty list */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">All Faculty & Mentors <span className="text-muted-foreground font-normal">({total})</span></p>
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} className="w-48" />
        </div>
        {isLoading ? <PageLoader /> : faculty.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No faculty added yet.</div>
        ) : (
          <div>
            <div className="divide-y divide-border">
              {faculty.map(f => (
                <div key={f._id} className="px-5 py-3 hover:bg-muted">
                  {editId === f._id ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <Input className="h-8 text-sm border-border w-36" value={editData.name}
                        onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} />
                      <Input className="h-8 text-sm border-border w-40" placeholder="Department"
                        value={editData.department} onChange={e => setEditData(p => ({ ...p, department: e.target.value }))} />
                      <Input className="h-8 text-sm border-border w-44" placeholder="Subjects (comma)"
                        value={editData.subjects} onChange={e => setEditData(p => ({ ...p, subjects: e.target.value }))} />

                      <button onClick={() => saveEdit(f._id)} className="text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditId(null)} className="text-muted-foreground hover:text-muted-foreground"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-sm font-semibold text-violet-700 shrink-0">
                          {f.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{f.email}{f.department ? ` · ${f.department}` : ''}</p>

                          {/* Subjects (If any) */}
                          {f.subjects?.length > 0 && (
                            <p className="text-xs text-violet-600 mt-0.5 flex items-center gap-1">
                              <BookOpen className="h-3 w-3" /> {f.subjects.join(', ')}
                            </p>
                          )}

                          {/* Batch Mentor (If any) */}
                          {f.batch && (
                            <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1 font-medium">
                              <GraduationCap className="h-3.5 w-3.5" />
                              Mentor of Batch {f.batch}
                              {f.branch ? ` · ${f.branch}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[f.role] || 'bg-muted text-muted-foreground'}`}>
                          {ROLE_LABEL[f.role] || f.role}
                        </span>
                        <button onClick={() => { setEditId(f._id); setEditData({ name: f.name, department: f.department || '', subjects: f.subjects?.join(', ') || '' }) }}
                          className="text-muted-foreground hover:text-violet-600 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => resendCredentials(f._id, f.name)}
                          title="Resend login credentials"
                          className="text-muted-foreground hover:text-blue-500 transition-colors"><RefreshCw className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { if (confirm(`Delete ${f.name}?`)) deleteMutation.mutate(f._id) }}
                          className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
