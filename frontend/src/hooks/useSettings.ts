import { useQuery, useMutation } from '@tanstack/react-query'
import { getSettings, saveSettings, testAlert } from '../services/settingsApi'
import type { Settings } from '../services/settingsApi'

export function useSettings() {
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const saveMutation = useMutation({
    mutationFn: (settings: Settings) => saveSettings(settings),
    onSuccess: () => {
      query.refetch()
    },
  })

  const testMutation = useMutation({
    mutationFn: () => testAlert(),
  })

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    saveSettings: (settings: Settings) => saveMutation.mutate(settings),
    isSaving: saveMutation.isPending,
    testAlert: () => testMutation.mutate(),
    isTesting: testMutation.isPending,
  }
}
