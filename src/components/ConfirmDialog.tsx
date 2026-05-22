import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
}

export function ConfirmDialog({
  confirmLabel,
  description,
  loading = false,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="confirm-body">
        <AlertTriangle size={26} aria-hidden="true" />
        <p>{description}</p>
      </div>
      <footer className="modal-actions">
        <Button variant="secondary" onClick={onCancel}>
          Annulla
        </Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </footer>
    </Modal>
  )
}
