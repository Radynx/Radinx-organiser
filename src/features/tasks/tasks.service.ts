import {
  addDoc,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { assertFirestore } from '@/lib/firebase'
import {
  completedTaskDocRef,
  completedTasksCollectionRef,
  taskDocRef,
  tasksCollectionRef,
} from '@/lib/firestorePaths'
import type { CompletedTask, WorkTask } from '@/types/domain'
import { normalizeOptionalText, sanitizeText, withoutUndefinedFields } from '@/utils/sanitize'
import type { TaskFormData } from '@/features/tasks/task.schemas'

const cleanTaskInput = (input: TaskFormData, deleteEmptyFields = false) =>
  withoutUndefinedFields({
    title: sanitizeText(input.title, 120),
    description: sanitizeText(input.description, 1000),
    status: input.status,
    priority: input.priority,
    dueAt: normalizeOptionalText(input.dueAt, 40) ?? (deleteEmptyFields ? deleteField() : undefined),
    notes: normalizeOptionalText(input.notes, 1200) ?? (deleteEmptyFields ? deleteField() : undefined),
  })

const normalizePriority = (priority: unknown): WorkTask['priority'] => {
  if (priority === 'low' || priority === 'medium' || priority === 'high' || priority === 'critical') {
    return priority
  }

  return 'medium'
}

const toTask = (id: string, data: Record<string, unknown>): WorkTask => ({
  id,
  title: sanitizeText(data.title, 120) || 'Task senza titolo',
  description: sanitizeText(data.description, 1000),
  createdAt: sanitizeText(data.createdAt, 40) || new Date().toISOString(),
  status:
    data.status === 'in-progress' || data.status === 'completed' || data.status === 'todo'
      ? data.status
      : 'todo',
  priority: normalizePriority(data.priority),
  dueAt: normalizeOptionalText(data.dueAt, 40),
  notes: normalizeOptionalText(data.notes, 1200),
  updatedAt: sanitizeText(data.updatedAt, 40) || new Date().toISOString(),
})

const toCompletedTask = (id: string, data: Record<string, unknown>): CompletedTask => ({
  ...toTask(id, data),
  status: 'completed',
  completedAt: sanitizeText(data.completedAt, 40) || new Date().toISOString(),
  elapsedMinutes: Number(data.elapsedMinutes ?? 0),
})

export const subscribeToTasks = (
  userId: string,
  onData: (tasks: WorkTask[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const tasksQuery = query(tasksCollectionRef(userId), orderBy('createdAt', 'desc'))

  return onSnapshot(
    tasksQuery,
    (snapshot) => {
      onData(snapshot.docs.map((document) => toTask(document.id, document.data())))
    },
    (error) => onError(error),
  )
}

export const subscribeToCompletedTasks = (
  userId: string,
  onData: (tasks: CompletedTask[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const completedQuery = query(completedTasksCollectionRef(userId), orderBy('completedAt', 'desc'))

  return onSnapshot(
    completedQuery,
    (snapshot) => {
      onData(snapshot.docs.map((document) => toCompletedTask(document.id, document.data())))
    },
    (error) => onError(error),
  )
}

export const createTask = async (userId: string, input: TaskFormData) => {
  const now = new Date().toISOString()
  await addDoc(tasksCollectionRef(userId), {
    ...cleanTaskInput(input),
    status: input.status === 'completed' ? 'todo' : input.status,
    createdAt: now,
    updatedAt: now,
  })
}

export const updateTask = async (userId: string, taskId: string, input: TaskFormData) => {
  await updateDoc(taskDocRef(userId, taskId), {
    ...cleanTaskInput(input, true),
    status: input.status === 'completed' ? 'todo' : input.status,
    updatedAt: new Date().toISOString(),
  })
}

export const updateTaskStatus = async (userId: string, taskId: string, status: WorkTask['status']) => {
  await updateDoc(taskDocRef(userId, taskId), {
    status: status === 'completed' ? 'in-progress' : status,
    updatedAt: new Date().toISOString(),
  })
}

export const completeTask = async (userId: string, task: WorkTask) => {
  const now = new Date().toISOString()
  const completedAt = new Date(now)
  const createdAt = new Date(task.createdAt)
  const elapsedMinutes = Math.max(0, Math.round((completedAt.getTime() - createdAt.getTime()) / 60000))
  const batch = writeBatch(assertFirestore())
  const completedRef = doc(completedTasksCollectionRef(userId), task.id)

  batch.set(completedRef, withoutUndefinedFields({
    ...task,
    status: 'completed',
    completedAt: now,
    elapsedMinutes,
    updatedAt: now,
  }))
  batch.delete(taskDocRef(userId, task.id))
  await batch.commit()
}

export const restoreCompletedTask = async (userId: string, task: CompletedTask) => {
  const batch = writeBatch(assertFirestore())
  batch.set(taskDocRef(userId, task.id), withoutUndefinedFields({
    title: task.title,
    description: task.description,
    createdAt: task.createdAt,
    status: 'todo',
    priority: task.priority,
    dueAt: task.dueAt,
    notes: task.notes,
    updatedAt: new Date().toISOString(),
  }))
  batch.delete(completedTaskDocRef(userId, task.id))
  await batch.commit()
}

export const deleteTask = async (userId: string, taskId: string) => {
  await deleteDoc(taskDocRef(userId, taskId))
}

export const deleteCompletedTask = async (userId: string, taskId: string) => {
  await deleteDoc(completedTaskDocRef(userId, taskId))
}
