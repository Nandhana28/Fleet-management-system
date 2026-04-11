interface Alert {
  alert_id: string
  vehicle_id: string
  alert_type: string
  severity: string
  message: string
  timestamp: string
}

interface Props {
  alert: Alert
}

export default function AlertCard({ alert }: Props) {
  const severityColor =
    alert.severity === 'critical' ? 'text-red-600' :
    alert.severity === 'high' ? 'text-orange-500' :
    'text-yellow-600'

  return (
    <div className="bg-white border border-gray-200 rounded p-3 text-sm flex items-start justify-between gap-4 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-xs uppercase ${severityColor}`}>
            {alert.severity}
          </span>
          <span className="text-gray-400 text-xs">{alert.vehicle_id}</span>
        </div>
        <div className="text-gray-700 mt-1">{alert.message}</div>
        <div className="text-gray-400 text-xs mt-1">
          {new Date(alert.timestamp).toLocaleString()}
        </div>
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">{alert.alert_type}</span>
    </div>
  )
}