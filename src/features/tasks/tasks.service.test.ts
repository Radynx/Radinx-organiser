import { addDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  completeTask,
  createTask,
  deleteTask,
  updateTask,
} from '@/features/tasks/tasks.service'
import type { WorkTask } from '@/types/domain'

const batch = {
  commit: vi.fn(),
  delete: vi.fn(),
  set: vi.fn(),
}

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn((_db, ...path: string[]) => ({ type: 'collection', path: path.join('/') })),
  deleteDoc: vi.fn(),
  doc: vi.fn((base: { path?: string }, ...path: string[]) => ({
    type: 'doc',
    path: [base.path, ...path].filter(Boolean).join('/'),
  })),
  onSnapshot: vi.fn(),
  orderBy: vi.fn((field: string, direction: string) => ({ field, direction })),
  query: vi.fn((...parts) => ({ parts })),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(() => batch),
}))

vi.mock('@/lib/firebase', () => ({
  assertFirestore: vi.fn(() => ({ name: 'db' })),
}))

const taskInput = {
  title: '  Task lavoro  ',
  description: '  Preparare report  ',
  status: 'in-progress' as const,
  priority: 'high' as const,
  dueAt: '2026-05-22T17:00',
  notes: '',
}

describe('tasks service', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('crea e aggiorna task aperte', async () => {
    await createTask('user-1', taskInput)
    await updateTask('user-1', 'task-1', taskInput)

    expect(addDoc).toHaveBeenCalledWith(
      { type: 'collection', path: 'users/user-1/tasks' },
      expect.objectContaining({ title: 'Task lavoro', status: 'in-progress' }),
    )
    expect(updateDoc).toHaveBeenCalledWith(
      { type: 'doc', path: 'users/user-1/tasks/task-1' },
      expect.objectContaining({ description: 'Preparare report' }),
    )
  })

  it('sposta una task completata nello storico preservando creazione', async () => {
    const task: WorkTask = {
      id: 'task-1',
      title: 'Task lavoro',
      description: 'Preparare report',
      createdAt: '2026-05-22T10:00:00.000Z',
      status: 'in-progress',
      priority: 'high',
      updatedAt: '2026-05-22T10:00:00.000Z',
    }

    await completeTask('user-1', task)

    expect(writeBatch).toHaveBeenCalled()
    expect(batch.set).toHaveBeenCalledWith(
      { type: 'doc', path: 'users/user-1/completedTasks/task-1' },
      expect.objectContaining({
        createdAt: task.createdAt,
        status: 'completed',
        title: task.title,
      }),
    )
    expect(batch.delete).toHaveBeenCalledWith({ type: 'doc', path: 'users/user-1/tasks/task-1' })
    expect(batch.commit).toHaveBeenCalled()
  })

  it('elimina task aperte nel path utente', async () => {
    await deleteTask('user-1', 'task-1')

    expect(deleteDoc).toHaveBeenCalledWith({ type: 'doc', path: 'users/user-1/tasks/task-1' })
  })
})
