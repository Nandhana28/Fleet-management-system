import { create } from 'zustand'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

export interface LogEntry {
  id: string
  message: string
  type: 'success' | 'info' | 'warning' | 'alert'
  timestamp: string
  vehicle_id?: string
  read: boolean
}

interface ToastStore {
  toasts: Toast[]
  logs: LogEntry[]
  showToast: (message: string, type?: 'success' | 'error') => void
  removeToast: (id: number) => void
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp' | 'read'>) => void
  clearLogs: () => void
  markAllRead: () => void
  exportLogs: () => void
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  logs: [],

  showToast: (message, type = 'success') => {
    const id = Date.now()
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, 4000)
  },

  removeToast: (id) =>
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  addLog: (entry) => {
    const logEntry: LogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    set(s => ({
      logs: [logEntry, ...s.logs].slice(0, 200), // keep last 200
    }))
  },

  clearLogs: () => set({ logs: [] }),

  markAllRead: () =>
    set(s => ({ logs: s.logs.map(l => ({ ...l, read: true })) })),

  exportLogs: () => {
    const { logs } = get()
    const lines = [
      'FleetPulse Session Log',
      `Exported: ${new Date().toLocaleString()}`,
      '─'.repeat(60),
      '',
      ...logs.map(l =>
        `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.type.toUpperCase().padEnd(7)}] ${l.message}`
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `fleetpulse-log-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  },
}))