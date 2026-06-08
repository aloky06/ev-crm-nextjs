import { cn, statusColor } from '@/lib/utils'
import { Search, Inbox, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { forwardRef } from 'react'

// ── Badge ────────────────────────────────────────────────────────────────
export function Badge({ label, status, className }: { label: string; status?: string; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide',
      status ? statusColor(status) : 'bg-slate-100 text-slate-600',
      className
    )}>
      {label}
    </span>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  hint?: string
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '_')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full border border-slate-200 rounded-xl text-sm px-3 py-2.5 text-slate-800 placeholder:text-slate-400 bg-white',
              'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150',
              'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
              leftIcon && 'pl-9',
              error && 'border-red-400 focus:ring-red-400',
              className
            )}
            {...props}
          />
        </div>
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ── Select ────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string | number; label: string }[]
  placeholder?: string
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selId = id || label?.toLowerCase().replace(/\s+/g, '_')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selId} className="text-xs font-semibold text-slate-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selId}
          className={cn(
            'w-full border border-slate-200 rounded-xl text-sm px-3 py-2.5 text-slate-800 bg-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150',
            error && 'border-red-400',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

// ── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin text-blue-500', className || 'h-6 w-6')} />
}

// ── EmptyState ────────────────────────────────────────────────────────────
export function EmptyState({ title, description, action }: {
  title: string; description?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: '#f1f5f9' }}>
        <Inbox className="h-7 w-7 text-slate-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────
const STAT_CONFIGS: Record<string, { iconBg: string; iconColor: string; border: string; accent: string }> = {
  blue:   { iconBg: 'linear-gradient(135deg,#dbeafe,#eff6ff)', iconColor: '#2563eb', border: '#bfdbfe', accent: '#2563eb' },
  green:  { iconBg: 'linear-gradient(135deg,#d1fae5,#ecfdf5)', iconColor: '#059669', border: '#a7f3d0', accent: '#059669' },
  orange: { iconBg: 'linear-gradient(135deg,#fef3c7,#fffbeb)', iconColor: '#d97706', border: '#fde68a', accent: '#d97706' },
  red:    { iconBg: 'linear-gradient(135deg,#fee2e2,#fef2f2)', iconColor: '#dc2626', border: '#fecaca', accent: '#dc2626' },
  purple: { iconBg: 'linear-gradient(135deg,#ede9fe,#f5f3ff)', iconColor: '#7c3aed', border: '#ddd6fe', accent: '#7c3aed' },
}

export function Stat({ label, value, sub, icon, color = 'blue', trend }: {
  label: string; value: string | number; sub?: string
  icon?: React.ReactNode; color?: string; trend?: 'up' | 'down'
}) {
  const cfg = STAT_CONFIGS[color] || STAT_CONFIGS.blue
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4 card-hover"
      style={{
        background: '#ffffff',
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)`,
      }}>
      {icon && (
        <div className="p-3 rounded-xl flex-shrink-0"
          style={{ background: cfg.iconBg, color: cfg.iconColor }}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 break-words">{label}</p>
        <p className="text-xl xl:text-2xl font-bold text-slate-800 mt-0.5 break-words">{value}</p>
        {sub && (
          <div className="flex items-center gap-1 mt-0.5">
            {trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-400" />}
            <p className="text-xs text-slate-400 truncate">{sub}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────
export function Pagination({ current, last, onChange }: {
  current: number; last: number; onChange: (p: number) => void
}) {
  if (last <= 1) return null
  return (
    <div className="flex items-center justify-between px-5 py-3"
      style={{ borderTop: '1px solid #f1f5f9' }}>
      <p className="text-xs text-slate-500">
        Page <span className="font-semibold text-slate-700">{current}</span> of{' '}
        <span className="font-semibold text-slate-700">{last}</span>
      </p>
      <div className="flex gap-1.5">
        <button
          onClick={() => onChange(current - 1)} disabled={current === 1}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-all font-medium text-slate-600"
        >← Prev</button>
        <button
          onClick={() => onChange(current + 1)} disabled={current === last}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-all font-medium text-slate-600"
        >Next →</button>
      </div>
    </div>
  )
}

// ── SearchInput ───────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search...' }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 w-full bg-white transition-all duration-150 placeholder:text-slate-400 text-slate-800"
      />
    </div>
  )
}
