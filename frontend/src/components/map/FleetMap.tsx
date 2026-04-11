import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Vehicle } from '../../types/vehicle'

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

const icons: Record<string, L.Icon> = {
  green: createColoredIcon('green'),
  orange: createColoredIcon('orange'),
  grey: createColoredIcon('grey'),
  blue: createColoredIcon('blue'),
}

const getIcon = (status: string) => {
  switch (status) {
    case 'moving': return icons.green
    case 'idle': return icons.orange
    case 'offline': return icons.grey
    default: return icons.blue
  }
}

interface Props {
  vehicles: Vehicle[]
}

export default function FleetMap({ vehicles }: Props) {
  return (
    <MapContainer
      center={[11.0168, 76.9558]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {vehicles.map((vehicle) => {
        const loc = vehicle.current_location
        if (!loc) return null
        return (
          <Marker
            key={vehicle.vehicle_id}
            position={[loc.latitude, loc.longitude]}
            icon={getIcon(vehicle.status)}
          >
            <Popup>
              <div className="text-sm space-y-1 min-w-[160px]">
                <div className="font-bold text-gray-800">{vehicle.vehicle_id}</div>
                <div className="text-gray-500">{vehicle.registration}</div>
                <hr />
                <div>Speed: <span className="font-medium">{loc.speed} km/h</span></div>
                <div>Fuel: <span className="font-medium">{loc.fuel_level}%</span></div>
                <div>Driver: <span className="font-medium">{vehicle.driver_id ?? 'Unassigned'}</span></div>
                <div>
                  Status:{' '}
                  <span className={
                    vehicle.status === 'moving' ? 'text-green-600 font-medium' :
                    vehicle.status === 'idle' ? 'text-orange-500 font-medium' :
                    'text-gray-400 font-medium'
                  }>
                    {vehicle.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}