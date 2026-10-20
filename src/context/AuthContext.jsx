import { createContext, useContext, useEffect, useState } from 'react'
import * as dataService from '../lib/dataService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dataService.getCurrentUser().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  async function login(email, password) {
    const u = await dataService.signIn({ email, password })
    const full = await dataService.getCurrentUser()
    setUser(full || u)
    return full || u
  }

  async function register({ email, password, name, role }) {
    const u = await dataService.signUp({ email, password, name, role })
    const full = await dataService.getCurrentUser()
    setUser(full || u)
    return full || u
  }

  async function logout() {
    await dataService.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
