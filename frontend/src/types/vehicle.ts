export interface VehicleLocation {
  latitude: number
  longitude: number
  speed: number
  fuel_level: number
  status: string
  timestamp: string
  source?: string
  dest?: string
  progress?: number
}

export interface Vehicle {
  vehicle_id: string
  registration: string
  driver_id: string
  type: string
  fuel_capacity: number
  status: string
  current_location: VehicleLocation | null
}

export interface Trip {
  trip_id: string
  vehicle_id: string
  driver_id: string
  start_location?: string
  end_location?: string
  start_time?: string
  end_time?: string
  distance_km?: number
  fuel_used?: number
  timestamp: string
}

export interface Alert {
  alert_id: string
  vehicle_id: string
  alert_type: string
  message: string
  severity: string
  resolved: boolean
  timestamp: string
}