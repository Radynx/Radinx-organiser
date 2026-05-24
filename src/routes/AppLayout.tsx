import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  SquareKanban,
  UserRound,
} from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
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
  const navigate = useNavigate()
  const location = useLocation()
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const storedPreference = window.localStorage.getItem('radinx-sidebar-collapsed')
    setSidebarCollapsed(storedPreference === 'true')
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [location.pathname])

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
    return () => {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [settings.theme])

  useEffect(() => {
    if (!profileMenuOpen) return undefined

    const handlePointerDown = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileMenuOpen])

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logout()
      setProfileMenuOpen(false)
      notify({ title: 'Logout effettuato', variant: 'success' })
      navigate('/login', { replace: true })
    } catch (error) {
      notify({ title: 'Logout non riuscito', description: toUserMessage(error), variant: 'error' })
    } finally {
      setLoggingOut(false)
    }
  }

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((current) => {
      const next = !current
      window.localStorage.setItem('radinx-sidebar-collapsed', String(next))
      return next
    })
    setProfileMenuOpen(false)
  }

  return (
    <div className={clsx('app-shell', sidebarCollapsed && 'sidebar-collapsed')}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <ShieldCheck size={24} aria-hidden="true" />
          <div>
            <strong>Radinx</strong>
            <span>Organiser</span>
          </div>
          <button
            aria-label={sidebarCollapsed ? 'Espandi menu' : 'Minimizza menu'}
            className="icon-button sidebar-collapse"
            type="button"
            onClick={toggleSidebarCollapsed}
          >
            {sidebarCollapsed ? (
              <ChevronsRight size={18} aria-hidden="true" />
            ) : (
              <ChevronsLeft size={18} aria-hidden="true" />
            )}
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
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-user-menu" ref={profileMenuRef}>
          <button
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
            className="sidebar-user"
            type="button"
            onClick={() => setProfileMenuOpen((open) => !open)}
          >
            <div className="avatar">
              {user?.photoURL ? <img src={user.photoURL} alt="" /> : user?.displayName.slice(0, 1)}
            </div>
            <div>
              <strong>{user?.displayName ?? 'Utente Radinx'}</strong>
            </div>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          {profileMenuOpen ? (
            <div className="profile-menu" role="menu">
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setProfileModalOpen(true)
                  setProfileMenuOpen(false)
                }}
              >
                <UserRound size={16} aria-hidden="true" />
                <span>Visualizza profilo</span>
              </button>
              <Link role="menuitem" to="/settings" onClick={() => setProfileMenuOpen(false)}>
                <Settings size={16} aria-hidden="true" />
                <span>Impostazioni account</span>
              </Link>
              <button role="menuitem" type="button" disabled={loggingOut} onClick={handleLogout}>
                <LogOut size={16} aria-hidden="true" />
                <span>{loggingOut ? 'Logout...' : 'Logout'}</span>
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-title">
            <strong>Radinx Organiser</strong>
            <span>Workspace personale</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<LogOut size={16} />}
            loading={loggingOut}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
      <Modal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Profilo"
        description="Dati dell'account attualmente autenticato."
      >
        <div className="profile-summary">
          <div className="avatar large">
            {user?.photoURL ? <img src={user.photoURL} alt="" /> : user?.displayName.slice(0, 1)}
          </div>
          <dl>
            <div>
              <dt>Nome</dt>
              <dd>{user?.displayName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
          </dl>
        </div>
        <footer className="modal-actions">
          <Button variant="secondary" onClick={() => setProfileModalOpen(false)}>
            Chiudi
          </Button>
          <Button
            icon={<Settings size={16} />}
            onClick={() => {
              setProfileModalOpen(false)
              navigate('/settings')
            }}
          >
            Impostazioni account
          </Button>
        </footer>
      </Modal>
    </div>
  )
}
