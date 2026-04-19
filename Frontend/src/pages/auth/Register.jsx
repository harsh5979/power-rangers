import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap } from 'lucide-react'

const ROLES = [
  { value: 'principal', label: 'Principal' },
  { value: 'faculty', label: 'Faculty Mentor' },
  { value: 'subject_coordinator', label: 'Subject Coordinator' },
  { value: 'student', label: 'Student' },
]

export default function Register() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '', department: '', rollNumber: '', semester: '', subjectName: '' })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    register(form, navigate)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Academic Risk Platform</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Register with your role to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input placeholder="Dr. John Smith" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="you@college.edu" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select onValueChange={v => set('role', v)} required>
                  <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input placeholder="Computer Science" value={form.department} onChange={e => set('department', e.target.value)} />
              </div>
              {form.role === 'subject_coordinator' && (
                <div className="space-y-1.5">
                  <Label>Subject Name</Label>
                  <Input placeholder="e.g. Data Structures" value={form.subjectName || ''} onChange={e => set('subjectName', e.target.value)} required />
                </div>
              )}
              {form.role === 'student' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Roll Number</Label>
                    <Input placeholder="CS2021001" value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Semester</Label>
                    <Input type="number" min="1" max="8" placeholder="3" value={form.semester} onChange={e => set('semester', e.target.value)} />
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
