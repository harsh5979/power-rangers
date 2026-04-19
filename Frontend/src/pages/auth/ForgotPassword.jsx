import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { KeyRound, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const { forgotPassword, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await forgotPassword(email)
    if (ok) setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              {sent ? 'Check your email for the reset link' : "Enter your email and we'll send a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" placeholder="you@college.edu" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  A password reset link has been sent to <strong>{email}</strong>
                </p>
                <Button variant="outline" onClick={() => setSent(false)}>Try another email</Button>
              </div>
            )}
            <div className="flex justify-center mt-4">
              <Link to="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3 w-3" /> Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
