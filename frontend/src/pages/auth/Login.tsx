import { useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { login as loginApi } from '../../services/authApi'
import { useToastStore } from '../../store/toast'


const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
  </svg>
)

const EyeIcon = ({ show }: { show: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    {show
      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
    }
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = (location.state as any)?.message
  const { showToast, clearLogs } = useToastStore()

  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const urlError = searchParams.get('error') === 'not_registered'
  ? 'This Google account is not registered. Please sign up first.'
  : null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try {
      const data = await loginApi({ email, password })
      localStorage.setItem('token', data.token)
      if (rememberMe) localStorage.setItem('rememberMe', 'true')
      clearLogs()
      showToast('Signed in successfully!')
      navigate('/welcome')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your FleetPulse account">

      {successMessage && (
        <div style={{ background: '#f0fdf9', border: '1px solid #99f6e4', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#0d9488', marginBottom: 16 }}>
          {successMessage}
        </div>
      )}

      {urlError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 12 }}>
          {urlError}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        <button className="social-btn" onClick={() => { window.location.href = 'http://127.0.0.1:8000/auth/google?mode=login' }}>
          <GoogleIcon />
          Continue with Google
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>or continue with email</span>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
          <input
            className="auth-input"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Password</label>
            <span className="auth-link" onClick={() => navigate('/forgot-password')}>Forgot password?</span>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              className="auth-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <EyeIcon show={showPassword} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            onClick={() => setRememberMe(!rememberMe)}
            style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${rememberMe ? '#0d9488' : '#d1d5db'}`, background: rememberMe ? '#0d9488' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
          >
            {rememberMe && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{ fontSize: 14, color: '#374151', cursor: 'pointer' }} onClick={() => setRememberMe(!rememberMe)}>
            Remember me for 30 days
          </span>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
            {error}
          </div>
        )}

        <button
          className="auth-btn-primary"
          type="submit"
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1, marginTop: 4 }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 24 }}>
        Don't have an account?{' '}
        <span className="auth-link" onClick={() => navigate('/signup')}>Create one</span>
      </p>

    </AuthLayout>
  )
}