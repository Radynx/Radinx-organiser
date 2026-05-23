import {
  endOfWeek,
  isSameDay,
  isSameMonth,
  isValid,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from 'date-fns'
import { RotateCcw, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import {
  deleteCompletedTask,
  restoreCompletedTask,
} from '@/features/tasks/tasks.service'
import { useCompletedTasks } from '@/features/tasks/useTasks'
import { toUserMessage } from '@/lib/errors'
import type { CompletedTask, Priority } from '@/types/domain'
import { elapsedLabel, formatDateTime, todayISODate } from '@/utils/date'
import { priorityLabels, priorityTone } from '@/utils/labels'

type PeriodFilter = 'all' | 'day' | 'week' | 'month'

export function CompletedPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const userId = user?.uid
  const { completedTasks, error, loading } = useCompletedTasks(userId)
  const [period, setPeriod] = useState<PeriodFilter>('all')
  const [referenceDate, setReferenceDate] = useState(todayISODate())
  const [priority, setPriority] = useState<Priority | 'all'>('all')
  const [keyword, setKeyword] = useState('')
  const [deletingTask, setDeletingTask] = useState<CompletedTask | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const filteredTasks = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    const reference = parseISO(referenceDate)
    if (!isValid(reference)) return []

    return completedTasks.filter((task) => {
      const completedAt = parseISO(task.completedAt)
      if (!isValid(completedAt)) return false
      const matchesPeriod =
        period === 'all' ||
        (period === 'day' && isSameDay(completedAt, reference)) ||
        (period === 'week' &&
          isWithinInterval(completedAt, {
            start: startOfWeek(reference, { weekStartsOn: 1 }),
            end: endOfWeek(reference, { weekStartsOn: 1 }),
          })) ||
        (period === 'month' && isSameMonth(completedAt, reference))

      const matchesPriority = priority === 'all' || task.priority === priority
      const searchable = `${task.title} ${task.description} ${task.notes ?? ''}`.toLowerCase()
      const matchesKeyword = !normalizedKeyword || searchable.includes(normalizedKeyword)

      return matchesPeriod && matchesPriority && matchesKeyword
    })
  }, [completedTasks, keyword, period, priority, referenceDate])

  const handleRestore = async (task: CompletedTask) => {
    if (!userId) return
    setRestoringId(task.id)
    try {
      await restoreCompletedTask(userId, task)
      notify({ title: 'Task ripristinata', variant: 'success' })
    } catch (restoreError) {
      notify({
        title: 'Ripristino non riuscito',
        description: toUserMessage(restoreError),
        variant: 'error',
      })
    } finally {
      setRestoringId(null)
    }
  }

  const handleDelete = async () => {
    if (!userId || !deletingTask) return
    setDeleting(true)
    try {
      await deleteCompletedTask(userId, deletingTask.id)
      notify({ title: 'Voce eliminata', variant: 'success' })
      setDeletingTask(null)
    } catch (deleteError) {
      notify({
        title: 'Eliminazione non riuscita',
        description: toUserMessage(deleteError),
        variant: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page-flow">
      <PageHeader
        eyebrow="Storico"
        title="Cose fatte"
        description="Attività completate con tempi, note e filtri."
      />

      <section className="filters-panel" aria-label="Filtri cose fatte">
        <Search size={18} aria-hidden="true" />
        <input
          aria-label="Cerca attività completate"
          placeholder="Cerca"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <select
          aria-label="Periodo"
          value={period}
          onChange={(event) => setPeriod(event.target.value as PeriodFilter)}
        >
          <option value="all">Tutto</option>
          <option value="day">Giorno</option>
          <option value="week">Settimana</option>
          <option value="month">Mese</option>
        </select>
        <input
          aria-label="Data riferimento"
          type="date"
          value={referenceDate}
          onChange={(event) => setReferenceDate(event.target.value)}
        />
        <select
          aria-label="Priorità"
          value={priority}
          onChange={(event) => setPriority(event.target.value as Priority | 'all')}
        >
          <option value="all">Tutte le priorità</option>
          <option value="low">Bassa</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
          <option value="critical">Critica</option>
        </select>
      </section>

      {error ? <div className="inline-error">{error}</div> : null}

      {loading ? (
        <section className="panel">
          <Skeleton lines={8} />
        </section>
      ) : filteredTasks.length ? (
        <section className="completed-list">
          {filteredTasks.map((task) => (
            <article className="completed-card" key={task.id}>
              <header>
                <div>
                  <h2>{task.title}</h2>
                  <p>{task.description}</p>
                </div>
                <Badge tone={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
              </header>
              <dl>
                <div>
                  <dt>Creata</dt>
                  <dd>{formatDateTime(task.createdAt)}</dd>
                </div>
                <div>
                  <dt>Completata</dt>
                  <dd>{formatDateTime(task.completedAt)}</dd>
                </div>
                <div>
                  <dt>Tempo trascorso</dt>
                  <dd>{elapsedLabel(task.createdAt, task.completedAt)}</dd>
                </div>
              </dl>
              {task.notes ? <p className="completed-notes">{task.notes}</p> : null}
              <footer>
                <Button
                  loading={restoringId === task.id}
                  size="sm"
                  variant="secondary"
                  icon={<RotateCcw size={16} />}
                  onClick={() => handleRestore(task)}
                >
                  Ripristina
                </Button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Elimina voce completata"
                  onClick={() => setDeletingTask(task)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </footer>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState title="Nessun risultato" description="Lo storico filtrato è vuoto." />
      )}

      <ConfirmDialog
        confirmLabel="Elimina"
        description="Questa voce verrà rimossa dallo storico."
        loading={deleting}
        onCancel={() => setDeletingTask(null)}
        onConfirm={handleDelete}
        open={Boolean(deletingTask)}
        title="Eliminare voce?"
      />
    </div>
  )
}
