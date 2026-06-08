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
import { Store, Plus, Eye } from 'lucide-react'

export default function DealersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [viewItem, setViewItem] = useState<Record<string, unknown> | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['dealers', page, search, districtId],
    queryFn: () => api.get('/dealers', {
      params: { page, search: search || undefined, district_id: districtId || undefined }
    }).then(r => r.data),
  })

  const { data: districtsData } = useQuery({
    queryKey: ['districts'],
    queryFn: () => api.get('/districts').then(r => r.data),
  })


  const { data: bdeData } = useQuery({ queryKey: ['bde-list'], queryFn: () => api.get('/bde-users').then(r => r.data) })

  const bdeUsers = (bdeData?.bde_users?.data || []).map((b: Record<string, unknown>) => ({ value: b.id as number, label: (b.user as Record<string,unknown>)?.name as string }))

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Record<string, string>>()

  // const createMutation = useMutation({
  //   mutationFn: (d: Record<string, string>) => api.post('/dealers', d),
  //   onSuccess: () => {
  //     qc.invalidateQueries({ queryKey: ['dealers'] })
  //     toast.success('Dealer created!')
  //     setShowAdd(false)
  //     reset()
  //   },
  //   onError: (err) => toast.error(getErrorMessage(err)),
  // })


   const createMutation = useMutation({
  mutationFn: (d: Record<string, string>) => {
    const payload = {
      ...d,
      district_id: Number(d.district_id),
      bde_id: d.bde_id ? Number(d.bde_id) : undefined,
      credit_limit: d.credit_limit ? Number(d.credit_limit) : undefined,
    }
    console.log('📦 Payload being sent:', payload)
    return api.post('/dealers', payload)
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['dealers'] })
    toast.success('Dealer created!')
    setShowAdd(false)
    reset()
  },
  onError: (err: any) => {
    console.error('❌ Full error response:', err?.response?.data)
    toast.error(getErrorMessage(err))
  },
})

const toggleActiveMutation = useMutation({
  mutationFn: (id: number) =>
    api.patch(`/dealers/${id}/toggle-active`),

  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['dealers'] })
    toast.success('Dealer status updated')
  },

  onError: (err) => {
    toast.error(getErrorMessage(err))
  },
})

  const dealers = data?.dealers?.data || []
  const meta = data?.dealers?.meta || {}
  const districts = (districtsData?.districts || []).map((d: Record<string, unknown>) => ({
    value: d.id as number,
    label: d.name as string,
  }))


  return (
    <div className="fade-in-up">
      <PageHeader
        title="Dealers"
        subtitle={`${meta.total || 0} registered dealers`}
        icon={<Store className="h-5 w-5" />}
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>
            Add Dealer
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-[220px]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search business name..." />
        </div>
        <select value={districtId} onChange={e => setDistrictId(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[160px]">
          <option value="">All Districts</option>
          {districts.map((d: { value: number; label: string }) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-48"><Spinner /></div>
        ) : dealers.length === 0 ? (
          <EmptyState title="No dealers found" description="Add your first dealer to get started"
            action={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>Add Dealer</Button>} />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Dealer</Th><Th>District</Th><Th>Mobile</Th><Th>GST No.</Th><Th>Order Route</Th><Th>Status</Th><Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {dealers.map((d: Record<string, unknown>) => (
                  <Tr key={d.id as number}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#10b981,#0d9488)' }}>
                          {(d.business_name as string)?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{d.business_name as string}</p>
                          <p className="text-xs text-slate-400">{d.owner_name as string}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-sm text-slate-600">{(d.district as Record<string, unknown>)?.name as string || '—'}</Td>
                    <Td className="text-sm text-slate-600">{d.mobile as string}</Td>
                    <Td>
                      <span className="font-mono text-xs text-slate-600">{(d.gst_number as string) || '—'}</span>
                    </Td>
                    <Td>
                      {d.can_order_direct ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#dbeafe', color: '#1d4ed8' }}>Direct</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#f0fdf4', color: '#15803d' }}>Via Distributor</span>
                      )}
                    </Td>
                    <Td><Badge label={d.is_active ? 'active' : 'inactive'} status={d.is_active ? 'active' : 'inactive'} /></Td>
                    <Td>
                      <button
                        onClick={() => toggleActiveMutation.mutate(d.id as number)}
                        className={`px-3 py-1 rounded text-white text-sm ${
                          d.is_active
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {d.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </Td>
                    <Td>
                      <Button size="sm" variant="ghost" leftIcon={<Eye className="h-3.5 w-3.5" />} onClick={() => setViewItem(d)}>View</Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination current={meta.current_page || 1} last={meta.last_page || 1} onChange={setPage} />
          </>
        )}
      </Card>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title="Add Dealer" subtitle="Register a new dealer" size="xl">
        <form 

        
         onSubmit={handleSubmit(
    (d) => createMutation.mutate(d),
    (validationErrors) => console.log('🚫 Validation failed:', validationErrors)
  )}
  className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Business Name" {...register('business_name', { required: 'Required' })} error={errors.business_name?.message} />
            <Input label="Owner Name" {...register('name', { required: 'Required' })} error={errors.owner_name?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Mobile" {...register('mobile', { required: 'Required' })} error={errors.mobile?.message} />
            <Input label="Email" type="email" {...register('email')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Password" type="password" {...register('password', { required: 'Required' })} error={errors.password?.message} />
            <Select label="District" options={districts} {...register('district_id', { required: 'Required' })} error={errors.district_id?.message} placeholder="Select..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="BDE (optional)" options={bdeUsers} {...register('bde_id')} placeholder="Select BDE..." />
            <Input label="GSTIN" {...register('gstin')} />
          </div>

          
          <div className="grid grid-cols-2 gap-4">
            <Input label="PAN Number" {...register('pan_number')} />
            <Input label="Pincode" {...register('pincode')} />
          </div>
          <Input label="Address" {...register('address')} />
          <div className="pt-3 flex gap-3 justify-end" style={{ borderTop: '1px solid #f1f5f9' }}>
            <Button variant="outline" type="button" onClick={() => { setShowAdd(false); reset() }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create Dealer</Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Dealer Details" size="lg">
        {viewItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#10b981,#0d9488)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                {(viewItem.business_name as string)?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">{viewItem.business_name as string}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{viewItem.owner_name as string} · {viewItem.mobile as string}</p>
                <div className="mt-1.5 flex gap-1.5">
                  <Badge label={viewItem.is_active ? 'active' : 'inactive'} status={viewItem.is_active ? 'active' : 'inactive'} />
                  {viewItem.can_order_direct && <Badge label="Direct Order" />}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['District', (viewItem.district as Record<string, unknown>)?.name as string || '—', 'bi-geo-alt'],
                ['BDE', (viewItem.bde as Record<string, unknown>)?.user ? ((viewItem.bde as Record<string, unknown>).user as Record<string, unknown>).name as string : '—', 'bi-person-badge'],
                ['GST Number', (viewItem.gst_number as string) || '—', 'bi-receipt'],
                ['PAN Number', (viewItem.pan_number as string) || '—', 'bi-card-heading'],
                ['Email', (viewItem.email as string) || '—', 'bi-envelope'],
                ['Joined', formatDate(viewItem.created_at as string), 'bi-calendar'],
              ].map(([k, v, icon]) => (
                <div key={k} className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1"><i className={`bi ${icon}`} />{k}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
