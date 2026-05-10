import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export function ProtectedRoute({ allowRole, children }) {
  const { user, role } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (allowRole && role !== allowRole) return <Navigate to="/login" replace />

  return children
}

