import { useQuery } from '@tanstack/react-query'
import { getFuelAnalytics, getTripAnalytics, getDriverAnalytics } from '../services/analyticsApi'

export const useFuelAnalytics = () =>
  useQuery({ queryKey: ['fuel-analytics'], queryFn: getFuelAnalytics })

export const useTripAnalytics = () =>
  useQuery({ queryKey: ['trip-analytics'], queryFn: getTripAnalytics })

export const useDriverAnalytics = () =>
  useQuery({ queryKey: ['driver-analytics'], queryFn: getDriverAnalytics })