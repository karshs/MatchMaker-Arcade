import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import LoginPage         from './pages/LoginPage'
import DashboardPage     from './pages/DashboardPage'
import CustomerDetailPage from './pages/CustomerDetailPage'
import MatchingPage      from './pages/MatchingPage'

function PrivateRoute({ children }) {
  const { matchmaker, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Geist, Inter, sans-serif', fontSize: 14, color: '#777'
      }}>
        Loading…
      </div>
    )
  }

  return matchmaker ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { matchmaker, loading } = useAuth()
  if (loading) return null
  return matchmaker ? <Navigate to="/" replace /> : children
}

function AppRoutes() {
  const { login } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage onLogin={login} />
        </PublicRoute>
      } />

      {/* Protected */}
      <Route path="/" element={
        <PrivateRoute><DashboardPage /></PrivateRoute>
      } />

      <Route path="/customers" element={
        <PrivateRoute><DashboardPage /></PrivateRoute>
      } />

      <Route path="/customers/:id" element={
        <PrivateRoute><CustomerDetailPage /></PrivateRoute>
      } />

      <Route path="/customers/:id/matches" element={
        <PrivateRoute><MatchingPage /></PrivateRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
