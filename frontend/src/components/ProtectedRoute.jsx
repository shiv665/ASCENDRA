import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    // Redirect to login page, but save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
