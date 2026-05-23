import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, KeyRound, Palette, PlugZap, Save, Shield, Trash2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { InputField, SelectField } from '@/components/FormField'
import { Modal } from '@/components/Modal'
import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { passwordUpdateSchema, type PasswordUpdateFormData } from '@/features/auth/auth.schemas'
import { defaultSettings } from '@/features/settings/defaultSettings'
import {
  colorSettingsSchema,
  profileSchema,
  type ColorSettingsFormData,
  type ProfileFormData,
} from '@/features/settings/settings.schemas'
import {
  disconnectCalendar,
  saveColorSettings,
  saveThemePreference,
  startCalendarConnection,
} from '@/features/settings/settings.service'
import { useSettings } from '@/features/settings/useSettings'
import { toUserMessage } from '@/lib/errors'
import type { CalendarProvider } from '@/types/domain'
import { connectionStatusLabels } from '@/utils/labels'

const providerLabels: Record<CalendarProvider, string> = {
  google: 'Google Calendar',
  apple: 'Apple Calendar',
}

export function SettingsPage() {
  const {
    changePassword,
    deleteProfilePhoto,
    updateAccountEmail,
    updateDisplayName,
    uploadProfilePhoto,
    user,
  } = useAuth()
  const userId = user?.uid
  const { notify } = useToast()
  const { error, loading, settings } = useSettings(userId)
  const [savingColors, setSavingColors] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [calendarWizard, setCalendarWizard] = useState<CalendarProvider | null>(null)
  const [calendarLoading, setCalendarLoading] = useState<CalendarProvider | null>(null)

  const colorForm = useForm<ColorSettingsFormData>({
    resolver: zodResolver(colorSettingsSchema),
    defaultValues: defaultSettings.colors,
  })
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      email: user?.email ?? '',
    },
  })
  const passwordForm = useForm<PasswordUpdateFormData>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    colorForm.reset(settings.colors)
  }, [colorForm, settings.colors])

  useEffect(() => {
    profileForm.reset({
      displayName: user?.displayName ?? '',
      email: user?.email ?? '',
    })
  }, [profileForm, user?.displayName, user?.email])

  const previewColors = colorForm.watch()

  const onSaveColors = colorForm.handleSubmit(async (data) => {
    if (!userId) return
    setSavingColors(true)
    try {
      await saveColorSettings(userId, data)
      notify({ title: 'Colori salvati', variant: 'success' })
    } catch (error) {
      notify({ title: 'Salvataggio non riuscito', description: toUserMessage(error), variant: 'error' })
    } finally {
      setSavingColors(false)
    }
  })

  const onSaveProfile = profileForm.handleSubmit(async (data) => {
    setSavingProfile(true)
    try {
      if (data.displayName !== user?.displayName) {
        await updateDisplayName(data.displayName)
      }
      if (data.email !== user?.email) {
        await updateAccountEmail(data.email)
        notify({
          title: 'Verifica email inviata',
          description: 'Completa la conferma dalla tua casella di posta.',
          variant: 'info',
        })
      } else {
        notify({ title: 'Profilo aggiornato', variant: 'success' })
      }
    } catch (error) {
      notify({ title: 'Aggiornamento non riuscito', description: toUserMessage(error), variant: 'error' })
    } finally {
      setSavingProfile(false)
    }
  })

  const onChangePassword = passwordForm.handleSubmit(async (data) => {
    setSavingPassword(true)
    try {
      await changePassword(data.password)
      passwordForm.reset({ password: '', confirmPassword: '' })
      notify({ title: 'Password aggiornata', variant: 'success' })
    } catch (error) {
      notify({ title: 'Cambio password non riuscito', description: toUserMessage(error), variant: 'error' })
    } finally {
      setSavingPassword(false)
    }
  })

  const handlePhotoUpload = async (file: File | undefined) => {
    if (!file) return
    setUploadingPhoto(true)
    try {
      await uploadProfilePhoto(file)
      notify({ title: 'Foto profilo aggiornata', variant: 'success' })
    } catch (error) {
      notify({ title: 'Upload non riuscito', description: toUserMessage(error), variant: 'error' })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleDeletePhoto = async () => {
    setUploadingPhoto(true)
    try {
      await deleteProfilePhoto()
      notify({ title: 'Foto rimossa', variant: 'success' })
    } catch (error) {
      notify({ title: 'Rimozione non riuscita', description: toUserMessage(error), variant: 'error' })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleThemeChange = async (theme: typeof settings.theme) => {
    if (!userId) return
    try {
      await saveThemePreference(userId, theme)
      notify({ title: 'Tema aggiornato', variant: 'success' })
    } catch (error) {
      notify({ title: 'Tema non salvato', description: toUserMessage(error), variant: 'error' })
    }
  }

  const handleStartCalendarConnection = async () => {
    if (!userId || !calendarWizard) return
    setCalendarLoading(calendarWizard)
    try {
      const connection = await startCalendarConnection(userId, calendarWizard)
      notify({
        title: providerLabels[calendarWizard],
        description:
          connection.status === 'ready_for_oauth'
            ? 'Connessione pronta per il flusso OAuth autorizzato.'
            : connection.error ?? 'Configurazione richiesta.',
        variant: connection.status === 'ready_for_oauth' ? 'success' : 'warning',
      })
      setCalendarWizard(null)
    } catch (error) {
      notify({
        title: 'Connessione non riuscita',
        description: toUserMessage(error),
        variant: 'error',
      })
    } finally {
      setCalendarLoading(null)
    }
  }

  const handleDisconnectCalendar = async (provider: CalendarProvider) => {
    if (!userId) return
    setCalendarLoading(provider)
    try {
      await disconnectCalendar(userId, provider)
      notify({ title: `${providerLabels[provider]} disconnesso`, variant: 'success' })
    } catch (error) {
      notify({
        title: 'Disconnessione non riuscita',
        description: toUserMessage(error),
        variant: 'error',
      })
    } finally {
      setCalendarLoading(null)
    }
  }

  return (
    <div className="page-flow">
      <PageHeader
        eyebrow="Account"
        title="Impostazioni"
        description="Preferenze, profilo, sicurezza e connessioni calendario."
      />

      {error ? <div className="inline-error" role="alert">{error}</div> : null}

      {loading ? (
        <section className="panel">
          <Skeleton lines={8} />
        </section>
      ) : (
        <section className="settings-grid">
          <article className="panel">
            <header className="panel-header">
              <div>
                <h2>Colori calendario</h2>
                <p>Personalizzazione eventi e completati.</p>
              </div>
              <Palette size={20} aria-hidden="true" />
            </header>
            <form className="form-grid" onSubmit={onSaveColors}>
              <InputField
                error={colorForm.formState.errors.personal?.message}
                label="Eventi personali"
                type="color"
                {...colorForm.register('personal')}
              />
              <InputField
                error={colorForm.formState.errors.work?.message}
                label="Eventi lavoro"
                type="color"
                {...colorForm.register('work')}
              />
              <InputField
                error={colorForm.formState.errors.important?.message}
                label="Eventi importanti"
                type="color"
                {...colorForm.register('important')}
              />
              <InputField
                error={colorForm.formState.errors.completed?.message}
                label="Task completate"
                type="color"
                {...colorForm.register('completed')}
              />
              <div className="color-preview span-2">
                {Object.entries(previewColors).map(([key, color]) => (
                  <span key={key} style={{ backgroundColor: color }}>
                    {key}
                  </span>
                ))}
              </div>
              <footer className="modal-actions span-2">
                <Button loading={savingColors} type="submit" icon={<Save size={16} />}>
                  Salva colori
                </Button>
              </footer>
            </form>
          </article>

          <article className="panel">
            <header className="panel-header">
              <div>
                <h2>Profilo</h2>
                <p>Nome, email e avatar salvato su Firestore.</p>
              </div>
              <Camera size={20} aria-hidden="true" />
            </header>
            <div className="profile-photo-row">
              <div className="avatar large">
                {user?.photoURL ? <img src={user.photoURL} alt="" /> : user?.displayName.slice(0, 1)}
              </div>
              <div className="photo-actions">
                <label className="button button-secondary button-sm">
                  <Upload size={16} aria-hidden="true" />
                  <span>{uploadingPhoto ? 'Salvo...' : 'Aggiorna avatar'}</span>
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    type="file"
                    onChange={(event) => handlePhotoUpload(event.target.files?.[0])}
                  />
                </label>
                <Button
                  disabled={!user?.photoURL}
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 size={16} />}
                  onClick={handleDeletePhoto}
                >
                  Rimuovi
                </Button>
              </div>
            </div>
            <form className="form-stack" onSubmit={onSaveProfile}>
              <InputField
                error={profileForm.formState.errors.displayName?.message}
                label="Nome"
                {...profileForm.register('displayName')}
              />
              <InputField
                error={profileForm.formState.errors.email?.message}
                label="Email"
                type="email"
                {...profileForm.register('email')}
              />
              <Button loading={savingProfile} type="submit" icon={<Save size={16} />}>
                Salva profilo
              </Button>
            </form>
          </article>

          <article className="panel">
            <header className="panel-header">
              <div>
                <h2>Sicurezza</h2>
                <p>Password e sessione.</p>
              </div>
              <Shield size={20} aria-hidden="true" />
            </header>
            <form className="form-stack" onSubmit={onChangePassword}>
              <InputField
                autoComplete="new-password"
                error={passwordForm.formState.errors.password?.message}
                label="Nuova password"
                type="password"
                {...passwordForm.register('password')}
              />
              <InputField
                autoComplete="new-password"
                error={passwordForm.formState.errors.confirmPassword?.message}
                label="Conferma password"
                type="password"
                {...passwordForm.register('confirmPassword')}
              />
              <Button loading={savingPassword} type="submit" icon={<KeyRound size={16} />}>
                Cambia password
              </Button>
            </form>
            <SelectField
              label="Tema"
              value={settings.theme}
              onChange={(event) => handleThemeChange(event.target.value as typeof settings.theme)}
            >
              <option value="system">Sistema</option>
              <option value="light">Chiaro</option>
              <option value="dark">Scuro</option>
            </SelectField>
          </article>

          <article className="panel">
            <header className="panel-header">
              <div>
                <h2>Calendari esterni</h2>
                <p>Connessione solo su consenso esplicito.</p>
              </div>
              <PlugZap size={20} aria-hidden="true" />
            </header>
            <div className="calendar-connections">
              {(['google', 'apple'] as CalendarProvider[]).map((provider) => {
                const connection = settings.calendarConnections[provider]
                return (
                  <div className="calendar-connection-card" key={provider}>
                    <div>
                      <strong>{providerLabels[provider]}</strong>
                      <span>{connectionStatusLabels[connection.status]}</span>
                      {connection.error ? <p>{connection.error}</p> : null}
                    </div>
                    <Badge tone={connection.enabled ? 'green' : 'neutral'}>
                      {connection.enabled ? 'Attivo' : 'Disattivo'}
                    </Badge>
                    {connection.enabled ? (
                      <Button
                        loading={calendarLoading === provider}
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDisconnectCalendar(provider)}
                      >
                        Disconnetti
                      </Button>
                    ) : (
                      <Button
                        loading={calendarLoading === provider}
                        size="sm"
                        onClick={() => setCalendarWizard(provider)}
                      >
                        Connetti
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </article>
        </section>
      )}

      <Modal
        open={Boolean(calendarWizard)}
        onClose={() => setCalendarWizard(null)}
        title={calendarWizard ? `Connetti ${providerLabels[calendarWizard]}` : 'Connetti calendario'}
      >
        <div className="wizard-copy">
          <p>
            La procedura parte solo dopo la conferma. Se il flag resta disattivato non vengono
            eseguite chiamate API, letture o scritture verso calendari esterni.
          </p>
          <p>
            {calendarWizard === 'google'
              ? 'Google Calendar richiede client OAuth e autorizzazioni configurate nel progetto Google Cloud.'
              : 'Apple Calendar richiede un backend sicuro per CalDAV; le credenziali iCloud non devono essere salvate nel browser.'}
          </p>
        </div>
        <footer className="modal-actions">
          <Button variant="secondary" onClick={() => setCalendarWizard(null)}>
            Annulla
          </Button>
          <Button
            loading={calendarWizard ? calendarLoading === calendarWizard : false}
            onClick={handleStartCalendarConnection}
          >
            Conferma connessione
          </Button>
        </footer>
      </Modal>
    </div>
  )
}
