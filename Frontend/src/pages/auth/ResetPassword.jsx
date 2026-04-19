import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { resetPassword, isLoading } = useAuthStore()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [err, setErr] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return setErr('Passwords do not match')
    setErr('')
    resetPassword(token, form.password, navigate)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" placeholder="••••••••" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm Password</Label>
                <Input type="password" placeholder="••••••••" value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required />
              </div>
              {err && <p className="text-sm text-destructive">{err}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
