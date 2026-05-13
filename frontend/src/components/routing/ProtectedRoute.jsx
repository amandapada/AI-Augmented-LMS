import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

function isAllowed(allowRole, userRole) {
  if (!allowRole || !userRole) return false
  if (allowRole === 'student') return userRole === 'student'
  if (allowRole === 'lecturer') return userRole === 'lecturer' || userRole === 'admin'
  return userRole === allowRole
}

export function ProtectedRoute({ allowRole, children }) {
  const { user, role } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (allowRole && !isAllowed(allowRole, role)) return <Navigate to="/login" replace />

  return children
}
