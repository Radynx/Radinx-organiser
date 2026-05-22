import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'Usa almeno 8 caratteri.')
  .regex(/[A-Z]/, 'Aggiungi almeno una lettera maiuscola.')
  .regex(/[0-9]/, 'Aggiungi almeno un numero.')

export const loginSchema = z.object({
  email: z.string().trim().email('Inserisci una email valida.'),
  password: z.string().min(1, 'Inserisci la password.'),
})

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Inserisci almeno 2 caratteri.').max(80),
    email: z.string().trim().email('Inserisci una email valida.'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non coincidono.',
    path: ['confirmPassword'],
  })

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Inserisci una email valida.'),
})

export const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non coincidono.',
    path: ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type PasswordUpdateFormData = z.infer<typeof passwordUpdateSchema>
