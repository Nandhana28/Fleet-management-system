import api from './api'

export const getAlerts = (activeOnly = true) =>
  api.get(`/alerts?active_only=${activeOnly}`).then(res => res.data)

export const resolveAlert = (id: string) =>
  api.patch(`/alerts/${id}/resolve`).then(res => res.data)