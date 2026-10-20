import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        SkillBuilder
      </Link>
      {user && (
        <div className="navbar-links">
          <span className="navbar-user">
            {user.name} ({user.role})
          </span>
          <button onClick={handleLogout} className="btn-link">
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
