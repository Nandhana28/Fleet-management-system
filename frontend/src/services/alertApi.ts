import api from './api'

export const getAlerts = (activeOnly = true) =>
  api.get(`/alerts?active_only=${activeOnly}`).then(res => res.data.alerts || res.data)

export const resolveAlert = (id: string, action = 'resume') =>
  api.patch(`/alerts/${id}/resolve`, { action }).then(res => res.data)

export const resolveAllAlerts = () =>
  api.post('/alerts/resolve-all').then(res => res.data)