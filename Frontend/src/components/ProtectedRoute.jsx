import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { useEffect } from 'react'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, setRedirectPath } = useAuthStore()
  const location = useLocation()


  useEffect(() => {
    if (!isAuthenticated) {
      setRedirectPath(location.pathname)
    }
  }, [isAuthenticated, location.pathname, setRedirectPath])

  if (isAuthenticated === false) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
