import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { defaultSettings } from '@/features/settings/defaultSettings'

const settingsState = vi.hoisted(() => ({ current: undefined as unknown }))

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
    events: [],
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

  it('apre la creazione evento cliccando tutto il riquadro del mese', async () => {
    const user = userEvent.setup()
    render(<CalendarPage />)

    await user.click(screen.getByRole('button', { name: 'Mese' }))
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
  })
})
