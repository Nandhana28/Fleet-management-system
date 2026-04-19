import { useQuery } from '@tanstack/react-query'
import { getProfile } from '../services/profileApi'
import { useUserStore } from '../store/user'
import { useEffect } from 'react'

export function useProfile() {
  const { setUser } = useUserStore()
  const query = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    if (query.data) {
      setUser(query.data)
    }
  }, [query.data, setUser])

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
