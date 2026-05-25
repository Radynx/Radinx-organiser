import { addDoc, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEvent, deleteEvent, subscribeToEvents, updateEvent } from '@/features/calendar/events.service'

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn((_db, ...path: string[]) => ({ type: 'collection', path: path.join('/') })),
  deleteDoc: vi.fn(),
  deleteField: vi.fn(() => ({ type: 'deleteField' })),
  doc: vi.fn((_db, ...path: string[]) => ({ type: 'doc', path: path.join('/') })),
  onSnapshot: vi.fn(),
  updateDoc: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({
  assertFirestore: vi.fn(() => ({ name: 'db' })),
}))

const eventInput = {
  title: '  Evento importante  ',
  description: '',
  date: '2026-05-22',
  startTime: '09:00',
  endTime: '10:00',
  category: 'important' as const,
  priority: 'critical' as const,
  notes: '  Nota  ',
}

describe('events service', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('crea eventi sanitizzando input e usando path utente', async () => {
    await createEvent('user-1', { ...eventInput, category: 'sport' })

    expect(addDoc).toHaveBeenCalledWith(
      { type: 'collection', path: 'users/user-1/events' },
      expect.objectContaining({
        title: 'Evento importante',
        notes: 'Nota',
        category: 'sport',
        priority: 'critical',
      }),
    )
    expect(vi.mocked(addDoc).mock.calls[0]?.[1]).not.toHaveProperty('description')
  })

  it('modifica ed elimina eventi del solo utente', async () => {
    await updateEvent('user-1', 'event-1', eventInput)
    await deleteEvent('user-1', 'event-1')

    expect(updateDoc).toHaveBeenCalledWith(
      { type: 'doc', path: 'users/user-1/events/event-1' },
      expect.objectContaining({
        description: { type: 'deleteField' },
        title: 'Evento importante',
      }),
    )
    expect(deleteDoc).toHaveBeenCalledWith({ type: 'doc', path: 'users/user-1/events/event-1' })
  })

  it('ascolta eventi senza indice composito e ordina lato client', () => {
    const onData = vi.fn()
    const unsubscribe = vi.fn()
    vi.mocked(onSnapshot).mockImplementation(((_ref: unknown, next: (snapshot: unknown) => void) => {
      next({
        docs: [
          { id: 'b', data: () => ({ ...eventInput, date: '2026-05-24', startTime: '11:00' }) },
          { id: 'a', data: () => ({ ...eventInput, date: '2026-05-24', startTime: '09:00' }) },
          { id: 'c', data: () => ({ ...eventInput, date: '2026-05-23', startTime: '18:00' }) },
        ],
      } as never)

      return unsubscribe
    }) as never)

    const result = subscribeToEvents('user-1', onData, vi.fn())

    expect(onSnapshot).toHaveBeenCalledWith(
      { type: 'collection', path: 'users/user-1/events' },
      expect.any(Function),
      expect.any(Function),
    )
    expect(onData).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'c' }),
      expect.objectContaining({ id: 'a' }),
      expect.objectContaining({ id: 'b' }),
    ])
    expect(result).toBe(unsubscribe)
  })
})
