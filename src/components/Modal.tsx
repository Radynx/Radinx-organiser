import { useId, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  description?: string
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Modal({ children, description, onClose, open, title }: ModalProps) {
  const titleId = useId()

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Chiudi">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}
