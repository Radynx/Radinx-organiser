import { zodResolver } from '@hookform/resolvers/zod'
import {
  addMonths,
  addWeeks,
  format,
  subMonths,
  subWeeks,
} from 'date-fns'
import { it } from 'date-fns/locale'
import { CalendarPlus, ChevronLeft, ChevronRight, Filter, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'
import { useForm } from 'react-hook-form'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { InputField, SelectField, TextareaField } from '@/components/FormField'
import { Modal } from '@/components/Modal'
import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useSettings } from '@/features/settings/useSettings'
import { eventSchema, type EventFormData } from '@/features/calendar/event.schemas'
import {
  createEvent,
  deleteEvent,
  moveEventToDate,
  updateEvent,
} from '@/features/calendar/events.service'
import { useEvents } from '@/features/calendar/useEvents'
import { getCategoryColor, getCategoryLabel } from '@/features/settings/categories'
import { toUserMessage } from '@/lib/errors'
import type { CalendarCategory, CalendarColors, CalendarEvent, CalendarView, Priority } from '@/types/domain'
import {
  formatDate,
  getMonthGridDays,
  getWeekDays,
  isISODateInSameDay,
  isISODateInSameMonth,
  toISODate,
  todayISODate,
} from '@/utils/date'
import { priorityLabels, priorityTone } from '@/utils/labels'

const emptyEvent: EventFormData = {
  title: '',
  description: '',
  date: todayISODate(),
  startTime: '09:00',
  endTime: '10:00',
  category: 'personal',
  priority: 'medium',
  notes: '',
}

const toFormData = (event: CalendarEvent): EventFormData => ({
  title: event.title,
  description: event.description ?? '',
  date: event.date,
  startTime: event.startTime,
  endTime: event.endTime,
  category: event.category,
  priority: event.priority,
  notes: event.notes ?? '',
})

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(target.closest('button, a, input, select, textarea, [data-skip-cell-click="true"]'))

export function CalendarPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const userId = user?.uid
  const { error, events, loading } = useEvents(userId)
  const { error: settingsError, settings } = useSettings(userId)
  const [view, setView] = useState<CalendarView>('week')
  const [cursorDate, setCursorDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [keyword, setKeyword] = useState('')

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: emptyEvent,
  })

  useEffect(() => {
    if (editingEvent) {
      reset(toFormData(editingEvent))
    } else {
      reset({ ...emptyEvent, date: toISODate(cursorDate) })
    }
  }, [cursorDate, editingEvent, reset])

  const filteredEvents = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return events.filter((event) => {
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter
      const matchesPriority = priorityFilter === 'all' || event.priority === priorityFilter
      const searchable = `${event.title} ${event.description ?? ''} ${event.notes ?? ''}`.toLowerCase()
      const matchesKeyword = !normalizedKeyword || searchable.includes(normalizedKeyword)
      return matchesCategory && matchesPriority && matchesKeyword
    })
  }, [categoryFilter, events, keyword, priorityFilter])

  const categoryOptions = settings.categories

  const openCreateModal = (date = cursorDate) => {
    setEditingEvent(null)
    reset({ ...emptyEvent, date: toISODate(date) })
    setModalOpen(true)
  }

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event)
    reset(toFormData(event))
    setModalOpen(true)
  }

  const onSubmit = handleSubmit(async (data) => {
    if (!userId) return
    setSaving(true)
    try {
      if (editingEvent) {
        await updateEvent(userId, editingEvent.id, data)
        notify({ title: 'Evento aggiornato', variant: 'success' })
      } else {
        await createEvent(userId, data)
        notify({ title: 'Evento creato', variant: 'success' })
      }
      setModalOpen(false)
      setEditingEvent(null)
    } catch (error) {
      notify({ title: 'Salvataggio non riuscito', description: toUserMessage(error), variant: 'error' })
    } finally {
      setSaving(false)
    }
  })

  const handleDelete = async () => {
    if (!userId || !deletingEvent) return
    setDeleting(true)
    try {
      await deleteEvent(userId, deletingEvent.id)
      notify({ title: 'Evento eliminato', variant: 'success' })
      setDeletingEvent(null)
    } catch (error) {
      notify({ title: 'Eliminazione non riuscita', description: toUserMessage(error), variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const handleDrop = async (eventId: string, date: string) => {
    if (!userId) return
    try {
      await moveEventToDate(userId, eventId, date)
      notify({ title: 'Evento spostato', variant: 'success' })
    } catch (error) {
      notify({ title: 'Spostamento non riuscito', description: toUserMessage(error), variant: 'error' })
    }
  }

  const goBack = () => {
    setCursorDate((current) => (view === 'month' ? subMonths(current, 1) : subWeeks(current, 1)))
  }

  const goNext = () => {
    setCursorDate((current) => (view === 'month' ? addMonths(current, 1) : addWeeks(current, 1)))
  }

  return (
    <div className="page-flow">
      <PageHeader
        eyebrow="Agenda"
        title="Calendario"
        description="Eventi personali, lavoro e priorità in viste giornaliere, settimanali e mensili."
        action={
          <Button icon={<CalendarPlus size={18} />} onClick={() => openCreateModal()}>
            Nuovo evento
          </Button>
        }
      />

      <section className="toolbar" aria-label="Controlli calendario">
        <div className="segmented-control">
          {(['day', 'week', 'month'] as CalendarView[]).map((nextView) => (
            <button
              className={view === nextView ? 'active' : ''}
              key={nextView}
              type="button"
              onClick={() => setView(nextView)}
            >
              {nextView === 'day' ? 'Giorno' : nextView === 'week' ? 'Settimana' : 'Mese'}
            </button>
          ))}
        </div>
        <div className="date-navigation">
          <button className="icon-button" type="button" aria-label="Periodo precedente" onClick={goBack}>
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <strong>{view === 'month' ? format(cursorDate, 'MMMM yyyy', { locale: it }) : formatDate(toISODate(cursorDate))}</strong>
          <button className="icon-button" type="button" aria-label="Periodo successivo" onClick={goNext}>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
        <Button variant="secondary" onClick={() => setCursorDate(new Date())}>
          Oggi
        </Button>
      </section>

      <section className="filters-panel" aria-label="Filtri calendario">
        <Filter size={18} aria-hidden="true" />
        <input
          aria-label="Cerca eventi"
          placeholder="Cerca"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <select
          aria-label="Filtra categoria"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="all">Tutte le categorie</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtra priorità"
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value as Priority | 'all')}
        >
          <option value="all">Tutte le priorità</option>
          <option value="low">Bassa</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
          <option value="critical">Critica</option>
        </select>
      </section>

      {error || settingsError ? (
        <div className="inline-error" role="alert">
          {error ?? settingsError}
        </div>
      ) : null}

      {loading ? (
        <section className="panel">
          <Skeleton lines={8} />
        </section>
      ) : view === 'day' ? (
        <DayView
          categories={categoryOptions}
          colors={settings.colors}
          date={cursorDate}
          events={filteredEvents}
          onCreate={openCreateModal}
          onDelete={setDeletingEvent}
          onEdit={openEditModal}
        />
      ) : view === 'week' ? (
        <WeekView
          categories={categoryOptions}
          colors={settings.colors}
          cursorDate={cursorDate}
          events={filteredEvents}
          onCreate={openCreateModal}
          onDelete={setDeletingEvent}
          onDrop={handleDrop}
          onEdit={openEditModal}
        />
      ) : (
        <MonthView
          categories={categoryOptions}
          colors={settings.colors}
          cursorDate={cursorDate}
          events={filteredEvents}
          onCreate={openCreateModal}
          onDelete={setDeletingEvent}
          onDrop={handleDrop}
          onEdit={openEditModal}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingEvent(null)
        }}
        title={editingEvent ? 'Modifica evento' : 'Nuovo evento'}
      >
        <form className="form-grid" onSubmit={onSubmit}>
          <InputField error={errors.title?.message} label="Titolo" {...register('title')} />
          <InputField
            error={errors.date?.message}
            label="Data"
            type="date"
            {...register('date')}
          />
          <InputField
            error={errors.startTime?.message}
            label="Ora inizio"
            type="time"
            {...register('startTime')}
          />
          <InputField
            error={errors.endTime?.message}
            label="Ora fine"
            type="time"
            {...register('endTime')}
          />
          <SelectField error={errors.category?.message} label="Categoria" {...register('category')}>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </SelectField>
          <SelectField error={errors.priority?.message} label="Priorità" {...register('priority')}>
            <option value="low">Bassa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="critical">Critica</option>
          </SelectField>
          <TextareaField
            containerClassName="span-2"
            error={errors.description?.message}
            label="Descrizione"
            rows={3}
            {...register('description')}
          />
          <TextareaField
            containerClassName="span-2"
            error={errors.notes?.message}
            label="Note"
            rows={3}
            {...register('notes')}
          />
          <footer className="modal-actions span-2">
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setEditingEvent(null)
              }}
            >
              Annulla
            </Button>
            <Button loading={saving} type="submit">
              Salva
            </Button>
          </footer>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingEvent)}
        title="Eliminare evento?"
        description="Questa azione rimuove l’evento dal calendario."
        confirmLabel="Elimina"
        loading={deleting}
        onCancel={() => setDeletingEvent(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

interface CalendarViewProps {
  categories: CalendarCategory[]
  colors: CalendarColors
  events: CalendarEvent[]
  onCreate: (date?: Date) => void
  onDelete: (event: CalendarEvent) => void
  onEdit: (event: CalendarEvent) => void
}

function DayView({ categories, colors, date, events, onCreate, onDelete, onEdit }: CalendarViewProps & { date: Date }) {
  const dayEvents = events.filter((event) => isISODateInSameDay(event.date, date))

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>{formatDate(toISODate(date))}</h2>
          <p>{dayEvents.length} eventi</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onCreate(date)}>
          Aggiungi
        </Button>
      </header>
      {dayEvents.length ? (
        <div className="calendar-day-list">
          {dayEvents.map((event) => (
            <EventCard
              categories={categories}
              colors={colors}
              event={event}
              key={event.id}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="Nessun evento" description="Nessun impegno in questa data." />
      )}
    </section>
  )
}

function WeekView({
  categories,
  colors,
  cursorDate,
  events,
  onCreate,
  onDelete,
  onDrop,
  onEdit,
}: CalendarViewProps & {
  cursorDate: Date
  onDrop: (eventId: string, date: string) => void
}) {
  const handleCellClick = (event: MouseEvent<HTMLElement>, date: Date) => {
    if (isInteractiveTarget(event.target)) return
    onCreate(date)
  }

  const handleCellKeyDown = (event: KeyboardEvent<HTMLElement>, date: Date) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    if (isInteractiveTarget(event.target)) return
    event.preventDefault()
    onCreate(date)
  }

  return (
    <section className="calendar-week">
      {getWeekDays(cursorDate).map((date) => {
        const isoDate = toISODate(date)
        const dayEvents = events.filter((event) => event.date === isoDate)
        return (
          <article
            aria-label={`Crea evento per ${format(date, 'd MMMM yyyy', { locale: it })}`}
            className="calendar-column"
            key={isoDate}
            onClick={(event) => handleCellClick(event, date)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const eventId = event.dataTransfer.getData('text/plain')
              if (eventId) onDrop(eventId, isoDate)
            }}
            onKeyDown={(event) => handleCellKeyDown(event, date)}
            role="button"
            tabIndex={0}
          >
            <header>
              <span>{format(date, 'EEE', { locale: it })}</span>
              <button type="button" onClick={() => onCreate(date)}>
                {format(date, 'd', { locale: it })}
              </button>
            </header>
            <div className="event-stack">
              {dayEvents.map((event) => (
                <EventPill
                  categories={categories}
                  colors={colors}
                  event={event}
                  key={event.id}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </article>
        )
      })}
    </section>
  )
}

function MonthView({
  categories,
  colors,
  cursorDate,
  events,
  onCreate,
  onDelete,
  onDrop,
  onEdit,
}: CalendarViewProps & {
  cursorDate: Date
  onDrop: (eventId: string, date: string) => void
}) {
  const handleCellClick = (event: MouseEvent<HTMLElement>, date: Date) => {
    if (isInteractiveTarget(event.target)) return
    onCreate(date)
  }

  const handleCellKeyDown = (event: KeyboardEvent<HTMLElement>, date: Date) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    if (isInteractiveTarget(event.target)) return
    event.preventDefault()
    onCreate(date)
  }

  return (
    <section className="calendar-month">
      {getMonthGridDays(cursorDate).map((date) => {
        const isoDate = toISODate(date)
        const dayEvents = events.filter((event) => event.date === isoDate)
        const isToday = isoDate === todayISODate()
        return (
          <article
            aria-label={`Crea evento per ${format(date, 'd MMMM yyyy', { locale: it })}`}
            className={`${isISODateInSameMonth(isoDate, cursorDate) ? '' : 'muted-day'}${isToday ? ' today-day' : ''}`}
            key={isoDate}
            onClick={(event) => handleCellClick(event, date)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const eventId = event.dataTransfer.getData('text/plain')
              if (eventId) onDrop(eventId, isoDate)
            }}
            onKeyDown={(event) => handleCellKeyDown(event, date)}
            role="button"
            tabIndex={0}
          >
            <header>
              <button type="button" onClick={() => onCreate(date)}>
                {format(date, 'd', { locale: it })}
              </button>
              {isToday ? <Badge tone="blue">Oggi</Badge> : null}
            </header>
            <div className="event-stack">
              {dayEvents.slice(0, 3).map((event) => (
                <EventPill
                  compact
                  categories={categories}
                  colors={colors}
                  event={event}
                  key={event.id}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
              {dayEvents.length > 3 ? <small>+{dayEvents.length - 3}</small> : null}
            </div>
          </article>
        )
      })}
    </section>
  )
}

function EventPill({
  categories,
  colors,
  compact = false,
  event,
  onDelete,
  onEdit,
}: {
  categories: CalendarCategory[]
  colors: CalendarColors
  compact?: boolean
  event: CalendarEvent
  onDelete: (event: CalendarEvent) => void
  onEdit: (event: CalendarEvent) => void
}) {
  const color = getCategoryColor(event.category, categories, colors)
  const label = getCategoryLabel(event.category, categories)

  const handleEdit = (clickEvent: MouseEvent<HTMLButtonElement>) => {
    clickEvent.stopPropagation()
    onEdit(event)
  }

  const handleDelete = (clickEvent: MouseEvent<HTMLButtonElement>) => {
    clickEvent.stopPropagation()
    onDelete(event)
  }

  return (
    <div
      className={`event-pill${compact ? ' event-pill-compact' : ''}`}
      data-skip-cell-click="true"
      draggable
      style={{ '--event-color': color, borderLeftColor: color } as CSSProperties}
      onDragStart={(dragEvent) => dragEvent.dataTransfer.setData('text/plain', event.id)}
    >
      <button type="button" onClick={handleEdit}>
        <strong>{compact ? event.title : `${event.startTime} ${event.title}`}</strong>
        {!compact ? <span>{label}</span> : null}
      </button>
      <div className="pill-actions">
        <button type="button" aria-label="Modifica evento" onClick={handleEdit}>
          <Pencil size={14} aria-hidden="true" />
        </button>
        <button type="button" aria-label="Elimina evento" onClick={handleDelete}>
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function EventCard({
  categories,
  colors,
  event,
  onDelete,
  onEdit,
}: {
  categories: CalendarCategory[]
  colors: CalendarColors
  event: CalendarEvent
  onDelete: (event: CalendarEvent) => void
  onEdit: (event: CalendarEvent) => void
}) {
  const color = getCategoryColor(event.category, categories, colors)
  const label = getCategoryLabel(event.category, categories)

  return (
    <article className="event-card" style={{ borderLeftColor: color }}>
      <div>
        <time>
          {event.startTime} - {event.endTime}
        </time>
        <h3>{event.title}</h3>
        {event.description ? <p>{event.description}</p> : null}
        {event.notes ? <small>{event.notes}</small> : null}
      </div>
      <div className="event-card-side">
        <Badge tone={priorityTone[event.priority]}>{priorityLabels[event.priority]}</Badge>
        <Badge>{label}</Badge>
        <button type="button" className="icon-button" aria-label="Modifica evento" onClick={() => onEdit(event)}>
          <Pencil size={16} aria-hidden="true" />
        </button>
        <button type="button" className="icon-button" aria-label="Elimina evento" onClick={() => onDelete(event)}>
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
