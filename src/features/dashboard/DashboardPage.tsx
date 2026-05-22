import { Link } from 'react-router-dom'
import { CalendarPlus, CheckCircle2, Clock3, PlugZap, SquareKanban } from 'lucide-react'
import { isAfter, parseISO } from 'date-fns'
import { Badge } from '@/components/Badge'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useEvents } from '@/features/calendar/useEvents'
import { useCompletedTasks, useTasks } from '@/features/tasks/useTasks'
import { useSettings } from '@/features/settings/useSettings'
import { combineDateAndTime, formatDateTime, formatShortDate, todayISODate } from '@/utils/date'
import {
  categoryLabels,
  connectionStatusLabels,
  priorityLabels,
  priorityTone,
  taskStatusLabels,
} from '@/utils/labels'

export function DashboardPage() {
  const { user } = useAuth()
  const userId = user?.uid
  const { events, loading: eventsLoading } = useEvents(userId)
  const { tasks, loading: tasksLoading } = useTasks(userId)
  const { completedTasks, loading: completedLoading } = useCompletedTasks(userId)
  const { settings } = useSettings(userId)
  const today = todayISODate()
  const now = new Date()

  const todayEvents = events
    .filter((event) => event.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const nextEvents = events
    .filter((event) => isAfter(parseISO(combineDateAndTime(event.date, event.startTime)), now))
    .slice(0, 5)

  const openWorkTasks = tasks.filter((task) => task.status !== 'completed').slice(0, 5)
  const recentCompleted = completedTasks.slice(0, 5)

  return (
    <div className="page-flow">
      <PageHeader
        eyebrow="Oggi"
        title={`Ciao, ${user?.displayName ?? 'Radinx'}`}
        description="La tua giornata, il lavoro aperto e le attività chiuse in un unico punto."
        action={
          <Link className="button button-primary button-md" to="/calendar">
            <CalendarPlus size={18} aria-hidden="true" />
            <span>Nuovo evento</span>
          </Link>
        }
      />

      <section className="metric-grid" aria-label="Panoramica">
        <article className="metric-card">
          <span>Eventi oggi</span>
          <strong>{todayEvents.length}</strong>
          <p>{nextEvents.length} prossimi in agenda</p>
        </article>
        <article className="metric-card">
          <span>Task aperte</span>
          <strong>{openWorkTasks.length}</strong>
          <p>{tasks.filter((task) => task.status === 'in-progress').length} in corso</p>
        </article>
        <article className="metric-card">
          <span>Cose fatte</span>
          <strong>{recentCompleted.length}</strong>
          <p>Ultime attività completate</p>
        </article>
        <article className="metric-card">
          <span>Calendari</span>
          <strong>
            {
              Object.values(settings.calendarConnections).filter((connection) => connection.enabled)
                .length
            }
          </strong>
          <p>Connessioni attivate manualmente</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <header className="panel-header">
            <div>
              <h2>Giornata</h2>
              <p>{formatShortDate(today)}</p>
            </div>
            <Clock3 size={20} aria-hidden="true" />
          </header>
          {eventsLoading ? (
            <Skeleton lines={4} />
          ) : todayEvents.length ? (
            <div className="timeline-list">
              {todayEvents.map((event) => (
                <div className="timeline-item" key={event.id}>
                  <time>
                    {event.startTime} - {event.endTime}
                  </time>
                  <div>
                    <strong>{event.title}</strong>
                    <span>{categoryLabels[event.category]}</span>
                  </div>
                  <Badge tone={priorityTone[event.priority]}>{priorityLabels[event.priority]}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nessun evento oggi"
              description="La giornata è libera."
              icon={<CalendarPlus size={24} />}
            />
          )}
        </article>

        <article className="panel">
          <header className="panel-header">
            <div>
              <h2>Task lavoro</h2>
              <p>Attività aperte</p>
            </div>
            <SquareKanban size={20} aria-hidden="true" />
          </header>
          {tasksLoading ? (
            <Skeleton lines={4} />
          ) : openWorkTasks.length ? (
            <div className="compact-list">
              {openWorkTasks.map((task) => (
                <Link to="/tasks" className="compact-row" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{taskStatusLabels[task.status]}</span>
                  </div>
                  <Badge tone={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Nessuna task aperta" description="Il lavoro attivo è pulito." />
          )}
        </article>

        <article className="panel">
          <header className="panel-header">
            <div>
              <h2>Completate</h2>
              <p>Storico recente</p>
            </div>
            <CheckCircle2 size={20} aria-hidden="true" />
          </header>
          {completedLoading ? (
            <Skeleton lines={4} />
          ) : recentCompleted.length ? (
            <div className="compact-list">
              {recentCompleted.map((task) => (
                <Link to="/completed" className="compact-row" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{formatDateTime(task.completedAt)}</span>
                  </div>
                  <Badge tone="green">Fatta</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Storico vuoto" description="Le task completate appariranno qui." />
          )}
        </article>

        <article className="panel">
          <header className="panel-header">
            <div>
              <h2>Connessioni</h2>
              <p>Google e Apple Calendar</p>
            </div>
            <PlugZap size={20} aria-hidden="true" />
          </header>
          <div className="connection-list">
            {Object.entries(settings.calendarConnections).map(([provider, connection]) => (
              <Link className="connection-row" key={provider} to="/settings">
                <span>{provider === 'google' ? 'Google Calendar' : 'Apple Calendar'}</span>
                <Badge tone={connection.enabled ? 'green' : 'neutral'}>
                  {connectionStatusLabels[connection.status]}
                </Badge>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
