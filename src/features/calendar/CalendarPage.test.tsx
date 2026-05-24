import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { defaultSettings } from '@/features/settings/defaultSettings'

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
    settings: defaultSettings,
  }),
}))

vi.mock('@/features/calendar/events.service', () => ({
  createEvent: vi.fn(),
  deleteEvent: vi.fn(),
  moveEventToDate: vi.fn(),
  updateEvent: vi.fn(),
}))

describe('CalendarPage', () => {
  it('apre la creazione evento cliccando tutto il riquadro del mese', async () => {
    const user = userEvent.setup()
    render(<CalendarPage />)

    await user.click(screen.getByRole('button', { name: 'Mese' }))
    const monthCells = screen.getAllByRole('button', { name: /Crea evento per/i })

    await user.click(monthCells[10])

    expect(screen.getByRole('dialog')).toHaveTextContent('Nuovo evento')
  })
})
