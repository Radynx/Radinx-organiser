import type { UserSettings } from '@/types/domain'

export const defaultSettings: UserSettings = {
  colors: {
    personal: '#2563eb',
    work: '#16a34a',
    important: '#dc2626',
    completed: '#7c3aed',
  },
  theme: 'system',
  calendarConnections: {
    google: {
      enabled: false,
      status: 'disconnected',
    },
    apple: {
      enabled: false,
      status: 'disconnected',
    },
  },
  updatedAt: new Date(0).toISOString(),
}
