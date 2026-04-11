import { useVehicles } from '../hooks/useVehicles'
import { useAlerts } from '../hooks/useAlerts'
import FleetMap from '../components/map/FleetMap'
import Sidebar from '../components/layout/Sidebar'

export default function Dashboard() {
  const { data: vehicles, isLoading, isError } = useVehicles()
  const { data: alerts } = useAlerts()

  if (isLoading) return <div className="p-4 text-gray-500">Loading vehicles...</div>
  if (isError) return <div className="p-4 text-red-500">Error loading data</div>

  return (
    <div className="flex h-full">
      <Sidebar vehicles={vehicles ?? []} alertCount={alerts?.length ?? 0} />
      <div className="flex-1">
        <FleetMap vehicles={vehicles ?? []} />
      </div>
    </div>
  )
}