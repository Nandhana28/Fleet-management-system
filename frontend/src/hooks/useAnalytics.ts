import { useQuery } from '@tanstack/react-query'
import { getFuelAnalytics, getTripAnalytics, getDriverAnalytics, getAlertBreakdown, getFleetSummary } from '../services/analyticsApi'

export const useFuelAnalytics   = () => useQuery({ queryKey: ['fuel-analytics'],   queryFn: getFuelAnalytics,   refetchInterval: 15000 })
export const useTripAnalytics   = () => useQuery({ queryKey: ['trip-analytics'],   queryFn: getTripAnalytics,   refetchInterval: 30000 })
export const useDriverAnalytics = () => useQuery({ queryKey: ['driver-analytics'], queryFn: getDriverAnalytics, refetchInterval: 30000 })
export const useAlertBreakdown  = () => useQuery({ queryKey: ['alert-breakdown'],  queryFn: getAlertBreakdown,  refetchInterval: 15000 })
export const useFleetSummary    = () => useQuery({ queryKey: ['fleet-summary'],    queryFn: getFleetSummary,    refetchInterval: 10000 })
