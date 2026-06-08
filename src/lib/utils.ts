import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n || 0)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    if (e.response?.data?.errors) {
      return Object.values(e.response.data.errors).flat().join(', ')
    }
    if (e.response?.data?.message) return e.response.data.message
  }
  return 'Something went wrong. Please try again.'
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    paid: 'bg-green-100 text-green-700',
    dispatched: 'bg-purple-100 text-purple-700',
    received: 'bg-green-100 text-green-700',
    via_distributor: 'bg-blue-100 text-blue-700',
    direct_company: 'bg-orange-100 text-orange-700',
    with_warranty: 'bg-blue-100 text-blue-700',
    with_guarantee: 'bg-green-100 text-green-700',
    no_warranty: 'bg-gray-100 text-gray-600',
    lithium_ion: 'bg-purple-100 text-purple-700',
    lead_acid: 'bg-yellow-100 text-yellow-700',
    in_stock_dealer: 'bg-green-100 text-green-700',
    in_stock_company: 'bg-blue-100 text-blue-700',
    sold_to_customer: 'bg-gray-100 text-gray-600',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}
