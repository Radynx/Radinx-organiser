import { describe, expect, it } from 'vitest'
import { eventSchema } from '@/features/calendar/event.schemas'

describe('eventSchema', () => {
  it('accetta un evento valido', () => {
    const result = eventSchema.safeParse({
      title: 'Riunione',
      description: '',
      location: 'Sala 2',
      date: '2026-05-22',
      startTime: '09:00',
      endTime: '10:00',
      category: 'work',
      priority: 'high',
      notes: '',
    })

    expect(result.success).toBe(true)
  })

  it('rifiuta orario fine precedente o uguale', () => {
    const result = eventSchema.safeParse({
      title: 'Riunione',
      date: '2026-05-22',
      startTime: '10:00',
      endTime: '09:00',
      category: 'work',
      priority: 'high',
    })

    expect(result.success).toBe(false)
  })
})
