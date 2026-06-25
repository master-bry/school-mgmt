import * as Toast from '@radix-ui/react-toast'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const variantStyles = {
  success: { bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle, color: 'text-emerald-600' },
  error: { bg: 'bg-red-50 border-red-200', icon: AlertCircle, color: 'text-red-600' },
  warning: { bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle, color: 'text-amber-600' },
  info: { bg: 'bg-blue-50 border-blue-200', icon: Info, color: 'text-blue-600' },
}

const ToastProvider = ({ children }) => {
  return (
    <Toast.Provider swipeDirection="right">
      {children}
      <Toast.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 md:max-w-[420px]" />
    </Toast.Provider>
  )
}

const ToastNotification = ({ open, onOpenChange, title, description, variant = 'info', duration = 4000 }) => {
  const styles = variantStyles[variant] || variantStyles.info
  const Icon = styles.icon

  return (
    <Toast.Root
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
      className={`${styles.bg} border rounded-xl shadow-lg p-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full transition-all`}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 mt-0.5 ${styles.color} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <Toast.Title className="text-sm font-semibold text-secondary-900">
            {title}
          </Toast.Title>
          {description && (
            <Toast.Description className="mt-0.5 text-xs text-secondary-500">
              {description}
            </Toast.Description>
          )}
        </div>
        <Toast.Close className="p-0.5 text-secondary-400 hover:text-secondary-600 rounded flex-shrink-0">
          <X className="w-4 h-4" />
        </Toast.Close>
      </div>
    </Toast.Root>
  )
}

export { ToastProvider, ToastNotification }
