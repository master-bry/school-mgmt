import { cn } from '../lib/utils'

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

const Button = ({ children, variant = 'primary', size = 'md', className, ...props }) => {
  return (
    <button className={cn('btn', variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}

export default Button
