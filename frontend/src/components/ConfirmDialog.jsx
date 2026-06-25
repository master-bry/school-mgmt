import * as Dialog from '@radix-ui/react-dialog'
import { X, AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react'
import Button from './Button'

const iconMap = {
  danger: { icon: Trash2, bg: 'bg-red-100', color: 'text-red-600' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-100', color: 'text-amber-600' },
  info: { icon: Info, bg: 'bg-blue-100', color: 'text-blue-600' },
  success: { icon: CheckCircle, bg: 'bg-emerald-100', color: 'text-emerald-600' },
}

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  onConfirm,
  loading = false,
}) => {
  const ico = iconMap[variant] || iconMap.warning
  const Icon = ico.icon

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] z-50">
          <Dialog.Close className="absolute right-4 top-4 p-1 text-secondary-400 hover:text-secondary-600 rounded-lg hover:bg-secondary-100 transition-colors">
            <X className="w-4 h-4" />
          </Dialog.Close>

          <div className="flex items-start space-x-4">
            <div className={`p-2.5 rounded-full ${ico.bg} flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${ico.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-lg font-semibold text-secondary-900">
                {title}
              </Dialog.Title>
              {message && (
                <Dialog.Description className="mt-1.5 text-sm text-secondary-500 leading-relaxed">
                  {message}
                </Dialog.Description>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Dialog.Close asChild>
              <Button variant="secondary" disabled={loading}>
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Processing...' : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default ConfirmDialog
