import { Vehicle } from '../../types/vehicle'

interface Props {
  vehicles: Vehicle[]
  alertCount: number
}

export default function Sidebar({ vehicles, alertCount }: Props) {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto flex-shrink-0">
      <p className="text-sm text-gray-500 mb-4">
        Active Alerts:{' '}
        <span className={alertCount > 0 ? 'text-red-500 font-semibold' : 'text-gray-400'}>
          {alertCount}
        </span>
      </p>
      <div className="space-y-2">
        {vehicles.map((v: Vehicle) => (
          <div key={v.vehicle_id} className="bg-white border border-gray-200 rounded p-2 text-sm shadow-sm">
            <div className="font-medium text-gray-800">{v.vehicle_id}</div>
            <div className="text-gray-400 text-xs">{v.registration}</div>
            <div className="mt-1">
              <span className={
                v.status === 'moving' ? 'text-green-500 text-xs' :
                v.status === 'idle' ? 'text-orange-400 text-xs' :
                'text-gray-400 text-xs'
              }>
                ● {v.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}