import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Building2, Mail, User, Trash2 } from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'
import Pagination from '@/components/ui/Pagination'
import { useCollegeAdmins, useCreateCollegeAdmin, useDeleteCollegeAdmin } from '@/hooks/useApi'
import { PAGE_SIZE } from '@/lib/constants'

const empty = { name: '', email: '', college: '' }

export default function AdminDashboard() {
  const [form, setForm] = useState(empty)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useCollegeAdmins({ page, limit: PAGE_SIZE })
  const createMutation = useCreateCollegeAdmin()
  const deleteMutation = useDeleteCollegeAdmin()

  const admins = data?.data || []
  const total = data?.total || 0

  const submit = async (e) => {
    e.preventDefault()
    await createMutation.mutateAsync(form)
    setForm(empty)
    setPage(1)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Create a college and its admin account</p>
      </div>

      {/* Create College Admin */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-violet-600" />
          <p className="text-sm font-semibold text-foreground">Create College & Admin</p>
        </div>
        <form onSubmit={submit} className="px-5 py-5 space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { k: 'name', icon: User, ph: 'Harsh Prajapati', label: 'Admin Full Name' },
              { k: 'email', icon: Mail, ph: 'admin@college.edu', label: 'Admin Email', type: 'email' },
              { k: 'college', icon: Building2, ph: 'SVIT College', label: 'College Name' },
            ].map(({ k, icon: Icon, ph, label, type = 'text' }) => (
              <div key={k} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input type={type} className="pl-8 h-9 text-sm border-border" placeholder={ph}
                    value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} required />
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button type="submit" disabled={createMutation.isPending}
              className="h-9 px-4 sm:px-5 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-primary-foreground rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap">
              {createMutation.isPending ? 'Creating...' : (
                <>
                  <span className="sm:hidden">Create & Send</span>
                  <span className="hidden sm:inline">Create College & Send Credentials</span>
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground">Login credentials will be emailed to the college admin.</p>
          </div>
        </form>
      </div>

      {/* College Admins List */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">All College Admins</p>
          <span className="text-xs text-muted-foreground">{total} total</span>
        </div>
        {isLoading ? <PageLoader /> : admins.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No colleges yet. Create one above.</div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {admins.map(a => (
                <div key={a._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700 shrink-0">
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-medium text-violet-600">{a.college}</p>
                      <p className="text-xs text-muted-foreground">{a.lastLogin ? `Last login: ${new Date(a.lastLogin).toLocaleDateString()}` : 'Never logged in'}</p>
                    </div>
                    <button onClick={() => { if (confirm(`Delete ${a.name}?`)) deleteMutation.mutate(a._id) }}
                      className="text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
