import { useEffect, useState } from 'react'
import { toUserMessage } from '@/lib/errors'
import type { UserSettings } from '@/types/domain'
import { defaultSettings } from '@/features/settings/defaultSettings'
import { subscribeToSettings } from '@/features/settings/settings.service'

export function useSettings(userId?: string) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setSettings(defaultSettings)
      setLoading(false)
      return undefined
    }

    setLoading(true)
    return subscribeToSettings(
      userId,
      (nextSettings) => {
        setSettings(nextSettings)
        setError(null)
        setLoading(false)
      },
      (snapshotError) => {
        setError(toUserMessage(snapshotError))
        setLoading(false)
      },
    )
  }, [userId])

  return { error, loading, settings }
}
