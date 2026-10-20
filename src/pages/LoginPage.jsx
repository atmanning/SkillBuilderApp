import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user =
        mode === 'login'
          ? await login(form.email, form.password)
          : await register(form)
      navigate(user.role === 'teacher' ? '/teacher' : '/student')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-centered">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>{mode === 'login' ? 'Sign in' : 'Create an account'}</h1>

        {mode === 'register' && (
          <label>
            Name
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
          />
        </label>

        {mode === 'register' && (
          <label>
            I am a...
            <select value={form.role} onChange={(e) => update('role', e.target.value)}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </label>
        )}

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={busy}>
          {busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <button
          type="button"
          className="btn-link"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
