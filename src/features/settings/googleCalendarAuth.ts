const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

const GOOGLE_CALENDAR_SCOPE = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ')

interface GoogleTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
  expires_in?: number
  scope?: string
  token_type?: string
}

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: 'consent' | 'select_account' | '' }) => void
}

interface GoogleIdentityApi {
  accounts?: {
    oauth2?: {
      initTokenClient: (config: {
        callback: (response: GoogleTokenResponse) => void
        client_id: string
        error_callback?: (error: { message?: string; type?: string }) => void
        scope: string
      }) => GoogleTokenClient
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentityApi
  }
}

let scriptLoadPromise: Promise<void> | null = null

export const getGoogleCalendarClientId = () =>
  String(import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID ?? '').trim()

const loadGoogleIdentityScript = () => {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve()
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT_URL}"]`,
    )

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Google Identity Services non disponibile.')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.src = GOOGLE_IDENTITY_SCRIPT_URL
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Identity Services non disponibile.'))
    document.head.appendChild(script)
  })

  return scriptLoadPromise
}

export const authorizeGoogleCalendar = async (clientId: string) => {
  const cleanClientId = clientId.trim()

  if (!cleanClientId) {
    throw new Error('Configura VITE_GOOGLE_CALENDAR_CLIENT_ID prima di collegare Google Calendar.')
  }

  await loadGoogleIdentityScript()

  const oauth2 = window.google?.accounts?.oauth2

  if (!oauth2) {
    throw new Error('Google Identity Services non è stato caricato correttamente.')
  }

  return new Promise<GoogleTokenResponse>((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: cleanClientId,
      scope: GOOGLE_CALENDAR_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error))
          return
        }

        if (!response.access_token) {
          reject(new Error('Autorizzazione Google Calendar non completata.'))
          return
        }

        resolve(response)
      },
      error_callback: (error) => {
        reject(new Error(error.message ?? error.type ?? 'Autorizzazione Google annullata.'))
      },
    })

    tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}
