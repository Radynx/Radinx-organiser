import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { InputField } from '@/components/FormField'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { toUserMessage } from '@/lib/errors'
import { AuthShell } from '@/features/auth/AuthShell'
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@/features/auth/auth.schemas'

export function ForgotPasswordPage() {
  const { isConfigured, resetPassword } = useAuth()
  const { notify } = useToast()
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) })

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true)
    try {
      await resetPassword(data.email)
      setSent(true)
      notify({
        title: 'Email di recupero inviata',
        description: 'Controlla la posta in arrivo e la cartella spam.',
        variant: 'success',
      })
    } catch (error) {
      notify({ title: 'Recupero non riuscito', description: toUserMessage(error), variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <AuthShell
      title="Recupera password"
      subtitle="Inserisci la tua email: Firebase gestirà il link sicuro di reset."
    >
      {sent ? (
        <div className="success-panel">
          <strong>Richiesta completata</strong>
          <p>
            Se l’account esiste, riceverai un messaggio con il link per impostare una nuova
            password.
          </p>
          <Link to="/login">Torna al login</Link>
        </div>
      ) : (
        <form className="form-stack" onSubmit={onSubmit}>
          <InputField
            autoComplete="email"
            error={errors.email?.message}
            label="Email"
            type="email"
            {...register('email')}
          />
          <Button disabled={!isConfigured} loading={submitting} type="submit" icon={<Send size={18} />}>
            Invia reset password
          </Button>
        </form>
      )}
      <div className="auth-links">
        <Link to="/login">Torna al login</Link>
      </div>
    </AuthShell>
  )
}
