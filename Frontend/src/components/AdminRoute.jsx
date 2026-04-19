import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    toast.error('Please login to access admin panel')
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    toast.error('Access denied. Admin privileges required.')
    return <Navigate to="/" replace />
  }

  return children
}

export default AdminRoute