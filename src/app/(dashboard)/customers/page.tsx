'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/lib/api'
import { formatDate, getErrorMessage } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, SearchInput, Spinner, EmptyState, Pagination, Input, Select } from '@/components/ui/Badge'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Users, Plus, Eye, Phone, MapPin, UserCheck } from 'lucide-react'

export default function CustomersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [viewItem, setViewItem] = useState<Record<string, unknown> | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search, districtId],
    queryFn: () => api.get('/customers', {
      params: { page, search: search || undefined, district_id: districtId || undefined }
    }).then(r => r.data),
  })

  const { data: districtsData } = useQuery({
    queryKey: ['districts'],
    queryFn: () => api.get('/districts').then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Record<string, string>>()

  const createMutation = useMutation({
    mutationFn: (d: Record<string, string>) => api.post('/customers', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer created!')
      setShowAdd(false)
      reset()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const customers = data?.customers?.data || []
  const meta = data?.customers?.meta || {}
  const districts = (districtsData?.districts || []).map((d: Record<string, unknown>) => ({
    value: d.id as number,
    label: d.name as string,
  }))

  return (
    <div className="fade-in-up">
      <PageHeader
        title="Customers"
        subtitle={`${meta.total || 0} total customers`}
        icon={<Users className="h-5 w-5" />}
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>
            Add Customer
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-[220px]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, mobile, city..." />
        </div>
        <select
          value={districtId} onChange={e => setDistrictId(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[160px]"
        >
          <option value="">All Districts</option>
          {districts.map((d: { value: number; label: string }) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-48"><Spinner /></div>
        ) : customers.length === 0 ? (
          <EmptyState title="No customers found" description="Add your first customer to get started"
            action={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>Add Customer</Button>} />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Customer</Th><Th>Mobile</Th><Th>District</Th><Th>City</Th><Th>Status</Th><Th>Joined</Th><Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {customers.map((c: Record<string, unknown>) => (
                  <Tr key={c.id as number}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#2563eb,#8b5cf6)' }}>
                          {(c.name as string)?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{c.name as string}</p>
                          <p className="text-xs text-slate-400">{(c.email as string) || '—'}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1 text-sm text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400" />{c.mobile as string}
                      </span>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1 text-xs text-slate-600">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {(c.district as Record<string, unknown>)?.name as string || '—'}
                      </span>
                    </Td>
                    <Td className="text-sm text-slate-600">{(c.city as string) || '—'}</Td>
                    <Td>
                      <Badge label={c.is_active ? 'active' : 'inactive'} status={c.is_active ? 'active' : 'inactive'} />
                    </Td>
                    <Td className="text-xs text-slate-400">{formatDate(c.created_at as string)}</Td>
                    <Td>
                      <Button size="sm" variant="ghost" leftIcon={<Eye className="h-3.5 w-3.5" />}
                        onClick={() => setViewItem(c)}>View</Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination current={meta.current_page || 1} last={meta.last_page || 1} onChange={setPage} />
          </>
        )}
      </Card>

      {/* Add Customer Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title="Add Customer" subtitle="Create a new customer record" size="lg">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" {...register('name', { required: 'Required' })} error={errors.name?.message} />
            <Input label="Mobile" {...register('mobile', { required: 'Required' })} error={errors.mobile?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" {...register('email')} />
            <Select label="District" options={districts} {...register('district_id', { required: 'Required' })}
              error={errors.district_id?.message} placeholder="Select district..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" {...register('city')} />
            <Input label="Pincode" {...register('pincode')} />
          </div>
          <Input label="Address" {...register('address')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Aadhaar (12 digits)" {...register('aadhaar')} />
            <Input label="GSTIN (optional)" {...register('gstin')} />
          </div>
          <div className="pt-3 flex gap-3 justify-end" style={{ borderTop: '1px solid #f1f5f9' }}>
            <Button variant="outline" type="button" onClick={() => { setShowAdd(false); reset() }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create Customer</Button>
          </div>
        </form>
      </Modal>

      {/* View Customer Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Customer Details" size="lg">
        {viewItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#2563eb,#8b5cf6)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                {(viewItem.name as string)?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">{viewItem.name as string}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{viewItem.mobile as string} · {(viewItem.email as string) || 'No email'}</p>
                <div className="mt-1.5">
                  <Badge label={viewItem.is_active ? 'active' : 'inactive'} status={viewItem.is_active ? 'active' : 'inactive'} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['District', (viewItem.district as Record<string, unknown>)?.name as string || '—', 'bi-geo-alt'],
                ['City', (viewItem.city as string) || '—', 'bi-building'],
                ['Pincode', (viewItem.pincode as string) || '—', 'bi-mailbox'],
                ['Aadhaar', (viewItem.aadhaar as string) || '—', 'bi-card-heading'],
                ['GSTIN', (viewItem.gstin as string) || '—', 'bi-receipt'],
                ['Joined', formatDate(viewItem.created_at as string), 'bi-calendar'],
              ].map(([k, v, icon]) => (
                <div key={k} className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1"><i className={`bi ${icon}`} />{k}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            {viewItem.address && (
              <div className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <p className="text-[11px] text-slate-400 flex items-center gap-1"><i className="bi bi-house" />Address</p>
                <p className="text-sm text-slate-700 mt-0.5">{viewItem.address as string}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
