import { useState } from 'react'
import './LoginPage.css'

/* ── SVG Icons (inline — no extra dependency) ──────────────── */
const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5
         2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08
         C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5
         c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"
      stroke="var(--color-primary)"
      strokeWidth="1.8"
      fill="var(--color-primary-light)"
    />
  </svg>
)

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="11" width="14" height="10" rx="2"
      stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
  </svg>
)

const ArrowIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z"
      stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

/* ── Component ─────────────────────────────────────────────── */
// onLogin(email, password) is injected by App.jsx (calls useAuth().login)
export default function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      await onLogin(email.trim(), password)
      // Navigation handled by App.jsx after onLogin resolves
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo-wrap" aria-hidden="true">
          <HeartIcon />
        </div>

        {/* Title */}
        <h1 className="login-title">The Date Crew</h1>
        <p className="login-subtitle">Matchmaker Portal Login</p>

        {/* Error */}
        {error && <div className="login-error" role="alert">{error}</div>}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>

          <div className="login-field">
            <label className="login-label" htmlFor="login-email">Email</label>
            <div className="login-input-wrap">
              <UserIcon />
              <input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <LockIcon />
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            className="login-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing In…' : 'Sign In'}
            {!loading && <ArrowIcon />}
          </button>
        </form>

        {/* Forgot password */}
        <button
          id="login-forgot-btn"
          className="login-forgot"
          type="button"
          onClick={() => alert('Password reset coming soon!')}
        >
          Forgot your password?
        </button>

        {/* Divider + footer */}
        <div className="login-divider" />
        <div className="login-footer">
          <ShieldIcon />
          <span>Secure Internal System</span>
        </div>

      </div>
    </div>
  )
}
