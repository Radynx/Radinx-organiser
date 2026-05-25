import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthShell } from '@/features/auth/AuthShell'

vi.mock('@/components/FirebaseConfigNotice', () => ({
  FirebaseConfigNotice: () => null,
}))

describe('AuthShell', () => {
  afterEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('permette di cambiare modalità giorno e notte nelle schermate auth', async () => {
    const user = userEvent.setup()

    render(
      <AuthShell title="Login" subtitle="Accesso">
        <div>Form auth</div>
      </AuthShell>,
    )

    await user.click(screen.getByRole('button', { name: 'Usa modalità notte' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem('radinx-auth-theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Usa modalità notte' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Usa modalità giorno' }))

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(window.localStorage.getItem('radinx-auth-theme')).toBe('light')
  })
})
