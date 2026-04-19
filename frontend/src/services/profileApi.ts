import api from './api'
import { User } from '../store/user'

export const getProfile = () => api.get<User>('/profile/me').then((res) => res.data)

export const updateProfile = (data: Partial<User>) =>
  api.patch('/profile/me', data).then((res) => res.data)

export const updatePreferences = (data: any) =>
  api.patch('/profile/preferences', data).then((res) => res.data)

export const uploadAvatar = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data)
}

export const getActivity = (limit: number = 50) =>
  api.get('/profile/activity', { params: { limit } }).then((res) => res.data)

export const changePassword = (oldPassword: string, newPassword: string) =>
  api.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword }).then(
    (res) => res.data,
  )
