import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { InputField } from '@/components/FormField'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { toUserMessage } from '@/lib/errors'
import { AuthShell } from '@/features/auth/AuthShell'
import { registerSchema, type RegisterFormData } from '@/features/auth/auth.schemas'

export function RegisterPage() {
  const { isConfigured, register: registerAccount } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true)
    try {
      await registerAccount({
        displayName: data.displayName,
        email: data.email,
        password: data.password,
      })
      notify({ title: 'Account creato', variant: 'success' })
      navigate('/', { replace: true })
    } catch (error) {
      notify({
        title: 'Registrazione non riuscita',
        description: toUserMessage(error),
        variant: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <AuthShell
      title="Crea il tuo organizer"
      subtitle="I dati vengono salvati in Firebase e restano separati per singolo utente."
    >
      <form className="form-stack" onSubmit={onSubmit}>
        <InputField
          autoComplete="name"
          error={errors.displayName?.message}
          label="Nome"
          {...register('displayName')}
        />
        <InputField
          autoComplete="email"
          error={errors.email?.message}
          label="Email"
          type="email"
          {...register('email')}
        />
        <InputField
          autoComplete="new-password"
          error={errors.password?.message}
          label="Password"
          type="password"
          {...register('password')}
        />
        <InputField
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          label="Conferma password"
          type="password"
          {...register('confirmPassword')}
        />
        <Button disabled={!isConfigured} loading={submitting} type="submit" icon={<UserPlus size={18} />}>
          Registrati
        </Button>
      </form>
      <div className="auth-links">
        <Link to="/login">Hai già un account?</Link>
      </div>
    </AuthShell>
  )
}
