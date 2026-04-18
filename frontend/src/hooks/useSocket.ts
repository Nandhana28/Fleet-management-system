import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Vehicle } from '../types/vehicle'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function useSocket(onVehicleUpdate: (vehicles: Vehicle[]) => void) {
  const socketRef = useRef<Socket | null>(null)

  const callbackRef = useRef(onVehicleUpdate)
  useEffect(() => {
    callbackRef.current = onVehicleUpdate
  })

  useEffect(() => {
    // Socket disabled — backend doesn't have socketio mounted
    // Vehicles update via polling instead
    console.log('[Socket] Disabled')
    return () => {}
    }, [])

  return socketRef.current
}