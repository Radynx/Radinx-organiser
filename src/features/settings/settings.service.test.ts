import { setDoc } from 'firebase/firestore'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  disconnectCalendar,
  saveColorSettings,
  startCalendarConnection,
} from '@/features/settings/settings.service'

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, ...path: string[]) => ({ type: 'doc', path: path.join('/') })),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({
  assertFirestore: vi.fn(() => ({ name: 'db' })),
}))

describe('settings service', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('salva colori calendario', async () => {
    const colors = {
      personal: '#111111',
      work: '#222222',
      important: '#333333',
      completed: '#444444',
    }

    await saveColorSettings('user-1', colors)

    expect(setDoc).toHaveBeenCalledWith(
      { type: 'doc', path: 'users/user-1/settings/preferences' },
      expect.objectContaining({ colors }),
      { merge: true },
    )
  })

  it('non avvia chiamate esterne quando Google non è configurato', async () => {
    const connection = await startCalendarConnection('user-1', 'google')

    expect(connection.status).toBe('needs_configuration')
    expect(setDoc).toHaveBeenCalledWith(
      { type: 'doc', path: 'users/user-1/settings/preferences' },
      expect.objectContaining({
        'calendarConnections.google': expect.objectContaining({
          enabled: true,
          status: 'needs_configuration',
        }),
      }),
      { merge: true },
    )
  })

  it('disattiva manualmente un calendario', async () => {
    await disconnectCalendar('user-1', 'apple')

    expect(setDoc).toHaveBeenCalledWith(
      { type: 'doc', path: 'users/user-1/settings/preferences' },
      expect.objectContaining({
        'calendarConnections.apple': expect.objectContaining({
          enabled: false,
          status: 'disconnected',
        }),
      }),
      { merge: true },
    )
  })
})
