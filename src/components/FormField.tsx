import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

interface FieldWrapperProps {
  label: string
  error?: string
  hint?: string
  containerClassName?: string
  children: ReactNode
}

function FieldWrapper({ children, containerClassName, error, hint, label }: FieldWrapperProps) {
  return (
    <label className={clsx('field', containerClassName)}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
      {error ? <strong role="alert">{error}</strong> : null}
    </label>
  )
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  containerClassName?: string
}

export function InputField({ containerClassName, error, hint, label, ...props }: InputFieldProps) {
  return (
    <FieldWrapper containerClassName={containerClassName} error={error} hint={hint} label={label}>
      <input {...props} />
    </FieldWrapper>
  )
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
  containerClassName?: string
}

export function TextareaField({ containerClassName, error, hint, label, ...props }: TextareaFieldProps) {
  return (
    <FieldWrapper containerClassName={containerClassName} error={error} hint={hint} label={label}>
      <textarea {...props} />
    </FieldWrapper>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
  containerClassName?: string
  children: ReactNode
}

export function SelectField({ children, containerClassName, error, hint, label, ...props }: SelectFieldProps) {
  return (
    <FieldWrapper containerClassName={containerClassName} error={error} hint={hint} label={label}>
      <select {...props}>{children}</select>
    </FieldWrapper>
  )
}
