import { create } from 'zustand'
import api from '../lib/axios'
import toast from 'react-hot-toast'

const ROLE_HOME = {
  admin: '/admin',
  college_admin: '/college-admin',
  principal: '/principal',
  faculty: '/faculty',
  mentor: '/mentor',
  subject_coordinator: '/coordinator',
  student: '/student',
}

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,

  checkAuth: async () => {
    set({ isCheckingAuth: true })
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data.user, isAuthenticated: true, isCheckingAuth: false })
    } catch (err) {
      set({ user: null, isAuthenticated: false, isCheckingAuth: false })
    }
  },

  login: async (email, password, navigate) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      set({ user: data.user, isAuthenticated: true, isLoading: false })
      toast.success(`Welcome, ${data.user.name}!`)
      navigate(ROLE_HOME[data.user.role] || '/', { replace: true })
      return true
    } catch (err) {
      set({ isLoading: false })
      const errorMsg = err.response?.data?.error || 'Login failed'
      toast.error(errorMsg)
      return false
    }
  },

  logout: async (navigate) => {
    await api.post('/auth/logout').catch(() => {})
    set({ user: null, isAuthenticated: false })
    navigate('/login', { replace: true })
  },

  forgotPassword: async (email) => {
    set({ isLoading: true })
    try {
      await api.post('/auth/forgot-password', { email })
      set({ isLoading: false })
      toast.success('Reset link sent to your email')
      return true
    } catch (err) {
      set({ isLoading: false })
      toast.error(err.response?.data?.error || 'Failed')
      return false
    }
  },

  resetPassword: async (token, password, navigate) => {
    set({ isLoading: true })
    try {
      await api.post(`/auth/reset-password/${token}`, { password })
      set({ isLoading: false })
      toast.success('Password reset! Please login.')
      navigate('/login')
    } catch (err) {
      set({ isLoading: false })
      toast.error(err.response?.data?.error || 'Failed')
    }
  },
}))

export default useAuthStore
