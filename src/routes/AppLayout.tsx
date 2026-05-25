import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Palette,
  PlugZap,
  Settings,
  ShieldCheck,
  SquareKanban,
  Tags,
  UserRound,
} from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useSettings } from '@/features/settings/useSettings'
import { toUserMessage } from '@/lib/errors'
import { formatDateTime } from '@/utils/date'

const primaryNavItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendario', icon: CalendarDays },
]

const workNavItems = [
  { to: '/tasks', label: 'Cose da fare', icon: ListTodo },
  { to: '/completed', label: 'Cose fatte', icon: CheckCircle2 },
]

const settingsNavItems = [
  { to: '/settings#settings-organizer', hash: '#settings-organizer', label: 'Organizer', icon: Tags },
  { to: '/settings#settings-appearance', hash: '#settings-appearance', label: 'Aspetto', icon: Palette },
  { to: '/settings#settings-account', hash: '#settings-account', label: 'Account', icon: UserRound },
  { to: '/settings#settings-integrations', hash: '#settings-integrations', label: 'Integrazioni', icon: PlugZap },
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
  const [workMenuOpen, setWorkMenuOpen] = useState(false)
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const settingsMenuActive = location.pathname === '/settings'
  const currentSettingsHash = settingsMenuActive ? location.hash || '#settings-organizer' : ''

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
            <strong>Radynx</strong>
            <span>Organizer</span>
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
          {primaryNavItems.map((item) => {
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
          <section className="sidebar-nav-section" aria-labelledby="sidebar-work-title">
            <button
              aria-controls="sidebar-work-nav"
              aria-expanded={workMenuOpen}
              aria-label="Lavoro"
              className="sidebar-nav-section-toggle"
              type="button"
              title={sidebarCollapsed ? 'Lavoro' : undefined}
              onClick={() => setWorkMenuOpen((open) => !open)}
            >
              <SquareKanban size={18} aria-hidden="true" />
              <span id="sidebar-work-title">Lavoro</span>
              <ChevronDown className="sidebar-section-chevron" size={16} aria-hidden="true" />
            </button>
            {workMenuOpen ? (
              <div className="sidebar-subnav" id="sidebar-work-nav">
                {workNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink key={item.to} to={item.to} title={sidebarCollapsed ? item.label : undefined}>
                      <Icon size={18} aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            ) : null}
          </section>
          <section className="sidebar-nav-section" aria-labelledby="sidebar-settings-title">
            <button
              aria-controls="sidebar-settings-nav"
              aria-expanded={settingsMenuOpen}
              aria-label="Impostazioni"
              className={clsx('sidebar-nav-section-toggle', settingsMenuActive && 'active')}
              type="button"
              title={sidebarCollapsed ? 'Impostazioni' : undefined}
              onClick={() => setSettingsMenuOpen((open) => !open)}
            >
              <Settings size={18} aria-hidden="true" />
              <span id="sidebar-settings-title">Impostazioni</span>
              <ChevronDown className="sidebar-section-chevron" size={16} aria-hidden="true" />
            </button>
            {settingsMenuOpen ? (
              <div className="sidebar-subnav" id="sidebar-settings-nav">
                {settingsNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentSettingsHash === item.hash
                  return (
                    <Link
                      aria-current={isActive ? 'page' : undefined}
                      className={isActive ? 'active' : undefined}
                      key={item.to}
                      title={sidebarCollapsed ? item.label : undefined}
                      to={item.to}
                    >
                      <Icon size={18} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            ) : null}
          </section>
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
            <div className="sidebar-user-label">
              <strong>{user?.displayName ?? 'Utente Radynx'}</strong>
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
              <Link role="menuitem" to="/settings#settings-account" onClick={() => setProfileMenuOpen(false)}>
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
            <strong>Radynx Organizer</strong>
            <span>Workspace personale</span>
          </div>
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
            <div>
              <dt>Account creato</dt>
              <dd>{user?.createdAt ? formatDateTime(user.createdAt) : 'Non disponibile'}</dd>
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
              navigate('/settings#settings-account')
            }}
          >
            Impostazioni account
          </Button>
        </footer>
      </Modal>
    </div>
  )
}
