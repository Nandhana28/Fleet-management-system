import { useState, useCallback, useEffect, useRef } from 'react'
import { useVehicles } from '../hooks/useVehicles'
import { useAlerts } from '../hooks/useAlerts'
import { useSocket } from '../hooks/useSocket'
import FleetMap from '../components/map/FleetMap'
import Sidebar from '../components/layout/Sidebar'
import { Vehicle } from '../types/vehicle'
import api from '../services/api'
import { useToastStore, LogEntry } from '../store/toast'

const LOG_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  success: { bg: '#f0fdf9', border: '#99f6e4', text: '#0f766e', dot: '#0d9488' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#3b82f6' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#f59e0b' },
  alert:   { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#ef4444' },
}

const LOG_SVG: Record<string, JSX.Element> = {
  success: (
    <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="#0d9488" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
    </svg>
  ),
  info: (
    <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="#3b82f6" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
    </svg>
  ),
  warning: (
    <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="#f59e0b" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
    </svg>
  ),
  alert: (
    <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="#ef4444" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
    </svg>
  ),
}

export default function Dashboard() {
  const { data: initialVehicles, isLoading, isError } = useVehicles()
  const { data: alerts } = useAlerts()
  const [liveVehicles, setLiveVehicles] = useState<Vehicle[] | null>(null)
  const [showLog, setShowLog] = useState(false)
  const { logs, clearLogs, markAllRead, exportLogs, addLog } = useToastStore()
  const logEndRef = useRef<HTMLDivElement>(null)

  const handleVehicleUpdate = useCallback((vehicles: Vehicle[]) => {
    setLiveVehicles(vehicles)
  }, [])

  useSocket(handleVehicleUpdate)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await api.get('/vehicles')
        const vehiclesData = res.data.vehicles || res.data
        setLiveVehicles(Array.isArray(vehiclesData) ? vehiclesData : [])
      } catch {}
    }
    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [])

  // Scroll to latest log when new entry added
  useEffect(() => {
    if (showLog && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs.length, showLog])

  const vehicles = Array.isArray(liveVehicles) ? liveVehicles : (Array.isArray(initialVehicles) ? initialVehicles : [])
  const unreadCount = logs.filter(l => !l.read).length

  if (isLoading && !liveVehicles) return (
    <div className="p-4 text-gray-500">Loading vehicles...</div>
  )
  if (isError && !liveVehicles) return (
    <div className="p-4 text-red-500">Error loading data</div>
  )

  return (
    <div className="flex h-full">
      <Sidebar vehicles={vehicles} alertCount={alerts?.length ?? 0} />
      <div className="flex-1 relative">
        <FleetMap vehicles={vehicles} />

        {/* Live indicator */}
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
          {/* Log button */}
          <button
            onClick={() => { setShowLog(p => !p); if (!showLog) markAllRead() }}
            className="relative flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Activity Log
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Live dot */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm text-xs text-gray-600">
            <span className={`w-2 h-2 rounded-full ${liveVehicles ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
            {liveVehicles ? 'Live' : 'Connecting...'}
          </div>
        </div>

        {/* Log Panel */}
        {showLog && (
          <div
            className="absolute top-12 right-3 z-[1000] w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 160px)' }}
          >
            {/* Log header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm font-semibold text-gray-700">Activity Log</span>
                <span className="text-xs text-gray-400">({logs.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportLogs}
                  className="text-xs text-teal-600 hover:underline flex items-center gap-1"
                  title="Save log as text file"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                  </svg>
                  Save
                </button>
                <button
                  onClick={clearLogs}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowLog(false)}
                  className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Log entries */}
            <div className="flex-1 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  <p className="text-xs text-gray-400">No activity yet</p>
                  <p className="text-xs text-gray-300">Events appear here as vehicles move</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {[...logs].reverse().map(entry => {
                    const c = LOG_COLORS[entry.type] || LOG_COLORS.info
                    return (
                      <div
                        key={entry.id}
                        style={{
                          background: c.bg,
                          border: `1px solid ${c.border}`,
                          borderLeft: `3px solid ${c.dot}`,
                        }}
                        className="rounded-lg px-3 py-2 flex items-start gap-2"
                      >
                        {LOG_SVG[entry.type] || LOG_SVG.info}
                        <div className="flex-1 min-w-0">
                          <p style={{ color: c.text }} className="text-xs font-medium leading-relaxed">
                            {entry.message}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                            {entry.vehicle_id && (
                              <span className="ml-1 text-gray-300">· {entry.vehicle_id}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">Log saves automatically on sign out</p>
              <button onClick={exportLogs} className="text-[10px] text-teal-600 hover:underline font-medium">
                Download now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}