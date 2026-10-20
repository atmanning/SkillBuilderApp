import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Wraps a route element and redirects to /login if there's no signed-in
// user, or to the other role's dashboard if the signed-in user's role
// doesn't match what this route requires.
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth()

  if (loading) return <p className="loading">Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />
  }
  return children
}
