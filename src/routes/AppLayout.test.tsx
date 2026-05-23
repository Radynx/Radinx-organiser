import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppLayout } from '@/routes/AppLayout'
import { defaultSettings } from '@/features/settings/defaultSettings'

const logoutMock = vi.fn()
const notifyMock = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    logout: logoutMock,
    user: {
      displayName: 'Codex User',
      email: 'codex@example.com',
      photoURL: undefined,
      uid: 'user-1',
    },
  }),
}))

vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ notify: notifyMock }),
}))

vi.mock('@/features/settings/useSettings', () => ({
  useSettings: () => ({ settings: defaultSettings }),
}))

function renderLayout(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login view</div>} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<div>Dashboard view</div>} />
          <Route path="calendar" element={<div>Calendar view</div>} />
          <Route path="settings" element={<div>Settings view</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppLayout', () => {
  beforeEach(() => {
    logoutMock.mockResolvedValue(undefined)
    notifyMock.mockClear()
  })

  it('naviga tra le sezioni private dal menu laterale', async () => {
    const user = userEvent.setup()
    renderLayout()

    expect(screen.getByText('Dashboard view')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Calendario' }))

    expect(screen.getByText('Calendar view')).toBeInTheDocument()
  })

  it('apre il menu profilo e fa logout con redirect al login', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: /Codex User/ }))

    expect(screen.getByRole('menuitem', { name: 'Visualizza profilo' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Impostazioni account' })).toBeInTheDocument()

    await user.click(screen.getByRole('menuitem', { name: 'Logout' }))

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1))
    expect(screen.getByText('Login view')).toBeInTheDocument()
  })
})
