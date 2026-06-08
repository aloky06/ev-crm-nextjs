import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  primary:   { background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', boxShadow: '0 4px 12px rgba(37,99,235,0.35)' },
  secondary: { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' },
  danger:    { background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', boxShadow: '0 4px 12px rgba(220,38,38,0.25)' },
  success:   { background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', boxShadow: '0 4px 12px rgba(5,150,105,0.25)' },
  ghost:     { background: 'transparent', color: '#475569' },
  outline:   { background: '#fff', color: '#475569', border: '1px solid #e2e8f0' },
}

export function Button({
  variant = 'primary', size = 'md', loading, leftIcon, children, className, disabled, style, ...props
}: ButtonProps) {
  const sizeClass = {
    sm: 'text-xs px-3 h-8',
    md: 'text-sm px-4 h-9',
    lg: 'text-sm px-5 h-10',
  }[size]

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95',
        sizeClass,
        className
      )}
      style={{ ...VARIANT_STYLES[variant], ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : leftIcon}
      {children}
    </button>
  )
}
