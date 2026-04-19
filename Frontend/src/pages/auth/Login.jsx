import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'

const ERROR_MESSAGES = {
  user_not_found: 'No account found with this Google email. Please contact your administrator.',
  auth_failed: 'Google authentication failed. Please try again.',
  token_failed: 'Failed to authenticate with Google. Please try again.',
  no_code: 'Authentication cancelled.',
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isLoading, checkAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    const successParam = searchParams.get('success')
    
    if (successParam === 'true') {
      setChecking(true)
      checkAuth().then(() => {
        const user = useAuthStore.getState().user
        if (user) {
          const ROLE_HOME = {
            admin: '/admin',
            college_admin: '/college-admin',
            principal: '/principal',
            faculty: '/faculty',
            mentor: '/mentor',
            subject_coordinator: '/coordinator',
            student: '/student',
          }
          navigate(ROLE_HOME[user.role] || '/', { replace: true })
        }
      }).finally(() => setChecking(false))
    } else if (errorParam) {
      setError(ERROR_MESSAGES[errorParam] || 'An error occurred during login.')
    }
  }, [searchParams, navigate, checkAuth])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(form.email, form.password, navigate)
    if (result === false) {
      setError('Invalid email or password. Please try again.')
    }
  }

  const handleGoogleLogin = () => {
    setChecking(true)
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      {(isLoading || checking) && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
            <p className="text-sm text-muted-foreground">Signing in...</p>
          </div>
        </div>
      )}
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Academic Risk Platform</h1>
          <p className="text-sm text-muted-foreground">Power-Rangers</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@college.edu"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <button type="button" onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || checking}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading || checking}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {checking ? 'Redirecting...' : 'Sign in with Google'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
