import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToastStore } from '../../store/toast'

export default function AuthSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast, clearLogs } = useToastStore()

  useEffect(() => {
    const token = searchParams.get('token')
    const mode  = searchParams.get('mode') ?? 'login'
    if (token) {
      localStorage.setItem('token', token)
      clearLogs()
      showToast('Signed in successfully!')
      navigate('/welcome', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#64748b' }}>
      Signing you in...
    </div>
  )
}