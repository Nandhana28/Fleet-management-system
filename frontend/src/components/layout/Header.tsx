import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAlerts } from '../../hooks/useAlerts'
import { useToastStore } from '../../store/toast'
import { useUserStore } from '../../store/user'
import { useProfile } from '../../hooks/useProfile'
import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../services/api'
import { getAlerts } from '../../services/alertApi'

export default function Header() {
  const { data: alerts } = useAlerts()
  const { profile } = useProfile()
  const { user } = useUserStore()
  const location  = useLocation()
  const navigate  = useNavigate()
  const { showToast, addLog, exportLogs, logs, clearLogs } = useToastStore()
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showAlertsPanel, setShowAlertsPanel] = useState(false)
  const [allAlerts, setAllAlerts] = useState<any[]>([])
  const [prevNotifIds, setPrevNotifIds] = useState<Set<string>>(new Set())
  const prevRef = useRef<Set<string>>(new Set())

  const navItems = [
    { path: '/welcome',     label: 'Home' },
    { path: '/dashboard',   label: 'Dashboard' },
    { path: '/tasks',       label: 'Trips' },
    { path: '/analytics',   label: 'Analytics' },
    { path: '/agent',       label: 'AI Agent' },
    { path: '/maintenance', label: 'Maintenance' },
    { path: '/profile',     label: 'Profile' },
  ]

  // Poll notifications — only SOS triggers toast, everything else goes to log
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications')
        const notifs = res.data as any[]
        const newOnes = notifs.filter(n => !prevRef.current.has(n.id))

        newOnes.forEach(n => {
          addLog({
            message:    n.message,
            type:       n.type,
            vehicle_id: n.vehicle_id,
          })
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
        {/* Alerts badge — click to view all alerts including resolved */}
        <div className="relative">
          {alerts && alerts.length > 0 && (
            <button
              onClick={async () => {
                setShowAlertsPanel(v => !v)
                setShowProfileMenu(false)
                if (!showAlertsPanel) {
                  const all = await getAlerts(false).catch(() => [])
                  setAllAlerts(Array.isArray(all) ? all : [])
                }
              }}
              className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium hover:bg-red-200 transition-colors"
            >
              {alerts.length} Alerts
            </button>
          )}

          {showAlertsPanel && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-[9999] flex flex-col max-h-[480px]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">All Alerts ({allAlerts.length})</h3>
                <button onClick={() => setShowAlertsPanel(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
                {allAlerts.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No alerts found</p>
                ) : allAlerts.map((a: any) => (
                  <div key={a.alert_id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                        a.severity === 'high' ? 'bg-red-500' :
                        a.severity === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{a.alert_type}</p>
                        <p className="text-xs text-gray-500 truncate">{a.vehicle_id} · {a.driver_id}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                        a.status === 'resolved' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-600'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-2 py-1 rounded transition-colors"
          >
            <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email || ''}</p>
              </div>
              <button
                onClick={() => { navigate('/profile?tab=profile'); setShowProfileMenu(false) }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </button>
              <button
                onClick={() => { navigate('/profile?tab=preferences'); setShowProfileMenu(false) }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                Preferences
              </button>
              <div className="border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  )
}