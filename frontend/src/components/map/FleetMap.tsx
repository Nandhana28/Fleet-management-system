import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { Vehicle, Trip } from '../../types/vehicle'
import { useAlerts, useResolveAlert } from '../../hooks/useAlerts'

delete (L.Icon.Default.prototype as any)._getIconUrl

const createColoredIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

// Creates a marker with vehicle label floating above it
const createLabeledIcon = (color: string, label: string, pulse = false) => {
  const colors: Record<string, { bg: string; border: string; text: string; markerColor: string }> = {
    green:  { bg: '#f0fdf9', border: '#0d9488', text: '#0f766e', markerColor: 'green'  },
    orange: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', markerColor: 'orange' },
    grey:   { bg: '#f8fafc', border: '#94a3b8', text: '#64748b', markerColor: 'grey'   },
    red:    { bg: '#fef2f2', border: '#ef4444', text: '#dc2626', markerColor: 'red'    },
  }
  const c = colors[color] || colors.grey
  const pulseStyle = pulse ? 'animation:labelPulse 1s ease-in-out infinite;' : ''

  return new L.DivIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;width:70px;margin-left:-22px">
        <style>
          @keyframes labelPulse{0%,100%{box-shadow:0 0 0 2px ${c.border}44}50%{box-shadow:0 0 0 5px ${c.border}22}}
        </style>
        <div style="
          background:${c.bg};
          border:1.5px solid ${c.border};
          color:${c.text};
          font-size:10px;
          font-weight:700;
          font-family:Inter,sans-serif;
          padding:2px 7px;
          border-radius:20px;
          white-space:nowrap;
          box-shadow:0 2px 8px rgba(0,0,0,0.15);
          margin-bottom:2px;
          ${pulseStyle}
        ">${label}</div>
        <img
          src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${c.markerColor}.png"
          style="width:20px;height:33px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
        />
      </div>`,
    iconSize: [70, 55],
    iconAnchor: [35, 55],
    popupAnchor: [0, -55],
    className: '',
  })
}

const sosIcon = (label: string) => new L.DivIcon({
  html: `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;width:80px;margin-left:-27px">
      <style>
        @keyframes sosPulse{0%,100%{box-shadow:0 0 0 3px rgba(239,68,68,0.5)}50%{box-shadow:0 0 0 10px rgba(239,68,68,0.1)}}
        @keyframes sosLabel{0%,100%{opacity:1}50%{opacity:0.7}}
      </style>
      <div style="
        background:#fef2f2;border:2px solid #ef4444;color:#dc2626;
        font-size:10px;font-weight:800;font-family:Inter,sans-serif;
        padding:2px 7px;border-radius:20px;white-space:nowrap;
        animation:sosPulse 0.8s ease-in-out infinite;
        margin-bottom:2px;
      ">🚨 ${label}</div>
      <img
        src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png"
        style="width:22px;height:36px;filter:drop-shadow(0 0 6px rgba(239,68,68,0.8));animation:sosLabel 0.8s ease-in-out infinite"
      />
    </div>`,
  iconSize: [80, 60],
  iconAnchor: [40, 60],
  popupAnchor: [0, -60],
  className: '',
})

const getMarkerIcon = (vehicle: Vehicle) => {
  const vid   = vehicle.vehicle_id
  const label = vid.replace('vehicle-', 'V')
  const speed = vehicle.current_location?.speed ?? 0
  const status = vehicle.status

  if (status === 'sos') return sosIcon(label)
  if (status === 'offline') return createLabeledIcon('grey', label)
  if (speed > 5) return createLabeledIcon('green', label, false)
  return createLabeledIcon('orange', label)
}

interface Props { vehicles: Vehicle[] }

export default function FleetMap({ vehicles }: Props) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [trips, setTrips]         = useState<Trip[]>([])
  const [loadingTrips, setLoadingTrips] = useState(false)
  const [sosState, setSosState]   = useState<'idle'|'confirm'|'sending'|'sent'>('idle')
  const [vehicleRoutes, setVehicleRoutes] = useState<Record<string, [number,number][]>>({})
  const [resolving, setResolving] = useState(false)
  const [resolveStep, setResolveStep] = useState<'idle'|'ask'|'pick'|'sending'>('idle')
  const mapRef = useRef<L.Map | null>(null)

  const { data: alertsData } = useAlerts(true)
  const resolveAlertMutation = useResolveAlert()

  const liveSelected = selectedVehicle
    ? vehicles.find(v => v.vehicle_id === selectedVehicle.vehicle_id) ?? selectedVehicle
    : null

  const isSOS = liveSelected?.status === 'sos'
  const loc   = liveSelected?.current_location

  useEffect(() => { setSosState('idle'); setResolveStep('idle') }, [selectedVehicle?.vehicle_id])

  // Re-fetch selected vehicle route whenever vehicle changes
  useEffect(() => {
    if (!liveSelected) return
    fetchRoute(liveSelected.vehicle_id)
  }, [liveSelected?.vehicle_id])

  // Auto-fetch & keep routes for any SOS vehicle so red line appears immediately
  useEffect(() => {
    vehicles.filter(v => v.status === 'sos').forEach(v => fetchRoute(v.vehicle_id))
  }, [vehicles.map(v => `${v.vehicle_id}:${v.status}`).join(',')]) // eslint-disable-line react-hooks/exhaustive-deps


  const fetchRoute = async (vehicle_id: string) => {
    try {
      const token = localStorage.getItem('token')
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
      const res = await fetch(`${apiBase}/vehicles/${vehicle_id}/route`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const wps = (data.waypoints || [])
        .map((wp: any) => Array.isArray(wp) ? wp as [number,number] : [wp[0], wp[1]] as [number,number])
        .filter((wp: [number,number]) => wp[0] && wp[1])
      if (wps.length > 1) {
        setVehicleRoutes(prev => ({ ...prev, [vehicle_id]: wps }))
      } else {
        // Clear stale route if vehicle has no active route
        setVehicleRoutes(prev => {
          if (!prev[vehicle_id]) return prev
          const next = { ...prev }
          delete next[vehicle_id]
          return next
        })
      }
    } catch {}
  }

  const handleMarkerClick = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setTrips([])
    if (vehicle.current_location && mapRef.current) {
      mapRef.current.flyTo(
        [vehicle.current_location.latitude, vehicle.current_location.longitude],
        15, { duration: 1 }
      )
    }
    // Always refresh route on click to get latest waypoints
    await fetchRoute(vehicle.vehicle_id)
    setLoadingTrips(true)
    try {
      const token = localStorage.getItem('token')
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
      const res = await fetch(`${apiBase}/vehicles/${vehicle.vehicle_id}/trips`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setTrips(Array.isArray(data) ? data : [])
    } catch { setTrips([]) }
    finally { setLoadingTrips(false) }
  }

  const handleSOS = async () => {
    if (sosState === 'idle')    { setSosState('confirm'); return }
    if (sosState !== 'confirm') return
    setSosState('sending')
    try {
      const token = localStorage.getItem('token')
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
      await fetch(`${apiBase}/alerts/sos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: liveSelected?.vehicle_id,
          latitude:   loc?.latitude ?? 0,
          longitude:  loc?.longitude ?? 0,
        }),
      })
      setSosState('sent')
    } catch { setSosState('idle') }
  }

  const getSOSAlert = () => {
    const alerts: any[] = Array.isArray(alertsData) ? alertsData : (alertsData as any)?.alerts || []
    // Find the active SOS alert for this vehicle — match by alert_type or by any active alert
    return alerts.find(
      (a: any) => a.vehicle_id === liveSelected?.vehicle_id && a.alert_type === 'SOS'
    ) ?? alerts.find(
      (a: any) => a.vehicle_id === liveSelected?.vehicle_id
    )
  }

  const handleResolveAction = async (action: 'resume' | 'replace') => {
    if (!liveSelected || resolving) return
    const sosAlert = getSOSAlert()
    if (!sosAlert) return
    setResolving(true)
    try {
      await resolveAlertMutation.mutateAsync({ alertId: sosAlert.alert_id, action })

      if (action === 'resume') {
        // Resume with same vehicle - create return task to source with red route
        if (loc?.source && liveSelected.current_location) {
          try {
            const token = localStorage.getItem('token')
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

            console.log('[Resume] Creating return task from', liveSelected.vehicle_id, 'back to:', loc.source)

            // Create a return task: current location → source location
            const taskRes = await fetch(`${apiBase}/tasks`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vehicle_id: liveSelected.vehicle_id,
                driver_id:  liveSelected.driver_id,
                source:     loc.source,
                dest:       loc.source,  // Return to same location (source)
                priority:   'high',
                notes:      `SOS Vehicle returning to source - gradual movement with route`,
              }),
            })

            if (taskRes.ok) {
              const taskData = await taskRes.json()
              console.log('[Resume] Return task created:', taskData)

              // Wait longer for simulator to pick up task and generate route
              await new Promise(r => setTimeout(r, 3000))

              // Fetch route multiple times to ensure we get it
              let retries = 0
              while (retries < 5) {
                await fetchRoute(liveSelected.vehicle_id)
                const route = vehicleRoutes[liveSelected.vehicle_id]
                if (route && route.length > 0) {
                  console.log('[Resume] Return route fetched:', route.length, 'waypoints')
                  break
                }
                retries++
                await new Promise(r => setTimeout(r, 1000))
              }

              console.log('[Resume] Vehicle now returning to', loc.source, 'with red route visible')
            } else {
              throw new Error('Failed to create return task')
            }
          } catch (e) {
            console.error('[Return to Source] Failed:', e)
            alert(`Failed to create return route: ${e}`)
          }
        }

        // Keep vehicle selected so user sees return-to-source movement
        setResolveStep('idle')
        setSosState('idle')
      } else {
        // Replace vehicle - show vehicle picker
        setResolveStep('pick')
      }
    } catch (e) {
      console.error('[Resolve] Failed:', e)
    } finally {
      setResolving(false)
    }
  }

  const handleSendReplacement = async (replacement: Vehicle) => {
    if (!liveSelected || !loc?.source || !loc?.dest) return
    setResolveStep('sending')
    try {
      const token = localStorage.getItem('token')
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

      console.log('[Replacement] Dispatching', replacement.vehicle_id, 'to', loc.source, '→', loc.dest)

      // Create task for replacement vehicle
      const taskRes = await fetch(`${apiBase}/tasks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: replacement.vehicle_id,
          driver_id:  replacement.driver_id,
          source:     loc.source,
          dest:       loc.dest,
          priority:   'high',
          notes:      `Replacement dispatch for SOS on ${liveSelected.vehicle_id}`,
        }),
      })

      if (!taskRes.ok) {
        throw new Error(`Task creation failed: ${taskRes.status}`)
      }

      const taskData = await taskRes.json()
      console.log('[Replacement] Task created:', taskData)

      // Wait longer for task to be picked up by simulator and start generating route
      await new Promise(r => setTimeout(r, 3000))

      // Fetch route multiple times to ensure we get it
      let retries = 0
      while (retries < 5) {
        await fetchRoute(replacement.vehicle_id)
        const route = vehicleRoutes[replacement.vehicle_id]
        if (route && route.length > 0) {
          console.log('[Replacement] Route fetched successfully:', route.length, 'waypoints')
          break
        }
        retries++
        await new Promise(r => setTimeout(r, 1000))
      }

      setResolveStep('idle')
      setSosState('idle')

      // Switch to replacement vehicle so user sees it moving with route
      setSelectedVehicle(replacement)
      console.log('[Replacement] Vehicle dispatched, now tracking:', replacement.vehicle_id)

    } catch (e) {
      console.error('[Replacement] Failed:', e)
      alert(`Failed to dispatch vehicle: ${e}`)
      setResolveStep('pick')
    }
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[11.0168, 76.9558]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Route line for selected vehicle - enhanced visibility */}
        {liveSelected && (vehicleRoutes[liveSelected.vehicle_id] || []).length >= 2 && (() => {
          const isSOSActive = liveSelected.status === 'sos'
          const routeWaypoints = vehicleRoutes[liveSelected.vehicle_id]

          return (
            <>
              {/* Background glow effect for better visibility */}
              {!isSOSActive && (
                <Polyline
                  positions={routeWaypoints}
                  pathOptions={{
                    color:     '#0d9488',
                    weight:    8,
                    opacity:   0.2,
                    dashArray: undefined,
                  }}
                />
              )}
              {/* Main route line */}
              <Polyline
                positions={routeWaypoints}
                pathOptions={{
                  color:     isSOSActive ? '#ef4444' : '#0d9488',
                  weight:    isSOSActive ? 5 : 4,
                  opacity:   isSOSActive ? 1 : 0.9,
                  dashArray: isSOSActive ? '10 8' : undefined,
                  lineCap:   'round',
                  lineJoin:  'round',
                }}
              />
            </>
          )
        })()}

        {/* Red pulsing routes for all SOS vehicles (even when not selected) */}
        {vehicles
          .filter(v => v.status === 'sos' && v.vehicle_id !== liveSelected?.vehicle_id)
          .map(v => {
            const wps = vehicleRoutes[v.vehicle_id] || []
            if (wps.length < 2) return null
            return (
              <div key={`sos-${v.vehicle_id}`}>
                {/* Glow background */}
                <Polyline
                  positions={wps}
                  pathOptions={{ color: '#ef4444', weight: 8, opacity: 0.2 }}
                />
                {/* Main SOS route */}
                <Polyline
                  positions={wps}
                  pathOptions={{
                    color: '#ef4444',
                    weight: 5,
                    opacity: 1,
                    dashArray: '10 8',
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              </div>
            )
          })
        }

        {/* Markers with labels - smooth animation along route */}
        {vehicles.filter(v => v.current_location).map((vehicle, idx) => {
          const vloc = vehicle.current_location!
          const isMoving = (vloc.speed ?? 0) > 5

          return (
            <Marker
              key={`${vehicle.vehicle_id}-${isMoving ? 'moving' : 'idle'}`}
              position={[vloc.latitude, vloc.longitude]}
              icon={getMarkerIcon(vehicle)}
              eventHandlers={{
                click: () => handleMarkerClick(vehicle),
              }}
            >
              <Popup>
                <div className="text-sm font-semibold">{vehicle.vehicle_id}</div>
                <div className="text-xs text-gray-500">{vehicle.registration}</div>
                <div className="text-xs mt-1">
                  {vehicle.status === 'sos' ? 'SOS ACTIVE' :
                   (vloc.speed ?? 0) > 5 ? `${vloc.speed} km/h` : 'Idle'}
                </div>
                {vloc.source && vloc.source !== vloc.dest && (
                  <div className="text-xs text-gray-400 mt-1">{vloc.source} → {vloc.dest}</div>
                )}
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Detail panel */}
      {liveSelected && (
        <div className={`absolute top-0 right-0 h-full w-80 bg-white border-l shadow-xl z-[1000] flex flex-col overflow-hidden ${
          isSOS ? 'border-red-300' : 'border-gray-200'
        }`}>
          <div className={`p-4 border-b flex flex-col gap-2 ${isSOS ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{liveSelected.vehicle_id}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{liveSelected.registration} · {liveSelected.type}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isSOS ? 'bg-red-100 text-red-700 animate-pulse' :
                    (loc?.speed ?? 0) > 5 ? 'bg-green-100 text-green-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {isSOS ? (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        SOS
                      </span>
                    ) : (loc?.speed ?? 0) > 5 ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-current rounded-full"></span>
                        Moving
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-current rounded-full"></span>
                        Idle
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-400">{liveSelected.driver_id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center font-bold shrink-0"
              >✕</button>
            </div>

            {(isSOS || resolveStep !== 'idle') ? (
              <div className="flex flex-col gap-2">
                {isSOS && (
                  <div className="bg-red-600 text-white text-xs font-bold py-2 rounded-lg text-center animate-pulse">
                    EMERGENCY SOS — Vehicle Stopped
                  </div>
                )}

                {/* Step 1 — Show SOS button and Resolve button */}
                {resolveStep === 'idle' && isSOS && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleSOS}
                      disabled={sosState === 'sending'}
                      className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                        sosState === 'confirm'  ? 'bg-red-600 text-white animate-pulse' :
                        sosState === 'sending' ? 'bg-red-300 text-white cursor-not-allowed' :
                        'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                      }`}
                    >
                      {sosState === 'idle'    && 'Emergency SOS'}
                      {sosState === 'confirm' && 'Tap again to confirm SOS'}
                      {sosState === 'sending' && 'Sending...'}
                    </button>
                    
                    {sosState === 'sent' && (
                      <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-medium py-2 rounded-lg text-center flex items-center justify-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        SOS sent — help is on the way
                      </div>
                    )}
                    
                    <button
                      onClick={() => setResolveStep('ask')}
                      className="w-full py-2 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                    >
                      Resolve SOS
                    </button>
                  </div>
                )}

                {/* Step 2 — Choose action */}
                {resolveStep === 'ask' && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-center text-gray-600 font-medium py-1">How do you want to proceed?</p>
                    <button
                      onClick={() => handleResolveAction('resume')}
                      disabled={resolving}
                      className="w-full py-2 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300 transition-colors"
                    >
                      {resolving ? 'Resuming...' : 'Resume with same vehicle'}
                    </button>
                    <button
                      onClick={() => handleResolveAction('replace')}
                      disabled={resolving}
                      className="w-full py-2 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:bg-teal-300 transition-colors"
                    >
                      {resolving ? 'Processing...' : 'Send alternate vehicle'}
                    </button>
                    <button
                      onClick={() => setResolveStep('idle')}
                      className="text-xs text-gray-400 hover:text-gray-600 text-center py-1"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Step 3 — Pick replacement vehicle */}
                {resolveStep === 'pick' && (() => {
                  const idleVehicles = vehicles.filter(v =>
                    v.vehicle_id !== liveSelected?.vehicle_id &&
                    v.status !== 'sos' &&
                    v.status === 'idle'
                  )
                  const otherVehicles = vehicles.filter(v =>
                    v.vehicle_id !== liveSelected?.vehicle_id &&
                    v.status !== 'sos' &&
                    v.status !== 'idle'
                  )

                  return (
                    <div className="flex flex-col gap-2">
                      <div className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 text-xs text-teal-700 font-medium text-center">
                        Original route: {loc?.source} → {loc?.dest}
                      </div>

                      {idleVehicles.length === 0 ? (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700 font-medium text-center">
                          ⚠️ No idle vehicles available. All vehicles are in use.
                        </div>
                      ) : null}

                      {idleVehicles.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-gray-600">Available vehicles (Idle):</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {idleVehicles.map(v => (
                              <button
                                key={v.vehicle_id}
                                onClick={() => handleSendReplacement(v)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors text-left"
                              >
                                <div>
                                  <p className="text-xs font-semibold text-gray-800">{v.vehicle_id}</p>
                                  <p className="text-[10px] text-gray-400">{v.registration} · {v.driver_id}</p>
                                </div>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                  Idle
                                </span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {otherVehicles.length > 0 && idleVehicles.length === 0 && (
                        <>
                          <p className="text-xs font-semibold text-gray-600">Other vehicles (in use):</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {otherVehicles.map(v => (
                              <div
                                key={v.vehicle_id}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-gray-50"
                              >
                                <div>
                                  <p className="text-xs font-semibold text-gray-800">{v.vehicle_id}</p>
                                  <p className="text-[10px] text-gray-400">{v.registration} · {v.driver_id}</p>
                                </div>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                  {v.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <button
                        onClick={() => setResolveStep('ask')}
                        className="text-xs text-gray-400 hover:text-gray-600 text-center py-1"
                      >
                        ← Back
                      </button>
                    </div>
                  )
                })()}

                {/* Step 4 — Dispatching */}
                {resolveStep === 'sending' && (
                  <div className="flex items-center justify-center gap-2 py-3 text-xs text-teal-600 font-medium">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Dispatching alternate vehicle...
                  </div>
                )}
              </div>
            ) : sosState === 'sent' ? (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-medium py-2 rounded-lg text-center flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                SOS sent — help is on the way
              </div>
            ) : (
              <button
                onClick={handleSOS}
                disabled={sosState === 'sending'}
                className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                  sosState === 'confirm'  ? 'bg-red-600 text-white animate-pulse' :
                  sosState === 'sending' ? 'bg-red-300 text-white cursor-not-allowed' :
                  'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                }`}
              >
                {sosState === 'idle'    && 'Emergency SOS'}
                {sosState === 'confirm' && 'Tap again to confirm SOS'}
                {sosState === 'sending' && 'Sending...'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loc?.source && loc.dest && loc.source !== loc.dest && (loc.speed ?? 0) > 5 && (
              <div className="p-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Current Route</p>
                <div className="flex items-start gap-2 mb-3">
                  <div className="flex flex-col items-center gap-1 mt-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <div className="w-0.5 h-7 bg-gray-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  </div>
                  <div className="flex flex-col justify-between h-10">
                    <p className="text-xs font-medium text-gray-700">{loc.source}</p>
                    <p className="text-xs font-medium text-gray-700">{loc.dest}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span className={isSOS ? 'text-red-500 font-medium' : ''}>
                    {isSOS ? 'SOS Active' : `${loc.progress ?? 0}%`}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${isSOS ? 'bg-red-500' : 'bg-teal-500'}`}
                    style={{ width: `${loc.progress ?? 0}%` }}
                  />
                </div>
              </div>
            )}

            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Live Metrics</p>
              {loc ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Speed</p>
                    <p className={`text-xl font-bold ${isSOS ? 'text-red-500' : (loc.speed??0) > 80 ? 'text-orange-500' : 'text-gray-800'}`}>
                      {isSOS ? 0 : (loc.speed ?? 0)}
                    </p>
                    <p className="text-xs text-gray-400">km/h</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Fuel</p>
                    <p className={`text-xl font-bold ${(loc.fuel_level??0) < 20 ? 'text-red-500' : 'text-gray-800'}`}>
                      {loc.fuel_level ?? 0}%
                    </p>
                    <div className="mt-1 h-1 bg-gray-200 rounded-full">
                      <div className={`h-1 rounded-full ${(loc.fuel_level??0) < 20 ? 'bg-red-400' : 'bg-teal-500'}`}
                        style={{ width: `${Math.min(loc.fuel_level??0, 100)}%` }} />
                    </div>
                  </div>
                  {(loc as any).odometer && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Odometer</p>
                      <p className="text-sm font-bold text-gray-800">{Math.round((loc as any).odometer)}</p>
                      <p className="text-xs text-gray-400">km</p>
                    </div>
                  )}
                  {(loc as any).driver_fatigue !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Driver Time</p>
                      <p className={`text-sm font-bold ${(loc as any).driver_fatigue > 90 ? 'text-red-500' : 'text-gray-800'}`}>
                        {(loc as any).driver_fatigue} min
                      </p>
                      <p className="text-xs text-gray-400">on shift</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                    <p className="text-xs text-gray-400 mb-1">GPS</p>
                    <p className="text-xs font-mono text-gray-600">{loc.latitude}, {loc.longitude}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Updated {new Date(loc.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No live data</p>
              )}
            </div>

            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Vehicle Info</p>
              <div className="space-y-2">
                {[
                  { label: 'Vehicle ID',    value: liveSelected.vehicle_id },
                  { label: 'Registration',  value: liveSelected.registration },
                  { label: 'Type',          value: liveSelected.type },
                  { label: 'Driver',        value: liveSelected.driver_id },
                  { label: 'Fuel Capacity', value: `${liveSelected.fuel_capacity}L` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-xs font-medium text-gray-700 capitalize">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assign New Task */}
            {liveSelected.status !== 'sos' && (
              <div className="p-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Assign Trip</p>
                <div className="space-y-2">
                  <select
                    id={`source-${liveSelected.vehicle_id}`}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                    defaultValue=""
                  >
                    <option value="">Select source location</option>
                    {['Gandhipuram Bus Stand', 'Coimbatore Airport', 'RS Puram', 'Peelamedu', 'Ukkadam', 'Singanallur', 'Tidel Park', 'Podanur Junction', 'Saibaba Colony', 'Ganapathy', 'Race Course', 'Vadavalli', 'Hopes College', 'Kuniyamuthur', 'Kovaipudur', 'Thondamuthur'].map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <select
                    id={`dest-${liveSelected.vehicle_id}`}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                    defaultValue=""
                  >
                    <option value="">Select destination</option>
                    {['Gandhipuram Bus Stand', 'Coimbatore Airport', 'RS Puram', 'Peelamedu', 'Ukkadam', 'Singanallur', 'Tidel Park', 'Podanur Junction', 'Saibaba Colony', 'Ganapathy', 'Race Course', 'Vadavalli', 'Hopes College', 'Kuniyamuthur', 'Kovaipudur', 'Thondamuthur'].map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      const source = (document.getElementById(`source-${liveSelected.vehicle_id}`) as HTMLSelectElement)?.value
                      const dest = (document.getElementById(`dest-${liveSelected.vehicle_id}`) as HTMLSelectElement)?.value
                      if (!source || !dest || source === dest) {
                        alert('Please select different source and destination')
                        return
                      }
                      try {
                        const token = localStorage.getItem('token')
                        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

                        console.log('[Assign] Creating task:', liveSelected.vehicle_id, source, '→', dest)

                        const res = await fetch(`${apiBase}/tasks`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            vehicle_id: liveSelected.vehicle_id,
                            driver_id:  liveSelected.driver_id,
                            source,
                            dest,
                            priority:   'normal',
                            notes:      'Trip assigned from dashboard',
                          }),
                        })

                        if (res.ok) {
                          console.log('[Assign] Task created, waiting for route...')

                          // Wait for simulator to pick up task and generate route
                          await new Promise(r => setTimeout(r, 3000))

                          // Fetch route with retries to ensure it's visible
                          let retries = 0
                          while (retries < 5) {
                            await fetchRoute(liveSelected.vehicle_id)
                            const route = vehicleRoutes[liveSelected.vehicle_id]
                            if (route && route.length > 0) {
                              console.log('[Assign] Route visible with', route.length, 'waypoints')
                              break
                            }
                            retries++
                            await new Promise(r => setTimeout(r, 1000))
                          }

                          alert(`✅ Trip assigned: ${source} → ${dest}\n\nVehicle will move gradually with visible route`)
                          ;(document.getElementById(`source-${liveSelected.vehicle_id}`) as HTMLSelectElement).value = ''
                          ;(document.getElementById(`dest-${liveSelected.vehicle_id}`) as HTMLSelectElement).value = ''
                        } else {
                          alert('Failed to assign trip')
                        }
                      } catch (e) {
                        console.error('[Task] Failed:', e)
                        alert('Error assigning trip')
                      }
                    }}
                    className="w-full py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                  >
                    Assign Trip
                  </button>
                </div>
              </div>
            )}

            {/* Trip History & Active Trips */}
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Trips {trips.length > 0 && `(${trips.length})`}
              </p>
              {loadingTrips ? (
                <p className="text-xs text-gray-400">Loading...</p>
              ) : trips.length === 0 ? (
                <p className="text-xs text-gray-400">No active or past trips</p>
              ) : (
                <div className="space-y-2">
                  {trips.slice(0, 5).map((trip, i) => {
                    const t = trip as any
                    const isActive = t.status === 'active'
                    return (
                      <div key={t.trip_id || i} className={`border rounded-lg p-3 ${isActive ? 'border-teal-200 bg-teal-50' : 'border-gray-100'}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-700">{t.source} → {t.dest}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {isActive ? '🚗 Active' : '✓ Completed'}
                            </p>
                          </div>
                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-200 text-teal-700">
                              IN PROGRESS
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}