import api from './api'

export const register = (data: {
  name: string
  email: string
  phone: string
  password: string
}) => api.post('/auth/register', data).then(r => r.data)

export const login = (data: {
  email: string
  password: string
}) => api.post('/auth/login', data).then(r => r.data)

export const sendEmailOtp = (email: string) =>
  api.post('/auth/send-email-otp', { email }).then(r => r.data)

export const verifyEmailOtp = (email: string, otp: string) =>
  api.post('/auth/verify-email', { email, otp }).then(r => r.data)

export const sendPhoneOtp = (phone: string, user_id: string) =>
  api.post('/auth/send-phone-otp', { phone, user_id }).then(r => r.data)

export const verifyPhoneOtp = (phone: string, otp: string, user_id: string) =>
  api.post('/auth/verify-phone', { phone, otp, user_id }).then(r => r.data)

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email }).then(r => r.data)

export const resetPassword = (token: string, new_password: string) =>
  api.post('/auth/reset-password', { token, new_password }).then(r => r.data)