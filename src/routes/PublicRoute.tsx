import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function PublicRoute({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth()

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  return children
}
