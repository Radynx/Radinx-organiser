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
      createdAt: '2026-05-20T08:15:00',
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
          <Route path="tasks" element={<div>Tasks view</div>} />
          <Route path="completed" element={<div>Completed view</div>} />
          <Route path="settings" element={<div>Settings view</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppLayout', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    logoutMock.mockResolvedValue(undefined)
    notifyMock.mockClear()
  })

  it('naviga tra le sezioni private dal menu laterale', async () => {
    const user = userEvent.setup()
    renderLayout()

    expect(screen.getByText('Dashboard view')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Calendario' }))

    expect(screen.getByText('Calendar view')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Lavoro' })).toHaveAttribute('aria-expanded', 'false')
    await user.click(screen.getByRole('button', { name: 'Lavoro' }))

    await user.click(screen.getByRole('link', { name: 'Cose da fare' }))

    expect(screen.getByText('Tasks view')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Cose fatte' }))

    expect(screen.getByText('Completed view')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Impostazioni' })).toHaveAttribute('aria-expanded', 'false')
    await user.click(screen.getByRole('button', { name: 'Impostazioni' }))

    await user.click(screen.getByRole('link', { name: 'Account' }))

    expect(screen.getByText('Settings view')).toBeInTheDocument()
  })

  it('apre e chiude il gruppo lavoro nella sidebar partendo compresso', async () => {
    const user = userEvent.setup()
    renderLayout()

    expect(screen.getByRole('button', { name: 'Lavoro' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'Cose da fare' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Cose fatte' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Lavoro' }))

    expect(screen.getByRole('button', { name: 'Lavoro' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Cose da fare' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cose fatte' })).toBeInTheDocument()
  })

  it('apre e chiude il gruppo impostazioni nella sidebar partendo compresso', async () => {
    const user = userEvent.setup()
    renderLayout()

    expect(screen.getByRole('button', { name: 'Impostazioni' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'Organizer' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Aspetto' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Account' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Integrazioni' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Impostazioni' }))

    expect(screen.getByRole('button', { name: 'Impostazioni' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Organizer' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Aspetto' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Integrazioni' })).toBeInTheDocument()
  })

  it('minimizza il menu laterale mantenendo accessibili le sezioni', async () => {
    const user = userEvent.setup()
    const { container } = renderLayout()

    await user.click(screen.getByRole('button', { name: 'Minimizza menu' }))

    expect(container.querySelector('.app-shell')).toHaveClass('sidebar-collapsed')
    expect(window.localStorage.getItem('radinx-sidebar-collapsed')).toBe('true')
    expect(screen.getByRole('link', { name: 'Calendario' })).toHaveAttribute('title', 'Calendario')
    expect(screen.getByRole('button', { name: 'Lavoro' })).toHaveAttribute('title', 'Lavoro')
    expect(screen.queryByRole('link', { name: 'Cose da fare' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Impostazioni' })).toHaveAttribute('title', 'Impostazioni')
    expect(screen.queryByRole('link', { name: 'Account' })).not.toBeInTheDocument()
  })

  it('mostra la data creazione account nel profilo', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: /Codex User/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Visualizza profilo' }))

    expect(screen.getByRole('dialog')).toHaveTextContent('Account creato')
    expect(screen.getByRole('dialog')).toHaveTextContent('20/05/2026 08:15')
  })

  it('apre il menu profilo e fa logout con redirect al login', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: /Codex User/ }))

    expect(screen.queryByText('codex@example.com')).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Visualizza profilo' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Impostazioni account' })).toBeInTheDocument()

    await user.click(screen.getByRole('menuitem', { name: 'Logout' }))

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1))
    expect(screen.getByText('Login view')).toBeInTheDocument()
  })
})
