import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  icon?: ReactNode
  loading?: boolean
}

export function Button({
  children,
  className,
  icon,
  loading = false,
  size = 'md',
  type = 'button',
  variant = 'primary',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx('button', `button-${variant}`, `button-${size}`, className)}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <span className="button-spinner" aria-hidden="true" /> : icon}
      <span>{children}</span>
    </button>
  )
}
