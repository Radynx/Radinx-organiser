import { useEffect, useState } from 'react'
import { toUserMessage } from '@/lib/errors'
import type { CompletedTask, WorkTask } from '@/types/domain'
import {
  subscribeToCompletedTasks,
  subscribeToTasks,
} from '@/features/tasks/tasks.service'

export function useTasks(userId?: string) {
  const [tasks, setTasks] = useState<WorkTask[]>([])
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setTasks([])
      setLoading(false)
      return undefined
    }

    setLoading(true)
    return subscribeToTasks(
      userId,
      (nextTasks) => {
        setTasks(nextTasks)
        setError(null)
        setLoading(false)
      },
      (snapshotError) => {
        setError(toUserMessage(snapshotError))
        setLoading(false)
      },
    )
  }, [userId])

  return { error, loading, tasks }
}

export function useCompletedTasks(userId?: string) {
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([])
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setCompletedTasks([])
      setLoading(false)
      return undefined
    }

    setLoading(true)
    return subscribeToCompletedTasks(
      userId,
      (nextTasks) => {
        setCompletedTasks(nextTasks)
        setError(null)
        setLoading(false)
      },
      (snapshotError) => {
        setError(toUserMessage(snapshotError))
        setLoading(false)
      },
    )
  }, [userId])

  return { completedTasks, error, loading }
}
