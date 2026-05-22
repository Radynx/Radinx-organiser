import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  SquareKanban,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useSettings } from '@/features/settings/useSettings'
import { toUserMessage } from '@/lib/errors'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendario', icon: CalendarDays },
  { to: '/tasks', label: 'Lavoro', icon: SquareKanban },
  { to: '/completed', label: 'Cose fatte', icon: CheckCircle2 },
  { to: '/settings', label: 'Impostazioni', icon: Settings },
]

export function AppLayout() {
  const { logout, user } = useAuth()
  const { notify } = useToast()
  const { settings } = useSettings(user?.uid)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
    return () => {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [settings.theme])

  const handleLogout = async () => {
    try {
      await logout()
      notify({ title: 'Logout effettuato', variant: 'success' })
    } catch (error) {
      notify({ title: 'Logout non riuscito', description: toUserMessage(error), variant: 'error' })
    }
  }

  return (
    <div className="app-shell">
      <aside className={clsx('sidebar', sidebarOpen && 'sidebar-open')}>
        <div className="sidebar-brand">
          <ShieldCheck size={24} aria-hidden="true" />
          <div>
            <strong>Radinx</strong>
            <span>Organiser</span>
          </div>
          <button
            aria-label="Chiudi menu"
            className="icon-button sidebar-close"
            type="button"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Navigazione principale">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                end={item.to === '/'}
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">
            {user?.photoURL ? <img src={user.photoURL} alt="" /> : user?.displayName.slice(0, 1)}
          </div>
          <div>
            <strong>{user?.displayName}</strong>
            <span>{user?.email}</span>
          </div>
        </div>
      </aside>

      <div className={clsx('sidebar-overlay', sidebarOpen && 'visible')} onClick={() => setSidebarOpen(false)} />

      <div className="main-shell">
        <header className="topbar">
          <button
            aria-label="Apri menu"
            className="icon-button mobile-menu"
            type="button"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className="topbar-title">
            <strong>Radinx Organiser</strong>
            <span>Workspace personale</span>
          </div>
          <Button variant="ghost" size="sm" icon={<LogOut size={16} />} onClick={handleLogout}>
            Logout
          </Button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
