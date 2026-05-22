import type { ReactNode } from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: ReactNode
  tone?: 'neutral' | 'blue' | 'green' | 'red' | 'amber' | 'violet'
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span className={clsx('badge', `badge-${tone}`)}>{children}</span>
}
