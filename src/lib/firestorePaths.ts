import { collection, doc } from 'firebase/firestore'
import { assertFirestore } from '@/lib/firebase'

export const userDocRef = (userId: string) => doc(assertFirestore(), 'users', userId)

export const userSettingsRef = (userId: string) =>
  doc(assertFirestore(), 'users', userId, 'settings', 'preferences')

export const eventsCollectionRef = (userId: string) =>
  collection(assertFirestore(), 'users', userId, 'events')

export const eventDocRef = (userId: string, eventId: string) =>
  doc(assertFirestore(), 'users', userId, 'events', eventId)

export const tasksCollectionRef = (userId: string) =>
  collection(assertFirestore(), 'users', userId, 'tasks')

export const taskDocRef = (userId: string, taskId: string) =>
  doc(assertFirestore(), 'users', userId, 'tasks', taskId)

export const completedTasksCollectionRef = (userId: string) =>
  collection(assertFirestore(), 'users', userId, 'completedTasks')

export const completedTaskDocRef = (userId: string, taskId: string) =>
  doc(assertFirestore(), 'users', userId, 'completedTasks', taskId)
