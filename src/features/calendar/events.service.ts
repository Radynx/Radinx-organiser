import {
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { eventDocRef, eventsCollectionRef } from '@/lib/firestorePaths'
import type { CalendarEvent } from '@/types/domain'
import { normalizeOptionalText, sanitizeText } from '@/utils/sanitize'
import type { EventFormData } from '@/features/calendar/event.schemas'

const cleanEventInput = (input: EventFormData) => ({
  title: sanitizeText(input.title, 120),
  description: normalizeOptionalText(input.description, 800),
  date: input.date,
  startTime: input.startTime,
  endTime: input.endTime,
  category: input.category,
  priority: input.priority,
  notes: normalizeOptionalText(input.notes, 1200),
})

const toEvent = (id: string, data: Record<string, unknown>): CalendarEvent => ({
  id,
  title: sanitizeText(data.title, 120) || 'Evento senza titolo',
  description: normalizeOptionalText(data.description, 800),
  date: sanitizeText(data.date, 10),
  startTime: sanitizeText(data.startTime, 5),
  endTime: sanitizeText(data.endTime, 5),
  category: data.category === 'work' || data.category === 'important' || data.category === 'other'
    ? data.category
    : 'personal',
  priority:
    data.priority === 'low' ||
    data.priority === 'high' ||
    data.priority === 'critical' ||
    data.priority === 'medium'
      ? data.priority
      : 'medium',
  notes: normalizeOptionalText(data.notes, 1200),
  createdAt: sanitizeText(data.createdAt, 40) || new Date().toISOString(),
  updatedAt: sanitizeText(data.updatedAt, 40) || new Date().toISOString(),
})

export const subscribeToEvents = (
  userId: string,
  onData: (events: CalendarEvent[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const eventsQuery = query(eventsCollectionRef(userId), orderBy('date', 'asc'), orderBy('startTime', 'asc'))

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      onData(snapshot.docs.map((document) => toEvent(document.id, document.data())))
    },
    (error) => onError(error),
  )
}

export const createEvent = async (userId: string, input: EventFormData) => {
  const now = new Date().toISOString()
  await addDoc(eventsCollectionRef(userId), {
    ...cleanEventInput(input),
    createdAt: now,
    updatedAt: now,
  })
}

export const updateEvent = async (userId: string, eventId: string, input: EventFormData) => {
  await updateDoc(eventDocRef(userId, eventId), {
    ...cleanEventInput(input),
    updatedAt: new Date().toISOString(),
  })
}

export const moveEventToDate = async (userId: string, eventId: string, date: string) => {
  await updateDoc(eventDocRef(userId, eventId), {
    date,
    updatedAt: new Date().toISOString(),
  })
}

export const deleteEvent = async (userId: string, eventId: string) => {
  await deleteDoc(eventDocRef(userId, eventId))
}
