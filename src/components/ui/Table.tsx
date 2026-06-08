import { cn } from '@/lib/utils'

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
      <table className={cn('data-table', className)}>{children}</table>
    </div>
  )
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn(className)}>
      {children}
    </th>
  )
}

export function Td({ children, className, colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td className={cn(className)} colSpan={colSpan}>
      {children}
    </td>
  )
}

export function Tr({ children, onClick, className }: {
  children: React.ReactNode; onClick?: () => void; className?: string
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(onClick && 'cursor-pointer', className)}
    >
      {children}
    </tr>
  )
}

