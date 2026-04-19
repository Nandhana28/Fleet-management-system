import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import { VerifyEmail, VerifyPhone, ForgotPassword, ResetPassword } from './pages/auth/AuthPages'
import AuthSuccess from './pages/auth/AuthSuccess'
import Welcome from './pages/Welcome'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Agent from './pages/Agent'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Header from './components/layout/Header'
import AlertBanner from './components/alerts/AlertBanner'
import ToastContainer from './components/ui/ToastContainer'
import Maintenance from "./pages/Maintenance";
import Tasks from './pages/Tasks'

const AUTH_PATHS = ['/login', '/signup', '/verify-email', '/verify-phone', '/forgot-password', '/reset-password', '/auth-success']

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppShell() {
  const location = useLocation()
  const isAuthPage = AUTH_PATHS.includes(location.pathname)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {!isAuthPage && <Header />}
      {!isAuthPage && <AlertBanner />}
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-phone" element={<VerifyPhone />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth-success" element={<AuthSuccess />} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/agent" element={<ProtectedRoute><Agent /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  )
}