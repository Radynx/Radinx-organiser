import type { ReactNode } from 'react'
import { CalendarCheck } from 'lucide-react'
import { FirebaseConfigNotice } from '@/components/FirebaseConfigNotice'

export function AuthShell({
  children,
  subtitle,
  title,
}: {
  children: ReactNode
  subtitle: string
  title: string
}) {
  return (
    <main className="auth-screen">
      <section className="auth-panel" aria-label="Accesso Radynx Organizer">
        <div className="brand-mark">
          <CalendarCheck size={24} aria-hidden="true" />
          <span>Radynx Organizer</span>
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
