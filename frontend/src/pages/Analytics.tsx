import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { useFuelAnalytics, useTripAnalytics, useDriverAnalytics } from '../hooks/useAnalytics'

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend
)

const chartOptions = (title: string) => ({
  responsive: true,
  plugins: { legend: { position: 'top' as const }, title: { display: false } },
  scales: { y: { beginAtZero: true } },
})

export default function Analytics() {
  const { data: fuelData, isLoading: fuelLoading } = useFuelAnalytics()
  const { data: tripData, isLoading: tripLoading } = useTripAnalytics()
  const { data: driverData, isLoading: driverLoading } = useDriverAnalytics()

  if (fuelLoading || tripLoading || driverLoading)
    return <div className="p-6 text-gray-500">Loading analytics...</div>

  // Fuel line chart — last reading per vehicle
  const fuelChartData = {
    labels: fuelData?.map((v: any) => v.registration ?? v.vehicle_id) ?? [],
    datasets: [{
      label: 'Fuel Level (%)',
      data: fuelData?.map((v: any) => {
        const readings = v.fuel_readings
        return readings?.length > 0 ? readings[readings.length - 1].fuel_level : 0
      }) ?? [],
      borderColor: '#0d9488',
      backgroundColor: 'rgba(13,148,136,0.1)',
      tension: 0.4,
      fill: true,
    }],
  }

  // Trip count bar chart
  const tripChartData = {
    labels: tripData?.map((v: any) => v.registration ?? v.vehicle_id) ?? [],
    datasets: [{
      label: 'Trip Count',
      data: tripData?.map((v: any) => v.trip_count) ?? [],
      backgroundColor: '#6366f1',
      borderRadius: 4,
    }],
  }

  // Alerts fired per driver bar chart
  const alertChartData = {
    labels: driverData?.map((d: any) => d.name ?? d.driver_id) ?? [],
    datasets: [{
      label: 'Alerts Fired',
      data: driverData?.map((d: any) => d.alerts_fired) ?? [],
      backgroundColor: '#f97316',
      borderRadius: 4,
    }],
  }

  return (
    <div className="p-6 bg-gray-50 h-full overflow-y-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Fuel Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Fuel Level by Vehicle</h3>
          <Line data={fuelChartData} options={chartOptions('Fuel')} />
        </div>

        {/* Trip Count Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Trip Count by Vehicle</h3>
          <Bar data={tripChartData} options={chartOptions('Trips')} />
        </div>

        {/* Alerts Fired Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Alerts Fired by Driver</h3>
          <Bar data={alertChartData} options={chartOptions('Alerts')} />
        </div>

        {/* Driver Leaderboard */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Driver Leaderboard</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-2">#</th>
                <th className="pb-2">Driver</th>
                <th className="pb-2">Score</th>
                <th className="pb-2">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {driverData?.map((d: any, i: number) => (
                <tr key={d.driver_id} className="border-b border-gray-50">
                  <td className="py-2 text-gray-400">{i + 1}</td>
                  <td className="py-2 text-gray-800 font-medium">{d.name ?? d.driver_id}</td>
                  <td className="py-2">
                    <span className={`font-semibold ${
                      d.score >= 80 ? 'text-green-500' :
                      d.score >= 60 ? 'text-orange-400' : 'text-red-500'
                    }`}>
                      {d.score}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">{d.alerts_fired}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}