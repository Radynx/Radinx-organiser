export const priorities = ['low', 'medium', 'high', 'critical'] as const
export const eventCategories = ['personal', 'work', 'important', 'birthdays', 'other'] as const
export const taskStatuses = ['todo', 'in-progress', 'completed'] as const
export const calendarProviders = ['google', 'apple'] as const
export const themePreferences = ['system', 'light', 'dark', 'midnight', 'forest', 'rose'] as const

export type Priority = (typeof priorities)[number]
export type EventCategory = string
export type TaskStatus = (typeof taskStatuses)[number]
export type CalendarProvider = (typeof calendarProviders)[number]

export type CalendarView = 'day' | 'week' | 'month'
export type ThemePreference = (typeof themePreferences)[number]
export type CalendarConnectionStatus =
  | 'disconnected'
  | 'needs_configuration'
  | 'ready_for_oauth'
  | 'connected'
  | 'error'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  date: string
  startTime: string
  endTime: string
  category: EventCategory
  priority: Priority
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CalendarCategory {
  id: string
  label: string
  color: string
  system?: boolean
}

export interface WorkTask {
  id: string
  title: string
  description: string
  createdAt: string
  status: TaskStatus
  priority: Priority
  dueAt?: string
  notes?: string
  updatedAt: string
}

export interface CompletedTask extends Omit<WorkTask, 'status'> {
  status: 'completed'
  completedAt: string
  elapsedMinutes: number
}

export interface CalendarConnection {
  enabled: boolean
  status: CalendarConnectionStatus
  lastSyncAt?: string | null
  error?: string | null
}

export interface CalendarColors {
  personal: string
  work: string
  important: string
  completed: string
}

export interface UserSettings {
  colors: CalendarColors
  categories: CalendarCategory[]
  theme: ThemePreference
  calendarConnections: Record<CalendarProvider, CalendarConnection>
  updatedAt: string
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  birthday?: string | null
  photoURL: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthUser {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  createdAt?: string
  birthday?: string
}
