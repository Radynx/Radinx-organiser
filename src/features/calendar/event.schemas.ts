import { z } from 'zod'
import { eventCategories, priorities } from '@/types/domain'

export const eventSchema = z
  .object({
    title: z.string().trim().min(2, 'Inserisci un titolo.').max(120),
    description: z.string().trim().max(800).optional().or(z.literal('')),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Inserisci una data valida.'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Inserisci un orario valido.'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Inserisci un orario valido.'),
    category: z.enum(eventCategories),
    priority: z.enum(priorities),
    notes: z.string().trim().max(1200).optional().or(z.literal('')),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'L’orario di fine deve essere successivo all’inizio.',
    path: ['endTime'],
  })

export type EventFormData = z.infer<typeof eventSchema>
