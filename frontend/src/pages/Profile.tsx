import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useTheme } from '../hooks/useTheme'
import { Card } from '../components/ui/Card'
import { Tabs } from '../components/ui/Tabs'
import { SettingsForm } from '../components/settings/SettingsForm'
import { FuelHistoryChart } from '../components/fuel/FuelHistoryChart'
import { ActivityTimeline } from '../components/profile/ActivityTimeline'
import { useToastStore } from '../store/toast'
import { updateProfile, updatePreferences, uploadAvatar, changePassword } from '../services/profileApi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export default function Profile() {
  const { profile, isLoading, refetch } = useProfile()
  const { theme, toggleTheme } = useTheme()
  const { showToast } = useToastStore()
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', bio: '' })
  const [prefData, setPrefData] = useState({ language: 'English', timezone: 'UTC' })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [fuelVehicleId, setFuelVehicleId] = useState('')
  const [pwForm, setPwForm] = useState({ old: '', new: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name:    profile.name    || '',
        email:   profile.email   || '',
        phone:   profile.phone   || '',
        company: profile.company || '',
        bio:     profile.bio     || '',
      })
      const prefs = typeof profile.preferences === 'string'
        ? JSON.parse(profile.preferences)
        : (profile.preferences || {})
      setPrefData({
        language: prefs.language || 'English',
        timezone: prefs.timezone || 'UTC',
      })
    }
  }, [profile])

  // Load vehicles for fuel tab
  useEffect(() => {
    api.get('/vehicles').then(res => {
      const list = Array.isArray(res.data) ? res.data : res.data?.vehicles || []
      setVehicles(list)
      if (list.length > 0) setFuelVehicleId(v => v || list[0].vehicle_id)
    }).catch(() => {})
  }, [])

  // Sync tab from URL
  useEffect(() => {
    const t = searchParams.get('tab'); if (t) setActiveTab(t)
  }, [searchParams])

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    setSearchParams({ tab: id }, { replace: true })
  }

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => updateProfile(data),
    onSuccess: () => {
      showToast('Profile updated', 'success')
      setIsEditing(false)
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: () => showToast('Failed to update profile', 'error'),
  })

  const prefMutation = useMutation({
    mutationFn: (data: typeof prefData) => updatePreferences(data),
    onSuccess: () => showToast('Preferences saved', 'success'),
    onError: () => showToast('Failed to save preferences', 'error'),
  })

  const pwMutation = useMutation({
    mutationFn: () => changePassword(pwForm.old, pwForm.new),
    onSuccess: () => {
      showToast('Password changed', 'success')
      setPwForm({ old: '', new: '', confirm: '' })
      setPwError('')
    },
    onError: (err: any) => showToast(err?.response?.data?.detail || 'Failed to change password', 'error'),
  })

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Preview
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    // Upload
    setUploadingAvatar(true)
    try {
      const res = await uploadAvatar(file)
      showToast('Avatar updated', 'success')
      qc.invalidateQueries({ queryKey: ['profile'] })
    } catch {
      showToast('Failed to upload avatar', 'error')
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChangePassword = () => {
    setPwError('')
    if (!pwForm.old || !pwForm.new || !pwForm.confirm) { setPwError('All fields are required'); return }
    if (pwForm.new !== pwForm.confirm) { setPwError('New passwords do not match'); return }
    if (pwForm.new.length < 6) { setPwError('Password must be at least 6 characters'); return }
    pwMutation.mutate()
  }

  const avatarSrc = avatarPreview || (profile?.avatar_url
    ? `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}${profile.avatar_url}`
    : null)

  const tabs = [
    {
      id: 'profile', label: 'Profile',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
      content: (
        <div className="space-y-6">
          {/* Avatar + header */}
          <Card className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="w-24 h-24 rounded-full object-cover ring-2 ring-teal-500" />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {profile?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity"
                >
                  {uploadingAvatar ? '...' : 'Change'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold dark:text-white">{profile?.name || 'User'}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{profile?.email}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{profile?.role || 'Fleet Manager'}{profile?.company ? ` · ${profile.company}` : ''}</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                {uploadingAvatar ? 'Uploading…' : 'Upload Photo'}
              </button>
            </div>
          </Card>

          {/* Edit form */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold dark:text-white">Personal Information</h3>
              <button onClick={() => setIsEditing(!isEditing)} className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Full Name', key: 'name', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'tel' },
                { label: 'Company', key: 'company', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                  <input
                    type={type}
                    value={(formData as any)[key]}
                    onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-sm disabled:opacity-60"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData(f => ({ ...f, bio: e.target.value }))}
                  disabled={!isEditing}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-sm disabled:opacity-60"
                />
              </div>
              {isEditing && (
                <button
                  onClick={() => updateMutation.mutate(formData)}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              )}
            </div>
          </Card>

          {/* Account stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <p className="text-xs text-gray-400 dark:text-gray-500">Member since</p>
              <p className="text-sm font-medium dark:text-white mt-1">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-400 dark:text-gray-500">Provider</p>
              <p className="text-sm font-medium dark:text-white mt-1 capitalize">{profile?.provider || 'Email'}</p>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'preferences', label: 'Preferences',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      content: (
        <Card className="p-6 space-y-6">
          {/* Dark mode */}
          <div>
            <h3 className="text-sm font-semibold dark:text-white mb-3">Appearance</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <div>
                <p className="text-sm font-medium dark:text-white">Dark Mode</p>
                <p className="text-xs text-gray-400 mt-0.5">Switch between light and dark theme</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-teal-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Language */}
          <div>
            <h3 className="text-sm font-semibold dark:text-white mb-3">Language</h3>
            <select
              value={prefData.language}
              onChange={e => setPrefData(p => ({ ...p, language: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-sm"
            >
              {['English', 'Tamil', 'Hindi', 'Spanish', 'French', 'German'].map(l => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div>
            <h3 className="text-sm font-semibold dark:text-white mb-3">Timezone</h3>
            <select
              value={prefData.timezone}
              onChange={e => setPrefData(p => ({ ...p, timezone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-sm"
            >
              {['UTC', 'IST (UTC+5:30)', 'EST (UTC-5)', 'PST (UTC-8)', 'CST (UTC+8)', 'JST (UTC+9)'].map(tz => (
                <option key={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => prefMutation.mutate(prefData)}
            disabled={prefMutation.isPending}
            className="w-full py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50"
          >
            {prefMutation.isPending ? 'Saving…' : 'Save Preferences'}
          </button>
        </Card>
      ),
    },
    {
      id: 'settings', label: 'Settings',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
      content: <SettingsForm />,
    },
    {
      id: 'account', label: 'Account',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
      content: (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-semibold dark:text-white mb-4">Change Password</h3>
            <div className="space-y-4">
              {pwError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{pwError}</div>
              )}
              {[
                { label: 'Current Password', key: 'old' },
                { label: 'New Password', key: 'new' },
                { label: 'Confirm New Password', key: 'confirm' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                  <input
                    type="password"
                    value={(pwForm as any)[key]}
                    onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-sm"
                  />
                </div>
              ))}
              <button
                onClick={handleChangePassword}
                disabled={pwMutation.isPending}
                className="w-full py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50"
              >
                {pwMutation.isPending ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </Card>
          <Card className="p-6 border-red-100 dark:border-red-900/50">
            <h3 className="text-base font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Deleting your account is permanent and cannot be undone.</p>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Delete Account</button>
          </Card>
        </div>
      ),
    },
    {
      id: 'fuel', label: 'Fuel History',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      content: (
        <div className="space-y-4">
          {vehicles.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Vehicle:</label>
              <select
                value={fuelVehicleId}
                onChange={e => setFuelVehicleId(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-sm"
              >
                {vehicles.map((v: any) => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_id} — {v.registration}</option>
                ))}
              </select>
            </div>
          )}
          {fuelVehicleId
            ? <FuelHistoryChart vehicleId={fuelVehicleId} />
            : <Card className="p-6 text-center text-gray-400 text-sm">No vehicles found</Card>
          }
        </div>
      ),
    },
    {
      id: 'activity', label: 'Activity',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      content: <ActivityTimeline />,
    },
  ]

  if (isLoading) return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account and preferences</p>
        </div>
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  )
}
