import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthSuccess() {
  const navigate = useNavigate()
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('token', token)
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }, [])
  return <div style={{ padding: 40, fontFamily: 'DM Sans, sans-serif' }}>Signing you in...</div>
}