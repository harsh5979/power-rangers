import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Plus, Pencil, Trash2, X, Check, Clock, BookOpen, ChevronRight } from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'
import useAuthStore from '@/store/authStore'
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '@/hooks/useApi'

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6]

export default function CollegeAdminDepartments() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [name, setName]               = useState('')
  const [durationYears, setDuration]  = useState('')
  const [editId, setEditId]           = useState(null)
  const [editData, setEditData]       = useState({})

  const { data: departments, isLoading } = useDepartments()
  const createMutation = useCreateDepartment()
  const updateMutation = useUpdateDepartment()
  const deleteMutation = useDeleteDepartment()

  const submit = async (e) => {
    e.preventDefault()
    if (!name || !durationYears) return
    await createMutation.mutateAsync({ name, durationYears: Number(durationYears) })
    setName('')
    setDuration('')
  }

  const saveEdit = (id) => {
    updateMutation.mutate({ id, name: editData.name, durationYears: Number(editData.durationYears) }, {
      onSuccess: () => setEditId(null),
    })
  }

  const totalSems = durationYears ? Number(durationYears) * 2 : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Departments</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{user?.college} — manage academic departments</p>
      </div>

      {/* Create Department */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Plus className="h-4 w-4 text-violet-600" />
          <p className="text-sm font-semibold text-foreground">Add Department</p>
        </div>
        <form onSubmit={submit} className="px-5 py-5 space-y-4">
          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Department Name</Label>
              <Input className="h-9 text-sm border-border" placeholder="Computer Engineering"
                value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Total Duration (Years)</Label>
              <Select value={durationYears} onValueChange={setDuration}>
                <SelectTrigger className="h-9 text-sm border-border"><SelectValue placeholder="Select years" /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(y => <SelectItem key={y} value={String(y)}>{y} {y === 1 ? 'Year' : 'Years'}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              {totalSems && (
                <div className="flex items-center gap-1.5 text-sm text-violet-600 font-medium bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-100">
                  <BookOpen className="h-3.5 w-3.5" />
                  {totalSems} Semesters
                </div>
              )}
            </div>
          </div>
          <button type="submit" disabled={createMutation.isPending}
            className="h-8 px-5 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-primary-foreground rounded-lg disabled:opacity-50 transition-colors">
            {createMutation.isPending ? 'Creating...' : 'Create Department'}
          </button>
        </form>
      </div>

      {/* Department List */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Building2 className="h-4 w-4 text-violet-600" />
          <p className="text-sm font-semibold text-foreground">All Departments
            <span className="text-muted-foreground font-normal ml-1">({departments?.length || 0})</span>
          </p>
        </div>
        {isLoading ? <PageLoader /> : !departments?.length ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No departments created yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {departments.map(d => (
              <div key={d._id} className="px-5 py-3.5 hover:bg-muted transition-colors">
                {editId === d._id ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <Input className="h-8 text-sm border-border w-56" value={editData.name}
                      onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} />
                    <Select value={String(editData.durationYears)} onValueChange={v => setEditData(p => ({ ...p, durationYears: v }))}>
                      <SelectTrigger className="h-8 text-sm border-border w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map(y => <SelectItem key={y} value={String(y)}>{y} Yr</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-violet-600 font-medium">→ {Number(editData.durationYears) * 2} sems</span>
                    <button onClick={() => saveEdit(d._id)} className="text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditId(null)} className="text-muted-foreground hover:text-muted-foreground"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => navigate(`${d._id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {d.durationYears} {d.durationYears === 1 ? 'Year' : 'Years'}
                          </span>
                          <span className="text-xs text-violet-600 font-medium flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> {d.totalSemesters} Semesters
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); setEditId(d._id); setEditData({ name: d.name, durationYears: d.durationYears }) }}
                        className="text-muted-foreground hover:text-violet-600 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${d.name}"?`)) deleteMutation.mutate(d._id) }}
                        className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      <ChevronRight className="h-4 w-4 text-foreground/70" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
