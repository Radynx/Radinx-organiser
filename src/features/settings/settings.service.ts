import { onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore'
import { userSettingsRef } from '@/lib/firestorePaths'
import {
  themePreferences,
  type CalendarCategory,
  type CalendarConnection,
  type CalendarProvider,
  type ThemePreference,
  type UserSettings,
} from '@/types/domain'
import { normalizeCategories, normalizeHiddenCategoryIds } from '@/features/settings/categories'
import { defaultSettings } from '@/features/settings/defaultSettings'

const isThemePreference = (theme: unknown): theme is ThemePreference =>
  themePreferences.includes(theme as ThemePreference)

const mergeSettings = (data: Partial<UserSettings> | undefined): UserSettings => {
  const colors = {
    ...defaultSettings.colors,
    ...data?.colors,
  }

  return {
    ...defaultSettings,
    ...data,
    colors,
    categories: normalizeCategories(data?.categories, colors, data?.hiddenCategoryIds),
    hiddenCategoryIds: normalizeHiddenCategoryIds(data?.hiddenCategoryIds),
    theme: isThemePreference(data?.theme) ? data.theme : defaultSettings.theme,
    calendarConnections: {
      google: {
        ...defaultSettings.calendarConnections.google,
        ...data?.calendarConnections?.google,
      },
      apple: {
        ...defaultSettings.calendarConnections.apple,
        ...data?.calendarConnections?.apple,
      },
    },
  }
}

export const subscribeToSettings = (
  userId: string,
  onData: (settings: UserSettings) => void,
  onError: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    userSettingsRef(userId),
    (snapshot) => {
      onData(mergeSettings(snapshot.data() as Partial<UserSettings> | undefined))
    },
    (error) => onError(error),
  )

export const saveColorSettings = async (userId: string, colors: UserSettings['colors']) => {
  await setDoc(
    userSettingsRef(userId),
    {
      colors,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  )
}

export const saveCategorySettings = async (
  userId: string,
  categories: CalendarCategory[],
  hiddenCategoryIds: string[] = [],
) => {
  const normalizedHiddenCategoryIds = normalizeHiddenCategoryIds(hiddenCategoryIds)

  await setDoc(
    userSettingsRef(userId),
    {
      categories: normalizeCategories(categories, defaultSettings.colors, normalizedHiddenCategoryIds),
      hiddenCategoryIds: normalizedHiddenCategoryIds,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  )
}

export const saveThemePreference = async (userId: string, theme: UserSettings['theme']) => {
  await setDoc(
    userSettingsRef(userId),
    {
      theme,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  )
}

const connectionPatch = (provider: CalendarProvider, connection: CalendarConnection) => ({
  [`calendarConnections.${provider}`]: connection,
  updatedAt: new Date().toISOString(),
})

export const saveCalendarConnection = async (
  userId: string,
  provider: CalendarProvider,
  connection: CalendarConnection,
) => {
  await setDoc(userSettingsRef(userId), connectionPatch(provider, connection), { merge: true })
  return connection
}

export const startCalendarConnection = async (userId: string, provider: CalendarProvider) => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID
  const now = new Date().toISOString()
  const connection: CalendarConnection =
    provider === 'google' && googleClientId
      ? {
          enabled: true,
          status: 'ready_for_oauth',
          lastSyncAt: null,
          error: null,
        }
      : {
          enabled: true,
          status: 'needs_configuration',
          lastSyncAt: null,
          error:
            provider === 'google'
              ? 'Configura VITE_GOOGLE_CALENDAR_CLIENT_ID e un flusso OAuth autorizzato.'
              : 'Apple Calendar richiede un backend/proxy CalDAV sicuro. Per sicurezza nessuna credenziale iCloud viene salvata nel browser.',
        }

  return saveCalendarConnection(userId, provider, { ...connection, lastSyncAt: now })
}

export const disconnectCalendar = async (userId: string, provider: CalendarProvider) => {
  await setDoc(
    userSettingsRef(userId),
    connectionPatch(provider, {
      enabled: false,
      status: 'disconnected',
      error: null,
      lastSyncAt: null,
    }),
    { merge: true },
  )
}
