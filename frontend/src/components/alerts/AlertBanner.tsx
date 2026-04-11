import { useState } from 'react'
import { useAlerts } from '../../hooks/useAlerts'
import AlertCard from './AlertCard'

export default function AlertBanner() {
  const { data: alerts } = useAlerts()
  const [expanded, setExpanded] = useState(false)

  if (!alerts || alerts.length === 0) return null

  return (
    <div className="bg-red-50 border-b border-red-200">
      <div
        className="flex items-center justify-between px-6 py-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-red-600 text-sm font-medium">
          ⚠ {alerts.length} active alert{alerts.length > 1 ? 's' : ''}
        </span>
        <span className="text-red-400 text-xs">{expanded ? '▲ Hide' : '▼ Show'}</span>
      </div>
      {expanded && (
        <div className="px-6 pb-3 space-y-2 max-h-48 overflow-y-auto">
          {alerts.map((alert: any) => (
            <AlertCard key={alert.alert_id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  )
}