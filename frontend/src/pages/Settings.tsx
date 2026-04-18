import { useState, useEffect } from 'react'
import api from '../services/api'
import { useToastStore } from '../store/toast'

const ALERT_TYPES = [
  {
    key: 'fuel_theft',
    label: 'Fuel Theft',
    desc: 'Sudden unexplained fuel drop',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 7h13L17 13M9 21h.01M15 21h.01" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    iconBg: 'bg-red-50 text-red-500',
  },
  {
    key: 'overspeeding',
    label: 'Overspeeding',
    desc: 'Exceeds speed threshold',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2" strokeLinecap="round"/>
      </svg>
    ),
    iconBg: 'bg-orange-50 text-orange-500',
  },
  {
    key: 'route_deviation',
    label: 'Route Deviation',
    desc: 'Leaves assigned route',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    iconBg: 'bg-blue-50 text-blue-500',
  },
  {
    key: 'offline',
    label: 'Vehicle Offline',
    desc: 'No GPS signal for 5+ min',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 11a1 1 0 110 2 1 1 0 010-2zM3 3l18 18" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    iconBg: 'bg-gray-100 text-gray-500',
  },
  {
    key: 'night_alerts',
    label: 'Night Movement Alerts',
    desc: 'WhatsApp if vehicles move between 10 PM – 5 AM',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    iconBg: 'bg-indigo-50 text-indigo-500',
  },
]

const THRESHOLDS = [
  {
    key: 'fuel_low',
    label: 'Fuel Low',
    hint: 'Alert when tank drops below this',
    unit: '%',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M3 22V8a2 2 0 012-2h6a2 2 0 012 2v14M3 22h10M3 12h10M13 8l4 4m0 0v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3h4m-4 0h4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    iconBg: 'bg-yellow-50 text-yellow-500',
  },
  {
    key: 'speed_limit',
    label: 'Speed Limit',
    hint: 'Alert on sustained overspeeding',
    unit: 'km/h',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2" strokeLinecap="round"/>
      </svg>
    ),
    iconBg: 'bg-orange-50 text-orange-500',
  },
  {
    key: 'idle_timeout',
    label: 'Idle Timeout',
    hint: 'Alert when engine idles too long',
    unit: 'min',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><path d="M10 15V9m4 6V9" strokeLinecap="round"/>
      </svg>
    ),
    iconBg: 'bg-purple-50 text-purple-500',
  },
]

export default function Settings() {
  const { showToast } = useToastStore()
  const [loading, setLoading] = useState(false)
  const [fetchingSettings, setFetchingSettings] = useState(true)
  const [testingAlert, setTestingAlert] = useState(false)
  const [saved, setSaved] = useState(false)

  const [thresholds, setThresholds] = useState({
    fuel_low: '20',
    speed_limit: '80',
    idle_timeout: '15',
  })

  const [notifications, setNotifications] = useState({
    whatsapp: '',
    email: '',
  })

  const [alerts, setAlerts] = useState({
    fuel_theft: true,
    overspeeding: true,
    route_deviation: true,
    offline: true,
    night_alerts: true,
  })

  // ─── Load saved settings on mount ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/settings')
        const data = res.data
        if (data.thresholds) setThresholds(data.thresholds)
        if (data.notifications) setNotifications(data.notifications)
        if (data.alerts) setAlerts(data.alerts)
      } catch {
        // Use defaults if settings not saved yet
      } finally {
        setFetchingSettings(false)
      }
    }
    load()
  }, [])

  // ─── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    try {
      await api.post('/settings', { thresholds, notifications, alerts })
      setSaved(true)
      showToast('Settings saved successfully!', 'success')
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ─── Test Alert ────────────────────────────────────────────────────────────
  const handleTestAlert = async () => {
    if (!notifications.whatsapp && !notifications.email) {
      showToast('Add a WhatsApp number or email first', 'error')
      return
    }
    setTestingAlert(true)
    try {
      // Save settings first, then send test
      await api.post('/settings', { thresholds, notifications, alerts })
      await api.post('/settings/test-alert')
      showToast('Test alert sent! Check your WhatsApp/email.', 'success')
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to send test alert', 'error')
    } finally {
      setTestingAlert(false)
    }
  }

  if (fetchingSettings) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: '#0f1a2e' }}>
        <div className="text-teal-400 text-sm animate-pulse">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto relative">

      {/* SVG background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{ background: '#0f1a2e' }}>
          <ellipse cx="200" cy="150" rx="320" ry="260" fill="#0d9488" opacity="0.18"/>
          <ellipse cx="1000" cy="600" rx="380" ry="300" fill="#0d9488" opacity="0.15"/>
          <ellipse cx="1100" cy="100" rx="250" ry="200" fill="#6366f1" opacity="0.12"/>
          <ellipse cx="150" cy="700" rx="280" ry="220" fill="#6366f1" opacity="0.10"/>
          <ellipse cx="600" cy="400" rx="300" ry="240" fill="#0d9488" opacity="0.08"/>
          {Array.from({ length: 20 }).map((_, row) =>
            Array.from({ length: 30 }).map((_, col) => (
              <circle key={`${row}-${col}`} cx={col * 42 + 10} cy={row * 42 + 10} r="1.2" fill="#7dd3c8" opacity="0.18"/>
            ))
          )}
          <line x1="0" y1="200" x2="400" y2="200" stroke="#2dd4bf" strokeWidth="0.5" opacity="0.2"/>
          <line x1="400" y1="200" x2="400" y2="500" stroke="#2dd4bf" strokeWidth="0.5" opacity="0.2"/>
          <line x1="400" y1="500" x2="900" y2="500" stroke="#2dd4bf" strokeWidth="0.5" opacity="0.2"/>
          <line x1="900" y1="500" x2="900" y2="100" stroke="#2dd4bf" strokeWidth="0.5" opacity="0.2"/>
          <circle cx="400" cy="200" r="5" fill="#2dd4bf" opacity="0.5"/>
          <circle cx="400" cy="500" r="5" fill="#2dd4bf" opacity="0.5"/>
          <circle cx="900" cy="500" r="5" fill="#2dd4bf" opacity="0.5"/>
        </svg>
      </div>

      <div className="relative flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-lg">

          <h2 className="text-2xl font-semibold text-white mb-6 text-center tracking-wide">
            Settings
          </h2>

          <div className="space-y-4">

            {/* Notifications */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/60 rounded-xl p-5 shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">WhatsApp Number</label>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-teal-500">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={notifications.whatsapp}
                      onChange={e => setNotifications({ ...notifications, whatsapp: e.target.value })}
                      className="flex-1 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email Address</label>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-teal-500">
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input
                      type="email"
                      placeholder="fleet@example.com"
                      value={notifications.email}
                      onChange={e => setNotifications({ ...notifications, email: e.target.value })}
                      className="flex-1 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Test Alert button */}
                <button
                  onClick={handleTestAlert}
                  disabled={testingAlert}
                  className="w-full mt-1 border border-teal-500 text-teal-600 text-sm py-2 rounded-lg hover:bg-teal-50 disabled:opacity-50 transition-colors font-medium"
                >
                  {testingAlert ? 'Sending...' : '🔔 Send Test Alert'}
                </button>
              </div>
            </div>

            {/* Alert Thresholds */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/60 rounded-xl p-5 shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Alert Thresholds</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {THRESHOLDS.map(({ key, label, hint, unit, icon, iconBg }) => (
                  <div key={key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
                      <div>
                        <p className="text-sm text-gray-700">{label}</p>
                        <p className="text-xs text-gray-400">{hint}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={thresholds[key as keyof typeof thresholds]}
                        onChange={e => setThresholds({ ...thresholds, [key]: e.target.value })}
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <span className="text-xs text-gray-400 w-8">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert Types */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/60 rounded-xl p-5 shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Alert Types</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {ALERT_TYPES.map(({ key, label, desc, icon, iconBg }) => (
                  <div key={key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
                      <div>
                        <p className="text-sm text-gray-700">{label}</p>
                        <p className="text-xs text-gray-400">{desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAlerts({ ...alerts, [key]: !alerts[key as keyof typeof alerts] })}
                      className={`w-10 h-5 rounded-full transition-colors shrink-0 ${alerts[key as keyof typeof alerts] ? 'bg-teal-500' : 'bg-gray-300'}`}
                    >
                      <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${alerts[key as keyof typeof alerts] ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end gap-3 pb-10">
              <button
                onClick={async () => {
                  try {
                    await api.post('/settings/generate-report')
                    showToast('Report generation started! Check your email.', 'success')
                  } catch {
                    showToast('Failed to generate report', 'error')
                  }
                }}
                className="px-6 py-2.5 rounded-lg text-sm font-medium border border-teal-500 text-teal-600 hover:bg-teal-50 transition-colors"
              >
                📊 Generate Report
              </button>
              <button
                onClick={async () => {
                try {
                  const token = localStorage.getItem('token')
                  const res = await fetch('http://127.0.0.1:8000/settings/download-report', {
                    headers: { Authorization: `Bearer ${token}` }
                  })
                  if (!res.ok) {
                    showToast('Generate a report first', 'error')
                    return
                  }
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `fleet-report-${new Date().toISOString().slice(0,10)}.pdf`
                  a.click()
                  URL.revokeObjectURL(url)
                } catch {
                  showToast('Failed to download report', 'error')
                }
              }}
                className="px-6 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ⬇️ Download Report
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className={`px-8 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${saved
                    ? 'bg-green-500 text-white'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
                  } disabled:opacity-50`}
              >
                {loading ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}