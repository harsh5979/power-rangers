import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, TrendingDown, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPES = [
  { value: 'counselling', label: 'Counselling Session' },
  { value: 'remedial_class', label: 'Remedial Class' },
  { value: 'assignment_extension', label: 'Assignment Extension' },
  { value: 'parent_meeting', label: 'Parent Meeting' },
  { value: 'other', label: 'Other' },
]

export default function FacultyInterventions() {
  const [interventions, setInterventions] = useState([])
  const [students, setStudents] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ studentId: '', type: '', remarks: '' })
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([api.get('/interventions/my'), api.get('/students')]).then(([i, s]) => {
      setInterventions(i.data)
      setStudents(s.data?.data || s.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/interventions', form)
      toast.success('Intervention logged!')
      setOpen(false)
      setForm({ studentId: '', type: '', remarks: '' })
      load()
    } catch { toast.error('Failed to log intervention') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interventions</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Log Intervention</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log New Intervention</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Student</Label>
                <Select onValueChange={v => setForm(p => ({ ...p, studentId: v }))} required>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map(s => <SelectItem key={s._id} value={s._id}>{s.name} ({s.rollNumber})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select onValueChange={v => setForm(p => ({ ...p, type: v }))} required>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Remarks</Label>
                <Textarea placeholder="Describe the intervention..." value={form.remarks}
                  onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} required />
              </div>
              <Button type="submit" className="w-full">Log Intervention</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : (
        <div className="space-y-3">
          {interventions.map(i => (
            <Card key={i._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{i.student?.name}</p>
                      <span className="text-xs text-muted-foreground">{i.student?.rollNumber}</span>
                      <Badge variant="secondary" className="text-xs">{TYPES.find(t => t.value === i.type)?.label || i.type}</Badge>
                      <Badge variant={i.status === 'closed' ? 'success' : 'outline'} className="text-xs">{i.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{i.remarks}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(i.date).toLocaleDateString()}</p>
                  </div>
                  {/* Pre/Post comparison */}
                  {i.preRiskScore != null && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Risk Score</p>
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-sm font-mono">{i.preRiskScore}</span>
                        {i.postRiskScore != null && (
                          <>
                            <span className="text-muted-foreground">→</span>
                            <span className={`text-sm font-mono ${i.postRiskScore < i.preRiskScore ? 'text-green-500' : 'text-destructive'}`}>
                              {i.postRiskScore}
                            </span>
                            {i.postRiskScore < i.preRiskScore
                              ? <TrendingDown className="h-3 w-3 text-green-500" />
                              : <TrendingUp className="h-3 w-3 text-destructive" />}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {interventions.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No interventions logged yet</p>
          )}
        </div>
      )}
    </div>
  )
}
