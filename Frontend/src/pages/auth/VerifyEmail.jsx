import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MailCheck } from 'lucide-react'
import api from '@/lib/axios'
import toast from 'react-hot-toast'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const userId = params.get('userId')
  const { verifyEmail, isLoading } = useAuthStore()
  const [otp, setOtp] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    verifyEmail(userId, otp, navigate)
  }

  const resend = async () => {
    try {
      await api.post('/auth/resend-otp', { userId })
      toast.success('OTP resent!')
    } catch {
      toast.error('Failed to resend OTP')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>Enter the 6-digit OTP sent to your email</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>OTP Code</Label>
                <Input
                  placeholder="123456"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Didn't receive it?{' '}
              <button onClick={resend} className="text-primary hover:underline">Resend OTP</button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
