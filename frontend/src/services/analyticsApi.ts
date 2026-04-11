import api from './api'

export const getFuelAnalytics = () =>
  api.get('/analytics/fuel').then(res => res.data)

export const getTripAnalytics = () =>
  api.get('/analytics/trips').then(res => res.data)

export const getDriverAnalytics = () =>
  api.get('/analytics/drivers').then(res => res.data)