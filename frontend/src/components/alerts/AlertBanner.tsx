import { useState, useEffect } from 'react'
import { useAlerts, useResolveAlert, useResolveAllAlerts } from '../../hooks/useAlerts'

const SEV_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
}

export default function AlertBanner() {
  const { data: alerts } = useAlerts()
  const { mutate: resolve } = useResolveAlert()
  const { mutate: resolveAll, isPending: clearingAll } = useResolveAllAlerts()
  const [expanded, setExpanded] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    setHidden(localStorage.getItem('alertBannerHidden') === 'true')
  }, [])

  const handleHide = () => {
    setHidden(true)
    localStorage.setItem('alertBannerHidden', 'true')
  }

  const handleShow = () => {
    setHidden(false)
    localStorage.setItem('alertBannerHidden', 'false')
  }

  if (!alerts || alerts.length === 0) return null

  if (hidden) {
    return (
      <div className="fixed top-0 right-4 z-[1050] pt-4">
        <button
          onClick={handleShow}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-lg"
        >
          Show Alerts ({alerts.length})
        </button>
      </div>
    )
  }

  return (
    <div className="relative z-[1050] bg-red-50 border-b border-red-200">
      <div
        className="flex items-center justify-between px-6 py-2 cursor-pointer select-none"
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-600 text-sm font-medium">
            {alerts.length} active alert{alerts.length > 1 ? 's' : ''} — resolve after taking action
          </span>
        </div>
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          {alerts.length > 1 && (
            <button
              disabled={clearingAll}
              onClick={() => resolveAll()}
              className="text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
              style={{
                background: clearingAll ? '#e5e7eb' : '#ef4444',
                color: clearingAll ? '#9ca3af' : '#fff',
                cursor: clearingAll ? 'default' : 'pointer',
                border: 'none',
              }}
            >
              {clearingAll ? 'Clearing…' : 'Clear all'}
            </button>
          )}
          <button
            onClick={handleHide}
            className="text-red-400 hover:text-red-600 text-xs font-semibold px-2 py-0.5 rounded transition-colors"
            title="Hide alert banner"
          >
            Hide
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-3 space-y-2 max-h-56 overflow-y-auto">
          {alerts.map((alert: any) => {
            const sev   = (alert.severity || 'medium').toLowerCase()
            const color = SEV_COLOR[sev] || SEV_COLOR.medium
            const isThis = resolvingId === alert.alert_id
            return (
              <div
                key={alert.alert_id}
                className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm flex items-start justify-between gap-4 shadow-sm"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold uppercase" style={{ color }}>{sev}</span>
                    <span className="text-gray-500 text-xs font-medium">{alert.vehicle_id}</span>
                    <span className="text-gray-400 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{alert.alert_type}</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-snug">{alert.message}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
                <button
                  disabled={!!isThis}
                  onClick={e => {
                    e.stopPropagation()
                    setResolvingId(alert.alert_id)
                    resolve({ alertId: alert.alert_id }, { onSettled: () => setResolvingId(null) })
                  }}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    background: isThis ? '#e5e7eb' : '#0d9488',
                    color: isThis ? '#9ca3af' : '#fff',
                    cursor: isThis ? 'default' : 'pointer',
                    border: 'none',
                  }}
                >
                  {isThis ? '…' : '✓ Resolve'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
