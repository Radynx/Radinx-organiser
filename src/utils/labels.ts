import type { CalendarConnectionStatus, EventCategory, Priority, TaskStatus } from '@/types/domain'

export const priorityLabels: Record<Priority, string> = {
  low: 'Bassa',
  medium: 'Media',
  high: 'Alta',
  critical: 'Critica',
}

export const priorityTone: Record<Priority, 'neutral' | 'blue' | 'green' | 'red' | 'amber' | 'violet'> = {
  low: 'green',
  medium: 'blue',
  high: 'amber',
  critical: 'red',
}

export const categoryLabels: Record<EventCategory, string> = {
  personal: 'Personale',
  work: 'Lavoro',
  important: 'Importante',
  other: 'Altro',
}

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: 'Da fare',
  'in-progress': 'In corso',
  completed: 'Completata',
}

export const connectionStatusLabels: Record<CalendarConnectionStatus, string> = {
  disconnected: 'Disconnesso',
  needs_configuration: 'Da configurare',
  ready_for_oauth: 'Pronto per OAuth',
  connected: 'Connesso',
  error: 'Errore',
}
