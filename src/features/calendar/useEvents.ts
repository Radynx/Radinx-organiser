import { useEffect, useState } from 'react'
import { toUserMessage } from '@/lib/errors'
import type { CalendarEvent } from '@/types/domain'
import { subscribeToEvents } from '@/features/calendar/events.service'

export function useEvents(userId?: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setEvents([])
      setLoading(false)
      return undefined
    }

    setLoading(true)
    return subscribeToEvents(
      userId,
      (nextEvents) => {
        setEvents(nextEvents)
        setError(null)
        setLoading(false)
      },
      (snapshotError) => {
        setError(toUserMessage(snapshotError))
        setLoading(false)
      },
    )
  }, [userId])

  return { error, events, loading }
}
