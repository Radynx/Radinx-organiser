import { zodResolver } from '@hookform/resolvers/zod'
import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { InputField } from '@/components/FormField'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { toUserMessage } from '@/lib/errors'
import { AuthShell } from '@/features/auth/AuthShell'
import { loginSchema, type LoginFormData } from '@/features/auth/auth.schemas'

export function LoginPage() {
  const { isConfigured, login } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true)
    try {
      await login(data.email, data.password)
      notify({ title: 'Bentornato', variant: 'success' })
      navigate(from, { replace: true })
    } catch (error) {
      notify({ title: 'Login non riuscito', description: toUserMessage(error), variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <AuthShell
      title="Organizza il lavoro e la giornata"
      subtitle="Accedi al tuo spazio personale per eventi, task e attività completate."
    >
      <form className="form-stack" onSubmit={onSubmit}>
        <InputField
          autoComplete="email"
          error={errors.email?.message}
          label="Email"
          type="email"
          {...register('email')}
        />
        <InputField
          autoComplete="current-password"
          error={errors.password?.message}
          label="Password"
          type="password"
          {...register('password')}
        />
        <Button disabled={!isConfigured} loading={submitting} type="submit" icon={<LogIn size={18} />}>
          Accedi
        </Button>
      </form>
      <div className="auth-links">
        <Link to="/forgot-password">Password dimenticata?</Link>
        <Link to="/register">Crea account</Link>
      </div>
    </AuthShell>
  )
}
