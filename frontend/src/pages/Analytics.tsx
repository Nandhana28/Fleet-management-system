import { useFuelAnalytics, useTripAnalytics, useDriverAnalytics, useAlertBreakdown, useFleetSummary } from '../hooks/useAnalytics'
import Plot from 'react-plotly.js'

const TEAL   = '#0d9488'
const INDIGO = '#6366f1'
const ORANGE = '#f97316'
const RED    = '#ef4444'
const GREEN  = '#22c55e'
const YELLOW = '#eab308'
const COLORS = [TEAL, INDIGO, ORANGE, GREEN, RED, YELLOW, '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b']

const plotLayout = (title: string, extra: Record<string, unknown> = {}) => ({
  title: { text: title, font: { size: 13, color: '#374151', family: 'Inter, sans-serif' }, x: 0.02 },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  margin: { t: 44, r: 16, b: 52, l: 52 },
  font: { family: 'Inter, sans-serif', size: 11, color: '#64748b' },
  ...extra,
})

const cfg = { displayModeBar: false, responsive: true }

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm ${className}`}>{children}</div>
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-gray-700 mb-4">{children}</p>
}

export default function Analytics() {
  const { data: fuelData,   isLoading: fuelLoading   } = useFuelAnalytics()
  const { data: tripData,   isLoading: tripLoading   } = useTripAnalytics()
  const { data: driverData, isLoading: driverLoading } = useDriverAnalytics()
  const { data: alertData,  isLoading: alertLoading  } = useAlertBreakdown()
  const { data: summary,    isLoading: sumLoading    } = useFleetSummary()

  const loading = fuelLoading || tripLoading || driverLoading || alertLoading || sumLoading

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalTrips    = tripData?.reduce((s: number, v: any) => s + (v.trip_count || 0), 0) ?? 0
  const totalDistance = tripData?.reduce((s: number, v: any) => s + (v.total_distance_km || 0), 0) ?? 0

  // Live fuel bars — prefer current_fuel from Redis, fall back to last trip reading
  const fuelLabels = fuelData?.map((v: any) => v.registration || v.vehicle_id) ?? []
  const fuelValues = fuelData?.map((v: any) => {
    if (v.current_fuel !== null && v.current_fuel !== undefined) return Math.round(v.current_fuel)
    const r = v.fuel_readings
    return r?.length ? Math.round(parseFloat(r[r.length - 1].fuel_level || 0)) : 0
  }) ?? []
  const fuelColors = fuelValues.map((v: number) => v < 20 ? RED : v < 40 ? ORANGE : TEAL)

  // Trip counts
  const tripLabels = tripData?.map((v: any) => v.registration || v.vehicle_id) ?? []
  const tripValues = tripData?.map((v: any) => v.trip_count || 0) ?? []
  const distValues = tripData?.map((v: any) => v.total_distance_km || 0) ?? []

  // Driver charts
  const driverNames   = driverData?.map((d: any) => d.name || d.driver_id) ?? []
  const driverScores  = driverData?.map((d: any) => d.score || 0) ?? []
  const alertCounts   = driverData?.map((d: any) => d.alerts_fired || 0) ?? []

  // Alert breakdown
  const alertTypes  = Object.keys(alertData?.by_type    || {})
  const alertTVals  = Object.values(alertData?.by_type  || {}) as number[]
  const alertSevs   = Object.keys(alertData?.by_severity    || {})
  const alertSVals  = Object.values(alertData?.by_severity  || {}) as number[]

  if (loading) return (
    <div className="h-full bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-gray-400 text-sm">Loading analytics…</p>
      </div>
    </div>
  )

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Fleet Analytics</h2>
            <p className="text-xs text-gray-400 mt-0.5">Live data · refreshes automatically</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Live
          </div>
        </div>

        {/* Summary stat cards — 5 across */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Vehicles Moving"   value={summary?.moving ?? '—'}      sub={`of ${summary?.total_vehicles ?? 10} total`}        color={TEAL} />
          <StatCard label="Avg Fuel Level"    value={`${summary?.avg_fuel ?? '—'}%`} sub={`min: ${summary?.min_fuel ?? '—'}%`}               color={summary?.min_fuel < 20 ? RED : ORANGE} />
          <StatCard label="Active Alerts"     value={summary?.active_alerts ?? '—'} sub="unresolved"                                         color={summary?.active_alerts > 0 ? RED : GREEN} />
          <StatCard label="Total Trips"       value={totalTrips}                   sub={`${Math.round(totalDistance)} km total`}             color={INDIGO} />
          <StatCard label="Avg Driver Score"  value={`${summary?.avg_driver_score ?? '—'}`} sub="out of 100"                                 color={GREEN} />
        </div>

        {/* Row 1: Live Fuel Gauge + Trip Count */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            {fuelLabels.length === 0
              ? <p className="text-xs text-gray-400 text-center py-12">No fuel data</p>
              : <Plot
                  data={[{
                    type: 'bar', x: fuelLabels, y: fuelValues,
                    marker: { color: fuelColors, line: { color: 'white', width: 1 } },
                    text: fuelValues.map((v: number) => `${v}%`),
                    textposition: 'outside',
                    hovertemplate: '<b>%{x}</b><br>Fuel: %{y}%<extra></extra>',
                  }]}
                  layout={plotLayout('⛽ Live Fuel Level by Vehicle', {
                    yaxis: { range: [0, 118], ticksuffix: '%', gridcolor: '#f1f5f9', zeroline: false },
                    xaxis: { tickangle: -30 },
                    showlegend: false,
                    shapes: [
                      { type: 'line', x0: -0.5, x1: fuelLabels.length - 0.5, y0: 20, y1: 20, line: { color: RED, width: 1.5, dash: 'dot' } },
                      { type: 'line', x0: -0.5, x1: fuelLabels.length - 0.5, y0: 40, y1: 40, line: { color: ORANGE, width: 1, dash: 'dot' } },
                    ],
                    annotations: [
                      { x: fuelLabels[0], y: 22, text: 'Critical ↑', showarrow: false, font: { color: RED, size: 9 } },
                      { x: fuelLabels[0], y: 42, text: 'Low ↑', showarrow: false, font: { color: ORANGE, size: 9 } },
                    ],
                  })}
                  config={cfg}
                  style={{ width: '100%', height: '290px' }}
                />
            }
          </Card>

          <Card>
            {tripLabels.length === 0
              ? <p className="text-xs text-gray-400 text-center py-12">No trip data</p>
              : <Plot
                  data={[{
                    type: 'bar', orientation: 'h', y: tripLabels, x: tripValues,
                    name: 'Trips',
                    marker: { color: INDIGO, opacity: 0.85 },
                    text: tripValues.map((v: number) => `${v}`),
                    textposition: 'outside',
                    hovertemplate: '<b>%{y}</b><br>Trips: %{x}<extra></extra>',
                  }]}
                  layout={plotLayout('🗺️ Trip Count by Vehicle', {
                    xaxis: { gridcolor: '#f1f5f9', zeroline: false },
                    yaxis: { autorange: 'reversed' },
                    showlegend: false,
                  })}
                  config={cfg}
                  style={{ width: '100%', height: '290px' }}
                />
            }
          </Card>
        </div>

        {/* Row 2: Distance + Alert breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            {distValues.every(v => v === 0)
              ? <p className="text-xs text-gray-400 text-center py-12">No distance data in trips yet</p>
              : <Plot
                  data={[{
                    type: 'bar', x: tripLabels, y: distValues,
                    marker: {
                      color: distValues,
                      colorscale: [[0, '#e0f2fe'], [1, TEAL]],
                      showscale: false,
                    },
                    text: distValues.map((v: number) => v > 0 ? `${v.toFixed(0)} km` : ''),
                    textposition: 'outside',
                    hovertemplate: '<b>%{x}</b><br>Distance: %{y} km<extra></extra>',
                  }]}
                  layout={plotLayout('🛣️ Total Distance Driven (km)', {
                    yaxis: { gridcolor: '#f1f5f9', zeroline: false, ticksuffix: ' km' },
                    xaxis: { tickangle: -30 },
                    showlegend: false,
                  })}
                  config={cfg}
                  style={{ width: '100%', height: '290px' }}
                />
            }
          </Card>

          <Card>
            {alertTypes.length === 0
              ? <p className="text-xs text-gray-400 text-center py-12">No alerts recorded yet</p>
              : <Plot
                  data={[{
                    type: 'pie',
                    labels: alertTypes,
                    values: alertTVals,
                    hole: 0.45,
                    marker: { colors: COLORS, line: { color: 'white', width: 2 } },
                    textinfo: 'label+percent',
                    hovertemplate: '<b>%{label}</b><br>Count: %{value}<br>%{percent}<extra></extra>',
                    pull: alertTVals.map((_: unknown, i: number) => i === 0 ? 0.06 : 0),
                  }]}
                  layout={plotLayout('🚨 Alert Distribution by Type', {
                    showlegend: true,
                    legend: { x: 1, y: 0.5, font: { size: 10 } },
                    annotations: [{ text: `${alertData?.total ?? 0}<br>total`, x: 0.5, y: 0.5, font: { size: 13, color: '#374151' }, showarrow: false }],
                  })}
                  config={cfg}
                  style={{ width: '100%', height: '290px' }}
                />
            }
          </Card>
        </div>

        {/* Row 3: Driver score bar + Alerts by severity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            {driverNames.length === 0
              ? <p className="text-xs text-gray-400 text-center py-12">No driver data</p>
              : <Plot
                  data={[{
                    type: 'bar', x: driverNames, y: driverScores,
                    marker: {
                      color: driverScores,
                      colorscale: [[0, RED], [0.5, ORANGE], [0.75, YELLOW], [1, GREEN]],
                      showscale: false,
                      line: { color: 'white', width: 1 },
                    },
                    text: driverScores.map((v: number) => `${Math.round(v)}`),
                    textposition: 'outside',
                    hovertemplate: '<b>%{x}</b><br>Score: %{y}/100<extra></extra>',
                  }]}
                  layout={plotLayout('🏆 Driver Safety Leaderboard', {
                    yaxis: { range: [0, 118], gridcolor: '#f1f5f9', zeroline: false },
                    xaxis: { tickangle: -30 },
                    showlegend: false,
                    shapes: [{ type: 'line', x0: -0.5, x1: (driverNames.length ?? 0) - 0.5, y0: 80, y1: 80, line: { color: GREEN, width: 1.5, dash: 'dash' } }],
                    annotations: [{ x: 0, y: 84, text: '80 — Good', showarrow: false, font: { color: GREEN, size: 9 } }],
                  })}
                  config={cfg}
                  style={{ width: '100%', height: '290px' }}
                />
            }
          </Card>

          <Card>
            {alertSevs.length === 0
              ? <p className="text-xs text-gray-400 text-center py-12">No severity data</p>
              : <Plot
                  data={[{
                    type: 'bar',
                    x: alertSevs,
                    y: alertSVals,
                    marker: {
                      color: alertSevs.map((s: string) =>
                        s === 'critical' ? RED : s === 'high' ? ORANGE : s === 'medium' ? YELLOW : GREEN
                      ),
                    },
                    text: alertSVals.map((v: number) => `${v}`),
                    textposition: 'outside',
                    hovertemplate: '<b>%{x}</b><br>Count: %{y}<extra></extra>',
                  }]}
                  layout={plotLayout('⚡ Alerts by Severity', {
                    yaxis: { gridcolor: '#f1f5f9', zeroline: false },
                    showlegend: false,
                  })}
                  config={cfg}
                  style={{ width: '100%', height: '290px' }}
                />
            }
          </Card>
        </div>

        {/* Driver Leaderboard Table */}
        <Card>
          <CardTitle>🏅 Driver Leaderboard</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-semibold w-8">#</th>
                  <th className="pb-3 font-semibold">Driver</th>
                  <th className="pb-3 font-semibold">Safety Score</th>
                  <th className="pb-3 font-semibold">Alerts</th>
                  <th className="pb-3 font-semibold">Alert Types</th>
                  <th className="pb-3 font-semibold">Rating</th>
                </tr>
              </thead>
              <tbody>
                {driverData?.map((d: any, i: number) => (
                  <tr key={d.driver_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-xs font-bold">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-300">{i + 1}</span>}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold border border-teal-100">
                          {(d.driver_id ?? '?').replace('driver-', 'D')}
                        </div>
                        <span className="font-medium text-gray-700">{d.name || d.driver_id}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${d.score || 0}%`,
                              background: (d.score || 0) >= 80 ? GREEN : (d.score || 0) >= 60 ? ORANGE : RED,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold" style={{ color: (d.score || 0) >= 80 ? GREEN : (d.score || 0) >= 60 ? ORANGE : RED }}>
                          {Math.round(d.score || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        d.alerts_fired === 0 ? 'bg-green-50 text-green-600' :
                        d.alerts_fired < 3  ? 'bg-orange-50 text-orange-600' :
                                              'bg-red-50 text-red-600'
                      }`}>
                        {d.alerts_fired} {d.alerts_fired === 1 ? 'alert' : 'alerts'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(d.alert_types || {}).map(([type, cnt]: [string, any]) => (
                          <span key={type} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {type} ×{cnt}
                          </span>
                        ))}
                        {Object.keys(d.alert_types || {}).length === 0 && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        (d.score || 0) >= 80 ? 'bg-green-100 text-green-700' :
                        (d.score || 0) >= 60 ? 'bg-orange-100 text-orange-600' :
                                               'bg-red-100 text-red-600'
                      }`}>
                        {(d.score || 0) >= 80 ? '⭐ Excellent' :
                         (d.score || 0) >= 60 ? '👍 Average' : '⚠️ Poor'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  )
}
