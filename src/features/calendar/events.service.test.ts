import { addDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEvent, deleteEvent, updateEvent } from '@/features/calendar/events.service'

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn((_db, ...path: string[]) => ({ type: 'collection', path: path.join('/') })),
  deleteDoc: vi.fn(),
  doc: vi.fn((_db, ...path: string[]) => ({ type: 'doc', path: path.join('/') })),
  onSnapshot: vi.fn(),
  orderBy: vi.fn((field: string, direction: string) => ({ field, direction })),
  query: vi.fn((...parts) => ({ parts })),
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
    await createEvent('user-1', eventInput)

    expect(addDoc).toHaveBeenCalledWith(
      { type: 'collection', path: 'users/user-1/events' },
      expect.objectContaining({
        title: 'Evento importante',
        notes: 'Nota',
        category: 'important',
        priority: 'critical',
      }),
    )
  })

  it('modifica ed elimina eventi del solo utente', async () => {
    await updateEvent('user-1', 'event-1', eventInput)
    await deleteEvent('user-1', 'event-1')

    expect(updateDoc).toHaveBeenCalledWith(
      { type: 'doc', path: 'users/user-1/events/event-1' },
      expect.objectContaining({ title: 'Evento importante' }),
    )
    expect(deleteDoc).toHaveBeenCalledWith({ type: 'doc', path: 'users/user-1/events/event-1' })
  })
})
