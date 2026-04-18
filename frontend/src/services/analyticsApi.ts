import api from './api'

export const getFuelAnalytics    = () => api.get('/analytics/fuel').then(r => r.data)
export const getTripAnalytics    = () => api.get('/analytics/trips').then(r => r.data)
export const getDriverAnalytics  = () => api.get('/analytics/drivers').then(r => r.data)
export const getAlertBreakdown   = () => api.get('/analytics/alerts').then(r => r.data)
export const getFleetSummary     = () => api.get('/analytics/summary').then(r => r.data)
