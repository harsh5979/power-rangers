import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const status = error.response?.status
    // Only force-logout when the session check itself returns 401
    if (status === 401 && url.includes('/auth/me') && !window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
