import { create } from 'zustand'

export interface User {
  user_id: string
  name: string
  email: string
  phone: string
  company?: string
  role?: string
  avatar_url?: string
  bio?: string
  timezone?: string
  preferences?: {
    theme?: string
    language?: string
    notification_frequency?: string
  }
  created_at?: string
  last_login?: string
  email_verified?: boolean
  phone_verified?: boolean
  provider?: string
}

interface UserStore {
  user: User | null
  setUser: (user: User | null) => void
  updateProfile: (updates: Partial<User>) => void
  updatePreferences: (prefs: any) => void
  clearUser: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: false,

  setUser: (user) =>
    set({
      user: user ? { ...user } : null,
      isLoading: false,
    }),

  updateProfile: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  updatePreferences: (prefs) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            preferences: { ...state.user.preferences, ...prefs },
          }
        : null,
    })),

  clearUser: () =>
    set({
      user: null,
    }),

  setIsLoading: (loading) => set({ isLoading: loading }),
}))
