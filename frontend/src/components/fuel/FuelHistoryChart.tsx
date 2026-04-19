import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

interface FuelEvent {
  timestamp: string
  fuel_level: number
  vehicle_id: string
}

export function FuelHistoryChart({ vehicleId }: { vehicleId: string }) {
  const { data: fuelData, isLoading } = useQuery({
    queryKey: ['fuelHistory', vehicleId],
    queryFn: () =>
      api.get(`/fuel/vehicles/${vehicleId}/history`).then((res) => res.data),
  })

  const { data: refillData } = useQuery({
    queryKey: ['refills', vehicleId],
    queryFn: () =>
      api.get(`/fuel/vehicles/${vehicleId}/refills`).then((res) => res.data),
  })

  const { data: consumptionStats } = useQuery({
    queryKey: ['consumption', vehicleId],
    queryFn: () =>
      api.get(`/fuel/vehicles/${vehicleId}/consumption`).then((res) => res.data),
  })

  if (isLoading) return <Card className="p-6">Loading fuel data...</Card>

  const events = fuelData?.fuel_events || []
  const refills = refillData?.refills || []

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold dark:text-white mb-4">Fuel Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Level</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {consumptionStats?.current_fuel_level || 0}%
              </div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Consumption</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {consumptionStats?.avg_consumption_per_trip || 0}%
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Refills</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {consumptionStats?.total_refills || 0}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold dark:text-white mb-3">Recent Refill Events</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {refills.length > 0 ? (
              refills.map((refill: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div>
                    <div className="font-medium dark:text-white">Refueled</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(refill.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="success">Refill</Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No refill events yet</div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold dark:text-white mb-3">Fuel Consumption Timeline</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {events.length > 0 ? (
              events.slice(0, 10).map((event: FuelEvent, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 w-32">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-yellow-500 h-full rounded-full"
                      style={{ width: `${event.fuel_level}%` }}
                    />
                  </div>
                  <div className="text-xs font-medium dark:text-white w-8 text-right">{event.fuel_level}%</div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No consumption data</div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
