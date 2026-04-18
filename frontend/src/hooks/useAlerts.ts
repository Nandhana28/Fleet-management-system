import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAlerts, resolveAlert, resolveAllAlerts } from '../services/alertApi'

export function useAlerts(activeOnly = true) {
  return useQuery({
    queryKey: ['alerts', activeOnly],
    queryFn: () => getAlerts(activeOnly),
    refetchInterval: 8000,
  })
}

export function useResolveAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ alertId, action = 'resume' }: { alertId: string; action?: string }) =>
      resolveAlert(alertId, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function useResolveAllAlerts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: resolveAllAlerts,
    onMutate: async () => {
      // Cancel in-flight refetches so they don't overwrite optimistic state
      await qc.cancelQueries({ queryKey: ['alerts'] })
      // Instantly wipe the alerts list in the cache
      qc.setQueryData(['alerts', true], [])
      qc.setQueryData(['alerts', false], (old: any) => {
        if (!old) return old
        const list = Array.isArray(old) ? old : old.alerts || []
        const updated = list.map((a: any) => ({ ...a, status: 'resolved' }))
        return Array.isArray(old) ? updated : { ...old, alerts: updated }
      })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}
