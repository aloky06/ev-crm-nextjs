import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions, className, icon }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-7', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb, #10b981)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
