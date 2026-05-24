import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema, resetPasswordSchema } from '@/features/auth/auth.schemas'

describe('auth schemas', () => {
  it('valida registrazione con password sicura', () => {
    const result = registerSchema.safeParse({
      displayName: 'Radynx',
      email: 'radynx@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    })

    expect(result.success).toBe(true)
  })

  it('rifiuta password deboli e conferme diverse', () => {
    const result = registerSchema.safeParse({
      displayName: 'R',
      email: 'bad-email',
      password: 'weak',
      confirmPassword: 'different',
    })

    expect(result.success).toBe(false)
  })

  it('valida login e recupero password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'secret' }).success).toBe(true)
    expect(resetPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true)
    expect(resetPasswordSchema.safeParse({ email: 'not-email' }).success).toBe(false)
  })
})
