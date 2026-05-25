import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addDays } from 'date-fns'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { defaultSettings } from '@/features/settings/defaultSettings'
import type { CalendarEvent } from '@/types/domain'
import { formatDate, toISODate, todayISODate } from '@/utils/date'

const settingsState = vi.hoisted(() => ({ current: undefined as unknown }))
const eventsState = vi.hoisted(() => ({ current: [] as CalendarEvent[] }))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      displayName: 'Cristian',
      email: 'cristian@example.com',
      photoURL: undefined,
      uid: 'user-1',
    },
  }),
}))

vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ notify: vi.fn() }),
}))

vi.mock('@/features/calendar/useEvents', () => ({
  useEvents: () => ({
    error: null,
    events: eventsState.current,
    loading: false,
  }),
}))

vi.mock('@/features/settings/useSettings', () => ({
  useSettings: () => ({
    error: null,
    loading: false,
    settings: settingsState.current,
  }),
}))

vi.mock('@/features/calendar/events.service', () => ({
  createEvent: vi.fn(),
  deleteEvent: vi.fn(),
  moveEventToDate: vi.fn(),
  updateEvent: vi.fn(),
}))

describe('CalendarPage', () => {
  beforeEach(() => {
    eventsState.current = []
    settingsState.current = {
      ...defaultSettings,
      categories: [
        ...defaultSettings.categories,
        { id: 'sport', label: 'Sport', color: '#22c55e', system: false },
      ],
    }
  })

  it('apre la creazione evento cliccando tutto il riquadro della settimana', async () => {
    const user = userEvent.setup()
    render(<CalendarPage />)

    const weekCells = screen.getAllByRole('button', { name: /Crea evento per/i })

    await user.click(weekCells[0])

    expect(screen.getByRole('dialog')).toHaveTextContent('Nuovo evento')
  })

  it('nella vista giorno le frecce avanzano di un solo giorno', async () => {
    const user = userEvent.setup()
    const today = new Date()
    render(<CalendarPage />)

    await user.click(screen.getByRole('button', { name: 'Giorno' }))
    await user.click(screen.getByRole('button', { name: 'Periodo successivo' }))

    expect(screen.getAllByText(formatDate(toISODate(addDays(today, 1))))).not.toHaveLength(0)
  })

  it('apre la creazione evento cliccando tutto il riquadro del mese', async () => {
    const user = userEvent.setup()
    render(<CalendarPage />)

    await user.click(screen.getByRole('button', { name: 'Mese' }))
    expect(screen.getAllByText('lun')).not.toHaveLength(0)
    const monthCells = screen.getAllByRole('button', { name: /Crea evento per/i })

    await user.click(monthCells[10])

    expect(screen.getByRole('dialog')).toHaveTextContent('Nuovo evento')
  })

  it('mostra le categorie personalizzate nel form evento', async () => {
    const user = userEvent.setup()
    render(<CalendarPage />)

    await user.click(screen.getByRole('button', { name: 'Nuovo evento' }))
    const dialog = screen.getByRole('dialog')

    expect(within(dialog).getByRole('option', { name: 'Sport' })).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Posizione')).toBeInTheDocument()
  })

  it('non apre la creazione evento quando si clicca sull’icona elimina', () => {
    eventsState.current = [
      {
        id: 'event-1',
        title: 'Banana',
        description: '',
        date: todayISODate(),
        startTime: '09:00',
        endTime: '10:00',
        category: 'personal',
        priority: 'medium',
        notes: '',
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      },
    ]

    render(<CalendarPage />)

    const deleteButton = screen.getByRole('button', { name: 'Elimina evento' })
    const deleteIcon = deleteButton.querySelector('svg')
    if (!deleteIcon) throw new Error('Icona elimina non trovata')

    fireEvent.click(deleteIcon)

    const dialogs = screen.getAllByRole('dialog')
    expect(dialogs).toHaveLength(1)
    expect(dialogs[0]).toHaveTextContent('Eliminare evento?')
    expect(dialogs[0]).not.toHaveTextContent('Nuovo evento')
  })
})
