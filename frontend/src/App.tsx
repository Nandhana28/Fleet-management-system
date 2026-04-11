import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import { VerifyEmail, VerifyPhone, ForgotPassword, ResetPassword } from './pages/auth/AuthPages'
import AuthSuccess from './pages/auth/AuthSuccess'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Agent from './pages/Agent'
import Settings from './pages/Settings'
import Header from './components/layout/Header'
import AlertBanner from './components/alerts/AlertBanner'


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/*" element={
          <div className="flex flex-col h-screen overflow-hidden">
            <Header />
            <AlertBanner />
            <main className="flex-1 overflow-hidden">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/verify-phone" element={<VerifyPhone />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth-success" element={<AuthSuccess />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/agent" element={<Agent />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}