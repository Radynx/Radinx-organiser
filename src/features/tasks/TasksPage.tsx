import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import {
  completeTask,
  createTask,
  deleteTask,
  updateTask,
  updateTaskStatus,
} from '@/features/tasks/tasks.service'
import { taskSchema, type TaskFormData } from '@/features/tasks/task.schemas'
import { useTasks } from '@/features/tasks/useTasks'
import { toUserMessage } from '@/lib/errors'
import type { TaskStatus, WorkTask } from '@/types/domain'
import { formatDateTime } from '@/utils/date'
import { priorityLabels, priorityTone, taskStatusLabels } from '@/utils/labels'

const emptyTask: TaskFormData = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueAt: '',
  notes: '',
}

const toFormData = (task: WorkTask): TaskFormData => ({
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueAt: task.dueAt ?? '',
  notes: task.notes ?? '',
})

export function TasksPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const userId = user?.uid
  const { error, loading, tasks } = useTasks(userId)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<WorkTask | null>(null)
  const [deletingTask, setDeletingTask] = useState<WorkTask | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: emptyTask,
  })

  useEffect(() => {
    reset(editingTask ? toFormData(editingTask) : emptyTask)
  }, [editingTask, reset])

  const openCreateModal = () => {
    setEditingTask(null)
    reset(emptyTask)
    setModalOpen(true)
  }

  const openEditModal = (task: WorkTask) => {
    setEditingTask(task)
    reset(toFormData(task))
    setModalOpen(true)
  }

  const onSubmit = handleSubmit(async (data) => {
    if (!userId) return
    setSaving(true)
    try {
      if (editingTask) {
        await updateTask(userId, editingTask.id, data)
        notify({ title: 'Task aggiornata', variant: 'success' })
      } else {
        await createTask(userId, data)
        notify({ title: 'Task creata', variant: 'success' })
      }
      setModalOpen(false)
      setEditingTask(null)
    } catch (submitError) {
      notify({
        title: 'Salvataggio non riuscito',
        description: toUserMessage(submitError),
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  })

  const handleComplete = async (task: WorkTask) => {
    if (!userId) return
    setCompletingId(task.id)
    try {
      await completeTask(userId, task)
      notify({ title: 'Task completata', variant: 'success' })
    } catch (completeError) {
      notify({
        title: 'Completamento non riuscito',
        description: toUserMessage(completeError),
        variant: 'error',
      })
    } finally {
      setCompletingId(null)
    }
  }

  const handleStatusChange = async (task: WorkTask, status: TaskStatus) => {
    if (!userId) return
    if (status === 'completed') {
      await handleComplete(task)
      return
    }

    try {
      await updateTaskStatus(userId, task.id, status)
    } catch (statusError) {
      notify({
        title: 'Cambio stato non riuscito',
        description: toUserMessage(statusError),
        variant: 'error',
      })
    }
  }

  const handleDelete = async () => {
    if (!userId || !deletingTask) return
    setDeleting(true)
    try {
      await deleteTask(userId, deletingTask.id)
      notify({ title: 'Task eliminata', variant: 'success' })
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
        eyebrow="Lavoro"
        title="Task lavorative"
        description="Attività operative con priorità, stati e scadenze."
        action={
          <Button icon={<Plus size={18} />} onClick={openCreateModal}>
            Nuova task
          </Button>
        }
      />

      {error ? <div className="inline-error">{error}</div> : null}

      {loading ? (
        <section className="panel">
          <Skeleton lines={8} />
        </section>
      ) : tasks.length ? (
        <section className="kanban-grid">
          {(['todo', 'in-progress'] as TaskStatus[]).map((status) => {
            const columnTasks = tasks.filter((task) => task.status === status)
            return (
              <article className="kanban-column" key={status}>
                <header>
                  <h2>{taskStatusLabels[status]}</h2>
                  <Badge>{columnTasks.length}</Badge>
                </header>
                <div className="task-stack">
                  {columnTasks.length ? (
                    columnTasks.map((task) => (
                      <TaskCard
                        completing={completingId === task.id}
                        key={task.id}
                        onComplete={handleComplete}
                        onDelete={setDeletingTask}
                        onEdit={openEditModal}
                        onStatusChange={handleStatusChange}
                        task={task}
                      />
                    ))
                  ) : (
                    <EmptyState title="Colonna vuota" description="Nessuna attività in questo stato." />
                  )}
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <EmptyState
          title="Nessuna task"
          description="Crea la prima attività lavorativa."
          action={<Button onClick={openCreateModal}>Crea task</Button>}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingTask(null)
        }}
        title={editingTask ? 'Modifica task' : 'Nuova task'}
      >
        <form className="form-grid" onSubmit={onSubmit}>
          <InputField error={errors.title?.message} label="Titolo" {...register('title')} />
          <SelectField error={errors.status?.message} label="Stato" {...register('status')}>
            <option value="todo">Da fare</option>
            <option value="in-progress">In corso</option>
            <option value="completed">Completata</option>
          </SelectField>
          <SelectField error={errors.priority?.message} label="Priorità" {...register('priority')}>
            <option value="low">Bassa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="critical">Critica</option>
          </SelectField>
          <InputField
            error={errors.dueAt?.message}
            label="Scadenza"
            type="datetime-local"
            {...register('dueAt')}
          />
          <TextareaField
            containerClassName="span-2"
            error={errors.description?.message}
            label="Descrizione"
            rows={4}
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
                setEditingTask(null)
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
        confirmLabel="Elimina"
        description="Questa azione rimuove definitivamente la task aperta."
        loading={deleting}
        onCancel={() => setDeletingTask(null)}
        onConfirm={handleDelete}
        open={Boolean(deletingTask)}
        title="Eliminare task?"
      />
    </div>
  )
}

function TaskCard({
  completing,
  onComplete,
  onDelete,
  onEdit,
  onStatusChange,
  task,
}: {
  completing: boolean
  onComplete: (task: WorkTask) => void
  onDelete: (task: WorkTask) => void
  onEdit: (task: WorkTask) => void
  onStatusChange: (task: WorkTask, status: TaskStatus) => void
  task: WorkTask
}) {
  return (
    <article className="task-card">
      <div className="task-check-row">
        <label className="task-checkbox">
          <input
            checked={false}
            disabled={completing}
            type="checkbox"
            onChange={() => onComplete(task)}
          />
          <span>{completing ? 'Sposto...' : 'Completa'}</span>
        </label>
        <Badge tone={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
      </div>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      {task.dueAt ? <time>Scadenza {formatDateTime(task.dueAt)}</time> : null}
      {task.notes ? <small>{task.notes}</small> : null}
      <footer>
        <select
          aria-label="Stato task"
          value={task.status}
          onChange={(event) => onStatusChange(task, event.target.value as TaskStatus)}
        >
          <option value="todo">Da fare</option>
          <option value="in-progress">In corso</option>
          <option value="completed">Completata</option>
        </select>
        <button type="button" className="icon-button" aria-label="Modifica task" onClick={() => onEdit(task)}>
          <Pencil size={16} aria-hidden="true" />
        </button>
        <button type="button" className="icon-button" aria-label="Completa task" onClick={() => onComplete(task)}>
          <Check size={16} aria-hidden="true" />
        </button>
        <button type="button" className="icon-button" aria-label="Elimina task" onClick={() => onDelete(task)}>
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </footer>
    </article>
  )
}
