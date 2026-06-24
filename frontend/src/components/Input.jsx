import { cn } from '../lib/utils'

const Input = ({ label, icon: Icon, className, ...props }) => {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        )}
        <input className={cn('input', Icon && 'pl-10', className)} {...props} />
      </div>
    </div>
  )
}

export default Input
