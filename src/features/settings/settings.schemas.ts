import { z } from 'zod'

export const colorSettingsSchema = z.object({
  personal: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Colore non valido.'),
  work: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Colore non valido.'),
  important: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Colore non valido.'),
  completed: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Colore non valido.'),
})

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Inserisci almeno 2 caratteri.').max(80),
  email: z.string().trim().email('Inserisci una email valida.'),
})

export type ColorSettingsFormData = z.infer<typeof colorSettingsSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
