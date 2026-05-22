import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

function renderPrivateRoute() {
  render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route
          path="/private"
          element={
            <ProtectedRoute>
              <div>Area privata</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('nega accesso agli utenti non autenticati', () => {
    vi.mocked(useAuth).mockReturnValue({ loading: false, user: null } as never)

    renderPrivateRoute()

    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('mostra il contenuto agli utenti autenticati', () => {
    vi.mocked(useAuth).mockReturnValue({
      loading: false,
      user: {
        uid: 'user-1',
        email: 'user@example.com',
        displayName: 'User',
      },
    } as never)

    renderPrivateRoute()

    expect(screen.getByText('Area privata')).toBeInTheDocument()
  })
})
