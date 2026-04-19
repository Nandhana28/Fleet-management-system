import { useState, useEffect } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { useToastStore } from '../../store/toast'
import { Card } from '../ui/Card'
import type { Settings } from '../../services/settingsApi'

export function SettingsForm() {
  const { settings, isSaving, saveSettings, testAlert, isTesting } = useSettings()
  const { showToast } = useToastStore()
  const [formData, setFormData] = useState<Settings>({
    thresholds: { fuel_low: '20', speed_limit: '80', idle_timeout: '15' },
    notifications: { whatsapp: '', email: '' },
    alerts: { fuel_theft: true, overspeeding: true, route_deviation: true, offline: false, night_alerts: true },
  })
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setHasChanges(true)

    if (name.startsWith('threshold_')) {
      const key = name.replace('threshold_', '') as keyof Settings['thresholds']
      setFormData({
        ...formData,
        thresholds: { ...formData.thresholds, [key]: value },
      })
    } else if (name.startsWith('notify_')) {
      const key = name.replace('notify_', '') as keyof Settings['notifications']
      setFormData({
        ...formData,
        notifications: { ...formData.notifications, [key]: value },
      })
    } else if (name.startsWith('alert_')) {
      const key = name.replace('alert_', '') as keyof Settings['alerts']
      setFormData({
        ...formData,
        alerts: { ...formData.alerts, [key]: checked },
      })
    }
  }

  const handleSave = () => {
    saveSettings(formData)
    setHasChanges(false)
    showToast('Settings saved successfully', 'success')
  }

  const handleTestAlert = () => {
    testAlert()
    showToast('Test alert sent!', 'info')
  }

  const handleReset = () => {
    if (settings) {
      setFormData(settings)
      setHasChanges(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notification Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              WhatsApp Number
            </label>
            <input
              type="tel"
              name="notify_whatsapp"
              value={formData.notifications.whatsapp}
              onChange={handleChange}
              placeholder="+91 9876543210"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="notify_email"
              value={formData.notifications.email}
              onChange={handleChange}
              placeholder="email@example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
            />
          </div>
          <button
            onClick={handleTestAlert}
            disabled={isTesting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isTesting ? 'Sending...' : 'Send Test Alert'}
          </button>
        </div>
      </Card>

      {/* Alert Thresholds */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Alert Thresholds
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fuel Low (%)
            </label>
            <input
              type="number"
              name="threshold_fuel_low"
              value={formData.thresholds.fuel_low}
              onChange={handleChange}
              min="5"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Speed Limit (km/h)
            </label>
            <input
              type="number"
              name="threshold_speed_limit"
              value={formData.thresholds.speed_limit}
              onChange={handleChange}
              min="40"
              max="120"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Idle Timeout (min)
            </label>
            <input
              type="number"
              name="threshold_idle_timeout"
              value={formData.thresholds.idle_timeout}
              onChange={handleChange}
              min="5"
              max="60"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>
      </Card>

      {/* Alert Types */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Alert Types
        </h3>
        <div className="space-y-3">
          {[
            { key: 'fuel_theft', label: '⛽ Fuel Theft' },
            { key: 'overspeeding', label: '🏁 Overspeeding' },
            { key: 'route_deviation', label: '🗺️ Route Deviation' },
            { key: 'offline', label: '📡 Vehicle Offline' },
            { key: 'night_alerts', label: '🌙 Night Movement' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded">
              <input
                type="checkbox"
                name={`alert_${key}`}
                checked={formData.alerts[key as keyof Settings['alerts']]}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
