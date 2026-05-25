import { onSnapshot, setDoc } from 'firebase/firestore'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  disconnectCalendar,
  saveCalendarConnection,
  subscribeToSettings,
  saveCategorySettings,
  saveColorSettings,
  saveThemePreference,
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

  it('salva categorie calendario personalizzate', async () => {
    const categories = [
      { id: 'personal', label: 'Personale', color: '#111111', system: true },
      { id: 'sport', label: 'Sport', color: '#22c55e', system: false },
    ]

    await saveCategorySettings('user-1', categories)
    await saveCategorySettings('user-2', categories)

    expect(setDoc).toHaveBeenNthCalledWith(
      1,
      { type: 'doc', path: 'users/user-1/settings/preferences' },
      expect.objectContaining({
        categories: expect.arrayContaining([
          expect.objectContaining({ id: 'sport', label: 'Sport', color: '#22c55e' }),
        ]),
      }),
      { merge: true },
    )
    expect(setDoc).toHaveBeenNthCalledWith(
      2,
      { type: 'doc', path: 'users/user-2/settings/preferences' },
      expect.objectContaining({
        categories: expect.arrayContaining([
          expect.objectContaining({ id: 'sport', label: 'Sport', color: '#22c55e' }),
        ]),
      }),
      { merge: true },
    )
  })

  it('legge categorie salvate solo dal documento settings dell’utente richiesto', () => {
    const onData = vi.fn()
    const unsubscribe = vi.fn()

    vi.mocked(onSnapshot).mockImplementation(((_ref: unknown, next: (snapshot: unknown) => void) => {
      next({
        data: () => ({
          categories: [
            { id: 'sport', label: 'Sport', color: '#22c55e', system: false },
          ],
          updatedAt: '2026-05-25T00:00:00.000Z',
        }),
      } as never)

      return unsubscribe
    }) as never)

    const result = subscribeToSettings('user-1', onData, vi.fn())

    expect(onSnapshot).toHaveBeenCalledWith(
      { type: 'doc', path: 'users/user-1/settings/preferences' },
      expect.any(Function),
      expect.any(Function),
    )
    expect(onData).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: expect.arrayContaining([
          expect.objectContaining({ id: 'sport', label: 'Sport', color: '#22c55e' }),
        ]),
      }),
    )
    expect(result).toBe(unsubscribe)
  })

  it('salva un tema predefinito', async () => {
    await saveThemePreference('user-1', 'forest')

    expect(setDoc).toHaveBeenCalledWith(
      { type: 'doc', path: 'users/user-1/settings/preferences' },
      expect.objectContaining({ theme: 'forest' }),
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

  it('salva una connessione calendario per il singolo utente', async () => {
    await saveCalendarConnection('user-1', 'google', {
      enabled: true,
      status: 'connected',
      lastSyncAt: '2026-05-25T12:00:00.000Z',
      error: null,
    })

    expect(setDoc).toHaveBeenCalledWith(
      { type: 'doc', path: 'users/user-1/settings/preferences' },
      expect.objectContaining({
        'calendarConnections.google': expect.objectContaining({
          enabled: true,
          status: 'connected',
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
