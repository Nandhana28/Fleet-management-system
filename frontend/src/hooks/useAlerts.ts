import { useQuery } from '@tanstack/react-query'
import { getAlerts } from '../services/alertApi'

export function useAlerts(activeOnly = true) {
  return useQuery({
    queryKey: ['alerts', activeOnly],
    queryFn: () => getAlerts(activeOnly),
    refetchInterval: 10000,
  })
}