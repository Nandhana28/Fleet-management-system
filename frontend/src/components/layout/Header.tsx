import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAlerts } from '../../hooks/useAlerts'
import { useToastStore } from '../../store/toast'
import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../services/api'

export default function Header() {
  const { data: alerts } = useAlerts()
  const location  = useLocation()
  const navigate  = useNavigate()
  const { showToast, addLog, exportLogs, logs, clearLogs } = useToastStore()
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [prevNotifIds, setPrevNotifIds] = useState<Set<string>>(new Set())
  const prevRef = useRef<Set<string>>(new Set())

  const navItems = [
    { path: '/welcome',     label: 'Home' },
    { path: '/dashboard',   label: 'Dashboard' },
    { path: '/tasks',       label: 'Trips' },
    { path: '/analytics',   label: 'Analytics' },
    { path: '/agent',       label: 'AI Agent' },
    { path: '/maintenance', label: 'Maintenance' },
    { path: '/settings',    label: 'Settings' },
  ]

  // Poll notifications — only SOS triggers toast, everything else goes to log
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications')
        const notifs = res.data as any[]
        const newOnes = notifs.filter(n => !prevRef.current.has(n.id))

        newOnes.forEach(n => {
          // Always add to log
          addLog({
            message:    n.message,
            type:       n.type,
            vehicle_id: n.vehicle_id,
          })

          // Only SOS shows as popup toast
          if (n.message.toLowerCase().includes('sos') || n.type === 'sos') {
            showToast(n.message, 'error')
          }
        })

        if (newOnes.length > 0) {
          const newIds = new Set([...prevRef.current, ...notifs.map((n: any) => n.id)])
          prevRef.current = newIds
          setPrevNotifIds(newIds)
          // Mark as read in backend
          if (newOnes.length > 0) {
            api.post('/notifications/read').catch(() => {})
          }
        }
      } catch {}
    }

    fetchNotifs()
    const interval = setInterval(fetchNotifs, 4000)
    return () => clearInterval(interval)
  }, [])

  const doLogout = useCallback(() => {
    clearLogs()
    localStorage.removeItem('token')
    localStorage.removeItem('rememberMe')
    navigate('/login')
  }, [clearLogs, navigate])

  const handleLogout = () => {
    if (logs.length > 0) {
      setShowSavePrompt(true)
    } else {
      doLogout()
    }
  }

  return (
    <>
    {showSavePrompt && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            <h3 className="font-semibold text-gray-800 text-sm">Save activity log?</h3>
          </div>
          <p className="text-xs text-gray-500">You have {logs.length} log {logs.length === 1 ? 'entry' : 'entries'} from this session. Save before signing out?</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={doLogout}
              className="text-xs px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              Discard
            </button>
            <button
              onClick={() => { exportLogs(); doLogout() }}
              className="text-xs px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
            >
              Save & Sign out
            </button>
          </div>
        </div>
      </div>
    )}
    <header className="relative z-[1100] bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <h1
          className="text-xl font-bold text-teal-600 cursor-pointer"
          onClick={() => navigate('/')}
        >
          FleetPulse
        </h1>
        <nav className="flex gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm px-3 py-1 rounded transition-colors ${
                location.pathname === item.path
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {alerts && alerts.length > 0 && (
          <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
            {alerts.length} Alerts
          </span>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1 rounded transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </button>
      </div>
    </header>
    </>
  )
}