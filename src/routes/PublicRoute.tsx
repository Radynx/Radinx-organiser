import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Skeleton } from '@/components/Skeleton'
import { useAuth } from '@/contexts/AuthContext'

export function PublicRoute({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <main className="auth-screen">
        <Skeleton lines={4} />
      </main>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}
