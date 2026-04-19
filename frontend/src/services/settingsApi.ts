import api from './api'

export interface Settings {
  thresholds: {
    fuel_low: string
    speed_limit: string
    idle_timeout: string
  }
  notifications: {
    whatsapp: string
    email: string
  }
  alerts: {
    fuel_theft: boolean
    overspeeding: boolean
    route_deviation: boolean
    offline: boolean
    night_alerts: boolean
  }
}

export const getSettings = () =>
  api.get<Settings>('/settings').then((res) => res.data)

export const saveSettings = (settings: Settings) =>
  api.post('/settings', settings).then((res) => res.data)

export const testAlert = () =>
  api.post('/settings/test-alert').then((res) => res.data)

export const generateReport = () =>
  api.post('/settings/generate-report').then((res) => res.data)

export const downloadReport = () =>
  api.get('/settings/download-report', { responseType: 'blob' }).then((res) => res.data)
