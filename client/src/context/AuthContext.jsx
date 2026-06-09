import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [matchmaker, setMatchmaker] = useState(null)
  const [loading,    setLoading]    = useState(true) // true while checking stored token

  // On mount — if there's a stored token, validate it
  useEffect(() => {
    const token = localStorage.getItem('mm_token')
    if (!token) { setLoading(false); return }

    authApi.me()
      .then(res => setMatchmaker(res.matchmaker))
      .catch(() => {
        // Token invalid / expired — clear it
        localStorage.removeItem('mm_token')
      })
      .finally(() => setLoading(false))
  }, [])

  /** Login — stores JWT, sets matchmaker state */
  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password) // throws on failure
    localStorage.setItem('mm_token', res.token)
    setMatchmaker(res.matchmaker)
    return res
  }, [])

  /** Logout — clears everything */
  const logout = useCallback(() => {
    localStorage.removeItem('mm_token')
    setMatchmaker(null)
  }, [])

  return (
    <AuthContext.Provider value={{ matchmaker, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook — use inside any component that needs auth state */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
