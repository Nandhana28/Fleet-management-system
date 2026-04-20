import { useState, useEffect } from 'react'
import api from '../services/api'
import { useToastStore } from '../store/toast'

const PRIORITY_COLORS: Record<string, string> = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-orange-100 text-orange-700',
  low:    'bg-green-100 text-green-700',
}

export default function Tasks() {
  const { showToast } = useToastStore()
  const [tasks, setTasks]         = useState<any[]>([])
  const [vehicles, setVehicles]   = useState<any[]>([])
  const [drivers, setDrivers]     = useState<any[]>([])
  const [landmarks, setLandmarks] = useState<string[]>([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historyVehicle, setHistoryVehicle] = useState<string>('all')
  const [form, setForm] = useState({
    vehicle_id: '', driver_id: '', source: '',
    dest: '', priority: 'medium', notes: '',
  })

  const load = async () => {
    try {
      const [tRes, vRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/vehicles'),
      ])
      setTasks(Array.isArray(tRes.data) ? tRes.data : tRes.data?.tasks || [])
      setVehicles(Array.isArray(vRes.data) ? vRes.data : vRes.data?.vehicles || [])
    } catch {
      showToast('Failed to load trips', 'error')
    } finally {
      setLoading(false)
    }
    // Non-critical: load independently so a failure doesn't block the page
    api.get('/analytics/drivers').then(r => {
      setDrivers(Array.isArray(r.data) ? r.data : r.data?.drivers || [])
    }).catch(() => {})
    api.get('/tasks/landmarks').then(r => {
      setLandmarks(r.data?.landmarks || [])
    }).catch(() => {})
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleVehicleChange = (vid: string) => {
    const v = vehicles.find((v: any) => v.vehicle_id === vid)
    setForm(f => ({ ...f, vehicle_id: vid, driver_id: v?.driver_id || '' }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vehicle_id || !form.source || !form.dest) {
      showToast('Fill in all required fields', 'error'); return
    }
    if (form.source === form.dest) {
      showToast('Source and destination cannot be the same', 'error'); return
    }
    setCreating(true)
    try {
      await api.post('/tasks', form)
      showToast('Trip assigned! Vehicle will start moving shortly.', 'success')
      setShowForm(false)
      setForm({ vehicle_id: '', driver_id: '', source: '', dest: '', priority: 'medium', notes: '' })
      load()
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to assign trip', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (task_id: string) => {
    try {
      await api.delete(`/tasks/${task_id}`)
      showToast('Trip removed', 'success')
      load()
    } catch {
      showToast('Failed to remove trip', 'error')
    }
  }

  const activeTasks    = tasks.filter(t => t.status === 'active')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const busyVehicleIds = new Set(activeTasks.map((t: any) => t.vehicle_id))
  const availableVehicles = vehicles.filter((v: any) =>
    !busyVehicleIds.has(v.vehicle_id) && v.status !== 'sos' && v.status !== 'moving'
  )

  // All trips (active + completed) for history view — sorted newest first
  const allTrips = [...tasks].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  const vehiclesWithHistory = Array.from(new Set(allTrips.map((t: any) => t.vehicle_id).filter(Boolean))).sort()

  const filteredHistory = historyVehicle === 'all'
    ? allTrips
    : allTrips.filter(t => t.vehicle_id === historyVehicle)

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="p-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Trip Assignment</h2>
            <p className="text-sm text-gray-400 mt-0.5">Assign routes to drivers — vehicles start moving immediately</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Trip History
              {allTrips.length > 0 && (
                <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                  {allTrips.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              + Assign Trip
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Active Trips',       value: activeTasks.length,       color: 'text-teal-600' },
            { label: 'Available Vehicles', value: availableVehicles.length, color: 'text-green-600' },
            { label: 'Total Vehicles',     value: vehicles.length,           color: 'text-gray-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Active Trips */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Active Trips
              <span className="ml-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                {activeTasks.length}
              </span>
            </h3>
            <span className="text-xs text-gray-400">Updates every 5s</span>
          </div>

          {activeTasks.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">🚛</p>
              <p className="text-sm text-gray-500 font-medium">No active trips</p>
              <p className="text-xs text-gray-400 mt-1">Assign a trip to get vehicles moving on the map</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700"
              >
                + Assign First Trip
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeTasks.map(task => {
                const driver   = drivers.find((d: any) => d.driver_id === task.driver_id)
                const vehicle  = vehicles.find((v: any) => v.vehicle_id === task.vehicle_id)
                const loc      = vehicle?.current_location
                const isMoving = loc && loc.speed > 5
                const isSOS    = vehicle?.status === 'sos'

                return (
                  <div key={task.task_id} className={`p-4 ${isSOS ? 'bg-red-50' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 shrink-0">
                        {isSOS ? (
                          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse block" />
                        ) : isMoving ? (
                          <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse block" />
                        ) : (
                          <span className="w-3 h-3 rounded-full bg-orange-400 block" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-gray-800">{task.vehicle_id}</span>
                          <span className="text-xs text-gray-400">{vehicle?.registration}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority] || ''}`}>
                            {task.priority}
                          </span>
                          {isSOS && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 animate-pulse">
                              🚨 SOS
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs mb-1">
                          <span className="font-medium text-teal-600">{task.source}</span>
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M9 18l6-6-6-6" strokeWidth={2} strokeLinecap="round"/>
                          </svg>
                          <span className="font-medium text-gray-700">{task.dest}</span>
                        </div>

                        <p className="text-xs text-gray-400">
                          Driver: {driver?.name || task.driver_id}
                          {task.notes && ` · ${task.notes}`}
                        </p>

                        {loc && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>
                                {isSOS ? '🚨 Emergency stop' :
                                 isMoving ? `Moving — ${loc.speed} km/h` : '⏸ Idle'}
                              </span>
                              <span>{loc.progress ?? 0}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  isSOS ? 'bg-red-500' : isMoving ? 'bg-green-400' : 'bg-orange-400'
                                }`}
                                style={{ width: `${loc.progress ?? 0}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-300 mt-1">
                              <span>⛽ {loc.fuel_level}%</span>
                              {(loc as any).odometer && <span>🛣 {Math.round((loc as any).odometer)} km</span>}
                              {(loc as any).driver_fatigue > 90 && (
                                <span className="text-orange-400">😴 Driver tired</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(task.task_id)}
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center text-xs transition-colors shrink-0"
                      >✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Trip History Panel ─────────────────────────────────────────────── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setShowHistory(false)}
          />

          {/* Panel — slides in from right */}
          <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl flex flex-col">

            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <div>
                <h3 className="font-semibold text-gray-800">Trip History</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {filteredHistory.length} completed trip{filteredHistory.length !== 1 ? 's' : ''}
                  {historyVehicle !== 'all' && ` for ${historyVehicle}`}
                </p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-500 flex items-center justify-center transition-colors"
              >✕</button>
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0">
              {/* Vehicle filter sidebar */}
              <div className="w-44 border-r border-gray-100 bg-gray-50 flex flex-col shrink-0 overflow-y-auto min-h-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-4 pb-2">
                  Filter by vehicle
                </p>

                <button
                  onClick={() => setHistoryVehicle('all')}
                  className={`flex items-center justify-between mx-2 mb-1 px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors ${
                    historyVehicle === 'all'
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-700 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <span>All Vehicles</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    historyVehicle === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {allTrips.length}
                  </span>
                </button>

                {vehiclesWithHistory.map(vid => {
                  const count = completedTasks.filter(t => t.vehicle_id === vid).length
                  return (
                    <button
                      key={vid}
                      onClick={() => setHistoryVehicle(vid)}
                      className={`flex items-center justify-between mx-2 mb-1 px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors ${
                        historyVehicle === vid
                          ? 'bg-teal-600 text-white'
                          : 'text-gray-700 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      <span className="truncate">{vid.replace('vehicle-', 'Vehicle ')}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${
                        historyVehicle === vid ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}

                {vehiclesWithHistory.length === 0 && (
                  <p className="text-xs text-gray-400 px-3 py-2">No history yet</p>
                )}
              </div>

              {/* Trip list */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {filteredHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <p className="text-4xl mb-3">📋</p>
                    <p className="text-sm text-gray-500 font-medium">No trips yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {historyVehicle === 'all'
                        ? 'Trips will appear here once vehicles complete their routes'
                        : `${historyVehicle} has no completed trips yet`}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {filteredHistory.map((task, idx) => {
                      const driver  = drivers.find((d: any) => d.driver_id === task.driver_id)
                      const vehicle = vehicles.find((v: any) => v.vehicle_id === task.vehicle_id)

                      return (
                        <div key={task.task_id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            {/* Index */}
                            <span className="text-xs text-gray-300 font-mono mt-0.5 w-5 shrink-0 text-right">
                              {filteredHistory.length - idx}
                            </span>

                            {/* Dot */}
                            <div className="mt-1.5 shrink-0">
                              <span className={`w-2.5 h-2.5 rounded-full block ${task.status === 'completed' ? 'bg-gray-300' : task.status === 'active' ? 'bg-teal-400 animate-pulse' : 'bg-orange-300'}`} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-sm font-semibold text-gray-800">{task.vehicle_id?.replace('vehicle-', 'Vehicle ')}</span>
                                {vehicle?.registration && (
                                  <span className="text-xs text-gray-400">{vehicle.registration}</span>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  task.status === 'active' ? 'bg-teal-100 text-teal-700' :
                                  task.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {task.status === 'active' ? 'In Progress' : task.status === 'completed' ? 'Completed' : task.status}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-600'}`}>
                                  {task.priority}
                                </span>
                              </div>

                              {/* Route */}
                              <div className="flex items-center gap-1.5 text-xs mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                                <span className="font-medium text-gray-700">{task.source}</span>
                                <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 18l6-6-6-6" strokeWidth={2} strokeLinecap="round"/>
                                </svg>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                <span className="font-medium text-gray-700">{task.dest}</span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                                <span>Driver: {driver?.name || task.driver_id}</span>
                                {task.completed_at && (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {new Date(task.completed_at).toLocaleString()}
                                  </span>
                                )}
                                {task.notes && <span className="italic truncate">{task.notes}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Trip Modal ──────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-800">Assign New Trip</h3>
              <button onClick={() => setShowForm(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle *</label>
                <select value={form.vehicle_id} onChange={e => handleVehicleChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                  <option value=''>Select vehicle...</option>
                  {availableVehicles.map((v: any) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.vehicle_id} — {v.registration} ({v.type})
                    </option>
                  ))}
                </select>
                {availableVehicles.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1">All vehicles are on active trips</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Driver</label>
                <select value={form.driver_id} onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value=''>Select driver...</option>
                  {drivers.map((d: any) => (
                    <option key={d.driver_id} value={d.driver_id}>{d.name || d.driver_id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">From *</label>
                <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                  <option value=''>Select source...</option>
                  {landmarks.filter(l => l !== form.dest).map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">To *</label>
                <select value={form.dest} onChange={e => setForm(f => ({ ...f, dest: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                  <option value=''>Select destination...</option>
                  {landmarks.filter(l => l !== form.source).map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Priority</label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map(p => (
                    <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.priority === p
                          ? p === 'high'   ? 'bg-red-500 text-white border-red-500'
                          : p === 'medium' ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Fragile cargo, return by 6 PM"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={creating || availableVehicles.length === 0}
                  className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors">
                  {creating ? 'Assigning...' : 'Assign Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
