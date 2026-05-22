import { z } from 'zod'
import { priorities, taskStatuses } from '@/types/domain'

export const taskSchema = z.object({
  title: z.string().trim().min(2, 'Inserisci un titolo.').max(120),
  description: z.string().trim().min(2, 'Inserisci una descrizione.').max(1000),
  status: z.enum(taskStatuses),
  priority: z.enum(priorities),
  dueAt: z.string().optional().or(z.literal('')),
  notes: z.string().trim().max(1200).optional().or(z.literal('')),
})

export type TaskFormData = z.infer<typeof taskSchema>
