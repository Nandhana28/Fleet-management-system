import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { verifyEmailOtp, sendEmailOtp, sendPhoneOtp, verifyPhoneOtp, forgotPassword as forgotPasswordApi, resetPassword as resetPasswordApi } from '../../services/authApi'

// ─── VERIFY EMAIL ──────────────────────────────────────────────────────────────
export function VerifyEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as any)?.email || 'your email'
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const handleVerify = async () => {
    if (otp.some(d => !d)) { setError('Please enter the complete 6-digit code.'); return }
    setLoading(true)
    try {
      await verifyEmailOtp(email, otp.join(''))
      const phone = localStorage.getItem('signup_phone') || ''
      const user_id = localStorage.getItem('signup_user_id') || ''
      await sendPhoneOtp(phone, user_id)
      navigate('/verify-phone', { state: { email } })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResent(true)
    await sendEmailOtp(email)
    setTimeout(() => setResent(false), 30000)
  }

  return (
    <AuthLayout title="Verify your email" subtitle={`We sent a 6-digit code to ${email}`}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #f0fdf9, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
        {otp.map((d, i) => (
          <input
            key={i}
            ref={el => { inputs.current[i] = el }}
            className="otp-input"
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            style={{ borderColor: d ? '#0d9488' : '#e5e7eb', background: d ? '#f0fdf9' : '#fff' }}
          />
        ))}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</div>
      )}

      <button className="auth-btn-primary" onClick={handleVerify} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Verifying...' : 'Verify email'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 20 }}>
        Didn't receive it?{' '}
        {resent
          ? <span style={{ color: '#10b981', fontWeight: 500 }}>Code sent! Check your inbox.</span>
          : <span className="auth-link" onClick={handleResend}>Resend code</span>
        }
      </p>
    </AuthLayout>
  )
}

// ─── VERIFY PHONE ──────────────────────────────────────────────────────────────
export function VerifyPhone() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const handleVerify = async () => {
    if (otp.some(d => !d)) { setError('Please enter the complete 6-digit code.'); return }
    setLoading(true)
    try {
      const user_id = localStorage.getItem('signup_user_id') || ''
      const phone = localStorage.getItem('signup_phone') || ''
      await verifyPhoneOtp(phone, otp.join(''), user_id)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Verify your phone" subtitle="We sent a 6-digit SMS to your registered number">
      <div style={{ marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #f0fdf9, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
        {otp.map((d, i) => (
          <input
            key={i}
            ref={el => { inputs.current[i] = el }}
            className="otp-input"
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            style={{ borderColor: d ? '#0d9488' : '#e5e7eb', background: d ? '#f0fdf9' : '#fff' }}
          />
        ))}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</div>
      )}

      <button className="auth-btn-primary" onClick={handleVerify} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Verifying...' : 'Verify phone & continue'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 20 }}>
        Wrong number?{' '}
        <span className="auth-link" onClick={() => navigate('/signup')}>Go back</span>
      </p>
    </AuthLayout>
  )
}

// ─── FORGOT PASSWORD ───────────────────────────────────────────────────────────
export function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await forgotPasswordApi(email)
      setSent(true)
    } catch {
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send a reset link">
      {sent ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #f0fdf9, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>Check your inbox</h3>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, marginBottom: 28 }}>
            We've sent a password reset link to <strong>{email}</strong>. It expires in 15 minutes.
          </p>
          <button className="auth-btn-primary" onClick={() => navigate('/login')}>Back to sign in</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #fafaf9, #f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
            <input className="auth-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <button className="auth-btn-primary" type="submit" disabled={loading || !email} style={{ opacity: loading || !email ? 0.6 : 1 }}>
            {loading ? 'Sending link...' : 'Send reset link'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b' }}>
            Remembered it?{' '}
            <span className="auth-link" onClick={() => navigate('/login')}>Sign in</span>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}

// ─── RESET PASSWORD ────────────────────────────────────────────────────────────
export function ResetPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      const token = new URLSearchParams(window.location.search).get('token') || ''
      await resetPasswordApi(token, form.password)
      setDone(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Reset failed. Link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your account">
      {done ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #f0fdf9, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>Password updated</h3>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>Your password has been reset successfully.</p>
          <button className="auth-btn-primary" onClick={() => navigate('/login')}>Sign in with new password</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>New password</label>
            <input className="auth-input" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            {form.password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= Math.min(Math.floor(form.password.length / 2), 4) ? (form.password.length < 6 ? '#ef4444' : form.password.length < 10 ? '#f59e0b' : '#10b981') : '#e5e7eb', transition: 'all 0.3s' }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: form.password.length < 6 ? '#ef4444' : form.password.length < 10 ? '#f59e0b' : '#10b981' }}>
                  {form.password.length < 6 ? 'Weak' : form.password.length < 10 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Confirm password</label>
            <input className="auth-input" type="password" placeholder="Repeat your password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
          </div>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>{error}</div>
          )}
          <button className="auth-btn-primary" type="submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}