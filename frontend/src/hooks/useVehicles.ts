import { useQuery } from '@tanstack/react-query'
import { getVehicles } from '../services/vehicleApi'

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
    refetchInterval: 5000,
  })
}