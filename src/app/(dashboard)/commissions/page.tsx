'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/lib/api'
import { formatDate, formatCurrency, getErrorMessage } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, Spinner, EmptyState, Pagination, Stat } from '@/components/ui/Badge'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { TrendingUp, CreditCard } from 'lucide-react'

export default function CommissionsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showPay, setShowPay] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['commissions', page, statusFilter],
    queryFn: () => api.get('/bde/commissions', {
      params: { page, status: statusFilter || undefined }
    }).then(r => r.data),
  })

  const { data: bdeData } = useQuery({ queryKey: ['bde-list'], queryFn: () => api.get('/bde-users').then(r => r.data) })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Record<string, string>>()

  const payMutation = useMutation({
    mutationFn: (d: Record<string, string>) => api.post('/bde/commissions/pay', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commissions'] }); toast.success('Commissions paid!'); setShowPay(false); reset() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const commissions = data?.commissions?.data || []
  const meta = data?.commissions?.meta || {}
  const bdeUsers = (bdeData?.bde_users?.data || []).map((b: Record<string, unknown>) => ({ value: b.id as number, label: (b.user as Record<string,unknown>)?.name as string }))

  const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    pending: { bg: '#fef3c7', color: '#d97706' },
    paid:    { bg: '#d1fae5', color: '#065f46' },
  }

  return (
    <div className="fade-in-up">
      <PageHeader
        title="BDE Commissions"
        subtitle="Commission payments and statements"
        icon={<TrendingUp className="h-5 w-5" />}
        actions={
          <Button size="sm" leftIcon={<CreditCard className="h-3.5 w-3.5" />} onClick={() => setShowPay(true)}>Pay Commissions</Button>
        }
      />

      {/* Status filter */}
      <div className="flex gap-2 mb-5">
        {[{ value: '', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' }].map(o => (
          <button key={o.value} onClick={() => { setStatusFilter(o.value); setPage(1) }}
            className="px-3 py-1.5 text-xs rounded-xl font-semibold transition-all"
            style={statusFilter === o.value ? {
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
            } : { background: '#f1f5f9', color: '#64748b' }}>
            {o.label}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-48"><Spinner /></div>
        ) : commissions.length === 0 ? (
          <EmptyState title="No commissions found" description="Commission records will appear here after sales" />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr><Th>BDE</Th><Th>Invoice</Th><Th>Sale Date</Th><Th>Commission</Th><Th>Earned</Th><Th>Status</Th></Tr>
              </Thead>
              <Tbody>
                {commissions.map((c: Record<string, unknown>) => {
                  const sc = STATUS_STYLES[c.payment_status as string] || { bg: '#f1f5f9', color: '#64748b' }
                  return (
                    <Tr key={c.id as number}>
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#2563eb,#8b5cf6)' }}>
                            {(c.bde as Record<string,unknown>)?.user?.toString()?.[0]?.toUpperCase() || 'B'}
                          </div>
                          <span className="text-sm font-medium text-slate-800">
                            {((c.bde as Record<string,unknown>)?.user as Record<string,unknown>)?.name as string || '—'}
                          </span>
                        </div>
                      </Td>
                      <Td><span className="font-mono text-xs text-blue-600">{(c.sale as Record<string,unknown>)?.invoice_number as string}</span></Td>
                      <Td className="text-xs text-slate-500">{formatDate((c.sale as Record<string,unknown>)?.sold_at as string)}</Td>
                      <Td className="font-bold text-emerald-600 text-sm">{formatCurrency(c.commission_rate_rs as number)}</Td>
                      <Td className="text-xs text-slate-500">{formatDate(c.earned_at as string)}</Td>
                      <Td>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                          style={{ background: sc.bg, color: sc.color }}>
                          {c.payment_status as string}
                        </span>
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
            <Pagination current={meta.current_page || 1} last={meta.last_page || 1} onChange={setPage} />
          </>
        )}
      </Card>

      {/* Pay Commissions Modal */}
      <Modal open={showPay} onClose={() => { setShowPay(false); reset() }} title="Pay Commissions" subtitle="Bulk commission payment to BDE" size="md">
        <form onSubmit={handleSubmit(d => payMutation.mutate(d))} className="space-y-4">
          <div className="p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p className="text-xs text-emerald-700 flex items-center gap-1.5">
              <i className="bi bi-info-circle-fill" />
              This will mark all pending commissions as paid for the selected BDE.
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Select BDE</label>
            <select {...register('bde_id', { required: 'Required' })}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all">
              <option value="">Select BDE...</option>
              {bdeUsers.map((b: { value: number; label: string }) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            {errors.bde_id && <p className="text-xs text-red-500 mt-1">{errors.bde_id.message as string}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Payment Mode</label>
            <select {...register('payment_mode', { required: 'Required' })}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all">
              <option value="">Select mode...</option>
              {['cash', 'upi', 'bank_transfer', 'cheque'].map(m => <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>)}
            </select>
            {errors.payment_mode && <p className="text-xs text-red-500 mt-1">{errors.payment_mode.message as string}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Payment Reference</label>
            <input {...register('payment_reference')}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all" />
          </div>
          <div className="pt-3 flex gap-3 justify-end" style={{ borderTop: '1px solid #f1f5f9' }}>
            <Button variant="outline" type="button" onClick={() => { setShowPay(false); reset() }}>Cancel</Button>
            <Button type="submit" loading={payMutation.isPending}>Process Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
