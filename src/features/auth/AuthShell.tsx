import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { CalendarCheck, Moon, Sun } from 'lucide-react'
import { FirebaseConfigNotice } from '@/components/FirebaseConfigNotice'

type AuthTheme = 'light' | 'dark'

const authThemeStorageKey = 'radinx-auth-theme'

const isAuthTheme = (theme: string | null): theme is AuthTheme => theme === 'light' || theme === 'dark'

const getInitialAuthTheme = (): AuthTheme => {
  if (typeof window === 'undefined') return 'light'

  const storedTheme = window.localStorage.getItem(authThemeStorageKey)
  if (isAuthTheme(storedTheme)) return storedTheme

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function AuthShell({
  children,
  subtitle,
  title,
}: {
  children: ReactNode
  subtitle: string
  title: string
}) {
  const [theme, setTheme] = useState<AuthTheme>(getInitialAuthTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(authThemeStorageKey, theme)

    return () => {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  return (
    <main className="auth-screen">
      <section className="auth-panel" aria-label="Accesso Radynx Organizer">
        <div className="auth-toolbar">
          <div className="brand-mark">
            <CalendarCheck size={24} aria-hidden="true" />
            <span>Radynx Organizer</span>
          </div>
          <div className="auth-theme-switch" aria-label="Modalità tema">
            <button
              aria-label="Usa modalità giorno"
              aria-pressed={theme === 'light'}
              className={theme === 'light' ? 'active' : undefined}
              type="button"
              onClick={() => setTheme('light')}
            >
              <Sun size={16} aria-hidden="true" />
              <span>Giorno</span>
            </button>
            <button
              aria-label="Usa modalità notte"
              aria-pressed={theme === 'dark'}
              className={theme === 'dark' ? 'active' : undefined}
              type="button"
              onClick={() => setTheme('dark')}
            >
              <Moon size={16} aria-hidden="true" />
              <span>Notte</span>
            </button>
          </div>
        </div>
        <div className="auth-heading">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <FirebaseConfigNotice />
        {children}
      </section>
    </main>
  )
}
