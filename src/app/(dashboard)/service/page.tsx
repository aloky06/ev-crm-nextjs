'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/lib/api'
import { formatDate, getErrorMessage } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, Spinner, EmptyState, Pagination, Input, Select } from '@/components/ui/Badge'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Wrench, Plus, CheckCircle, X } from 'lucide-react'

const STATUS_OPTS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]
const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  scheduled:  { bg: '#dbeafe', color: '#1d4ed8' },
  completed:  { bg: '#d1fae5', color: '#065f46' },
  cancelled:  { bg: '#fee2e2', color: '#b91c1c' },
  available:  { bg: '#f1f5f9', color: '#64748b' },
}

export default function ServicePage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [showBook, setShowBook] = useState(false)
  const [completeItem, setCompleteItem] = useState<Record<string, unknown> | null>(null)
  const [cancelItem, setCancelItem] = useState<Record<string, unknown> | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['service-bookings', page, statusFilter, from, to],
    queryFn: () => api.get('/service/bookings', {
      params: { page, status: statusFilter || undefined, from: from || undefined, to: to || undefined }
    }).then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Record<string, string>>()
  const { register: reg2, handleSubmit: hs2, reset: reset2 } = useForm<Record<string, string>>()
  const { register: reg3, handleSubmit: hs3, reset: reset3 } = useForm<Record<string, string>>()

  const bookMutation = useMutation({
    mutationFn: (d: Record<string, string>) => api.post('/service/book', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['service-bookings'] }); toast.success('Service booked!'); setShowBook(false); reset() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
  const completeMutation = useMutation({
    mutationFn: ({ id, d }: { id: number; d: Record<string, string> }) => api.patch(`/service/bookings/${id}/complete`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['service-bookings'] }); toast.success('Service completed!'); setCompleteItem(null); reset2() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
  const cancelMutation = useMutation({
    mutationFn: ({ id, d }: { id: number; d: Record<string, string> }) => api.patch(`/service/bookings/${id}/cancel`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['service-bookings'] }); toast.success('Booking cancelled, slot returned.'); setCancelItem(null); reset3() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const bookings = data?.bookings?.data || []
  const meta = data?.bookings?.meta || {}

  return (
    <div className="fade-in-up">
      <PageHeader
        title="Service Bookings"
        subtitle="Free service entitlement management"
        icon={<Wrench className="h-5 w-5" />}
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowBook(true)}>Book Service</Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {[{ value: '', label: 'All' }, ...STATUS_OPTS].map(o => (
          <button key={o.value} onClick={() => { setStatusFilter(o.value); setPage(1) }}
            className="px-3 py-1.5 text-xs rounded-xl font-semibold transition-all"
            style={statusFilter === o.value ? {
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
            } : { background: '#f1f5f9', color: '#64748b' }}>
            {o.label}
          </button>
        ))}
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-48"><Spinner /></div>
        ) : bookings.length === 0 ? (
          <EmptyState title="No service bookings" description="Book a free service slot for a customer"
            action={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowBook(true)}>Book Service</Button>} />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr><Th>Customer</Th><Th>Vehicle</Th><Th>Slot #</Th><Th>Service Date</Th><Th>Technician</Th><Th>Status</Th><Th></Th></Tr>
              </Thead>
              <Tbody>
                {bookings.map((b: Record<string, unknown>) => {
                  const sc = STATUS_STYLES[b.status as string] || STATUS_STYLES.available
                  const ent = b.entitlement as Record<string, unknown>
                  return (
                    <Tr key={b.id as number}>
                      <Td>
                        <p className="font-semibold text-slate-800 text-sm">{(ent?.customer as Record<string,unknown>)?.name as string}</p>
                        <p className="text-xs text-slate-400">{(ent?.customer as Record<string,unknown>)?.mobile as string}</p>
                      </Td>
                      <Td><span className="font-mono text-xs text-blue-600">{(ent?.vehicle as Record<string,unknown>)?.chassis_number as string}</span></Td>
                      <Td>
                        <span className="w-6 h-6 rounded-lg inline-flex items-center justify-center text-xs font-bold"
                          style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                          {b.slot_number as number}
                        </span>
                      </Td>
                      <Td className="text-sm text-slate-700">{formatDate(b.service_date as string)}</Td>
                      <Td className="text-xs text-slate-500">{(b.technician_name as string) || '—'}</Td>
                      <Td>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                          style={{ background: sc.bg, color: sc.color }}>
                          {b.status as string}
                        </span>
                      </Td>
                      <Td>
                        {b.status === 'scheduled' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost"
                              style={{ color: '#10b981' }}
                              leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
                              onClick={() => { setCompleteItem(b); reset2() }}>Complete</Button>
                            <Button size="sm" variant="ghost"
                              style={{ color: '#ef4444' }}
                              leftIcon={<X className="h-3.5 w-3.5" />}
                              onClick={() => { setCancelItem(b); reset3() }}>Cancel</Button>
                          </div>
                        )}
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

      {/* Book Service Modal */}
      <Modal open={showBook} onClose={() => { setShowBook(false); reset() }} title="Book Service Slot" subtitle="Free service for customer vehicle" size="md">
        <form onSubmit={handleSubmit(d => bookMutation.mutate(d))} className="space-y-4">
          <Input label="Vehicle ID" type="number" {...register('vehicle_id', { required: 'Required' })} error={errors.vehicle_id?.message as string} hint="Enter vehicle ID to book service" />
          <Input label="Customer ID" type="number" {...register('customer_id', { required: 'Required' })} error={errors.customer_id?.message as string} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Service Date" type="date" {...register('service_date', { required: 'Required' })} error={errors.service_date?.message as string} />
            <Input label="Service Time (optional)" type="time" {...register('service_time')} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Customer Complaint (optional)</label>
            <textarea {...register('customer_complaint')} rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all resize-none" />
          </div>
          <div className="pt-3 flex gap-3 justify-end" style={{ borderTop: '1px solid #f1f5f9' }}>
            <Button variant="outline" type="button" onClick={() => { setShowBook(false); reset() }}>Cancel</Button>
            <Button type="submit" loading={bookMutation.isPending}>Book Slot</Button>
          </div>
        </form>
      </Modal>

      {/* Complete Service Modal */}
      <Modal open={!!completeItem} onClose={() => setCompleteItem(null)} title="Mark Service Complete" size="md">
        {completeItem && (
          <form onSubmit={hs2(d => completeMutation.mutate({ id: completeItem.id as number, d }))} className="space-y-4">
            <Input label="Technician Name *" {...reg2('technician_name', { required: 'Required' })} />
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Service Notes</label>
              <textarea {...reg2('technician_note')} rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Extra Charge (₹)" type="number" {...reg2('extra_charge')} />
              <Input label="Actual Service Date" type="date" {...reg2('service_date')} />
            </div>
            <div className="pt-3 flex gap-3 justify-end" style={{ borderTop: '1px solid #f1f5f9' }}>
              <Button variant="outline" type="button" onClick={() => setCompleteItem(null)}>Cancel</Button>
              <Button type="submit" loading={completeMutation.isPending}>Mark Complete</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal open={!!cancelItem} onClose={() => setCancelItem(null)} title="Cancel Booking" subtitle="Slot will be returned to customer" size="sm">
        {cancelItem && (
          <form onSubmit={hs3(d => cancelMutation.mutate({ id: cancelItem.id as number, d }))} className="space-y-4">
            <div className="p-3 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <p className="text-xs text-red-700">The service slot will be returned and customer can rebook.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Cancel Reason *</label>
              <textarea {...reg3('cancel_reason', { required: 'Required', minLength: { value: 5, message: 'Min 5 chars' } })} rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all resize-none" />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" type="button" onClick={() => setCancelItem(null)}>Back</Button>
              <Button variant="danger" type="submit" loading={cancelMutation.isPending}>Cancel Booking</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
