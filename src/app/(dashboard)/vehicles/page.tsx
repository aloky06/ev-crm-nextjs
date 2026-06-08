'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/lib/api'
import { formatDate, formatCurrency, getErrorMessage } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, SearchInput, Spinner, EmptyState, Pagination, Input, Select } from '@/components/ui/Badge'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'
import { Zap, Plus, Eye, ArrowRight, Battery, Plug } from 'lucide-react'

const STATUS_OPTS = [
  { value: 'in_stock_company',     label: 'Company Stock' },
  { value: 'in_stock_distributor', label: 'Distributor Stock' },
  { value: 'in_stock_dealer',      label: 'Dealer Stock' },
  { value: 'in_transit',           label: 'In Transit' },
  { value: 'sold_to_customer',     label: 'Sold' },
  { value: 'returned',             label: 'Returned' },
]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  in_stock_company:     { bg: '#dbeafe', color: '#1d4ed8' },
  in_stock_distributor: { bg: '#ede9fe', color: '#7c3aed' },
  in_stock_dealer:      { bg: '#d1fae5', color: '#065f46' },
  in_transit:           { bg: '#fef08a', color: '#854d0e' },
  sold_to_customer:     { bg: '#f1f5f9', color: '#475569' },
  returned:             { bg: '#fee2e2', color: '#b91c1c' },
}

export default function VehiclesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [productId, setProductId] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [viewItem, setViewItem] = useState<Record<string, unknown> | null>(null)
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null)
  const [transferItem, setTransferItem] = useState<Record<string, unknown> | null>(null)
  const [transferType, setTransferType] = useState<'dealer' | 'distributor'>('dealer')

  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', page, search, statusFilter, productId],
    queryFn: () => api.get('/vehicles', {
      params: { page, search: search || undefined, status: statusFilter || undefined, product_id: productId || undefined }
    }).then(r => r.data),
  })
  const { data: productsData } = useQuery({ queryKey: ['products-list'], queryFn: () => api.get('/products').then(r => r.data) })
  const { data: dealersData } = useQuery({ queryKey: ['dealers-list'], queryFn: () => api.get('/dealers').then(r => r.data) })
  const { data: distributorsData } = useQuery({ queryKey: ['distributors-list'], queryFn: () => api.get('/distributors').then(r => r.data) })

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<any>()
  const { register: reg2, handleSubmit: hs2, reset: reset2 } = useForm<any>()

  const createMutation = useMutation({
    mutationFn: (d: Record<string, string>) => api.post('/vehicles', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Vehicle added!'); setShowAdd(false); reset() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vehicles/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Deleted successfully'); },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message)
  })

  const revertMutation = useMutation({
    mutationFn: (id: number) => api.post(`/vehicles/${id}/revert-transfer`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Transfer reverted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message)
  })

  const updateMutation = useMutation({
    mutationFn: (d: any) => api.put(`/vehicles/${d.id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Vehicle updated'); setEditItem(null); reset(); },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message)
  })

  const transferMutation = useMutation({
    mutationFn: ({ id, type, d }: { id: number; type: string; d: Record<string, string> }) =>
      api.post(`/vehicles/${id}/transfer-to-${type}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Transfer done!'); setTransferItem(null); reset2() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const watchBatteryInc = watch('battery_included')
  const watchChargerInc = watch('charger_included')
  const watchBatType = watch('battery_type')
  const watchLAcount = watch('lead_acid_battery_count')

  const vehicles = data?.vehicles?.data || []
  const meta = data?.vehicles?.meta || {}
  const products = (productsData?.products?.data || []).map((p: Record<string, unknown>) => ({ value: p.id as number, label: p.name as string }))
  const dealers = (dealersData?.dealers?.data || []).map((d: Record<string, unknown>) => ({ value: d.id as number, label: d.business_name as string }))
  const distributors = (distributorsData?.distributors?.data || distributorsData?.distributors || []).map((d: Record<string, unknown>) => ({ value: d.id as number, label: d.business_name as string }))

  return (
    <div className="fade-in-up">
      <PageHeader
        title="Vehicles"
        subtitle={`${meta.total || 0} total vehicles`}
        icon={<Zap className="h-5 w-5" />}
        actions={
          user?.role === 'admin' && (
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>Add Vehicle</Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-[200px]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search chassis, motor, battery..." />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[160px]">
          <option value="">All Status</option>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={productId} onChange={e => setProductId(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[160px]">
          <option value="">All Products</option>
          {products.map((p: { value: number; label: string }) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-48"><Spinner /></div>
        ) : vehicles.length === 0 ? (
          <EmptyState title="No vehicles found" description="Add vehicles to your inventory"
            action={user?.role === 'admin' ? <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>Add Vehicle</Button> : undefined} />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Chassis No.</Th><Th>Product</Th><Th>Config</Th><Th>Status</Th><Th>Location</Th><Th>Added</Th><Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {vehicles.map((v: Record<string, unknown>) => {
                  const sc = STATUS_STYLE[v.status as string] || { bg: '#f1f5f9', color: '#64748b' }
                  const location = String(
                    (v.current_dealer as Record<string,unknown>)?.business_name ??
                    (v.current_distributor as Record<string,unknown>)?.business_name ??
                    (v.current_owner as Record<string,unknown>)?.name ?? '—'
                  )
                  return (
                    <Tr key={v.id as number}>
                      <Td>
                        <span className="font-mono text-xs font-bold" style={{ color: '#2563eb' }}>
                          {v.chassis_number as string}
                        </span>
                      </Td>
                      <Td className="text-sm font-medium text-slate-800">{(v.product as Record<string,unknown>)?.name as string}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {v.battery_included === false ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 flex items-center"><Battery className="w-3 h-3 mr-0.5" /> No Battery</span>
                          ) : v.battery_type === 'lithium_ion' ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 flex items-center"><Battery className="w-3 h-3 mr-0.5" /> Li-Ion {v.battery_capacity as string}</span>
                          ) : v.battery_type === 'lead_acid' ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 flex items-center"><Battery className="w-3 h-3 mr-0.5" /> Lead Acid x{v.lead_acid_battery_count as number}</span>
                          ) : null}
                          
                          {v.charger_included === false ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 flex items-center"><Plug className="w-3 h-3 mr-0.5" /> No Charger</span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 flex items-center"><Plug className="w-3 h-3 mr-0.5" /> Charger</span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ background: sc.bg, color: sc.color }}>
                          {(v.status as string)?.replace(/_/g, ' ')}
                        </span>
                      </Td>
                      <Td className="text-xs text-slate-500">{location}</Td>
                      <Td className="text-xs text-slate-400">{formatDate(v.created_at as string)}</Td>
                      <Td>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" leftIcon={<Eye className="h-3.5 w-3.5" />} onClick={() => setViewItem(v)}>View</Button>
                        </div>
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

      {/* Add Vehicle Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title="Add Vehicle" subtitle="Register vehicle to company stock with configuration" size="xl">
        <form onSubmit={handleSubmit(d => { if (d.battery_serials && Array.isArray(d.battery_serials)) { d.battery_serials = d.battery_serials.filter(Boolean); } createMutation.mutate(d); })} className="space-y-4">
          <Select label="Product" options={products} {...register('product_id', { required: 'Required' })} error={errors.product_id?.message as string} placeholder="Select product..." />

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-sm font-bold text-slate-800">Base Chassis Configuration</h4>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Chassis Number" {...register('chassis_number', { required: 'Required' })} error={errors.chassis_number?.message as string} />
              <Input label="Motor Number" {...register('motor_number', { required: 'Required' })} error={errors.motor_number?.message as string} />
              <Input label="Controller Serial" {...register('controller_serial')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Color" {...register('color')} />
              <Input label="Variant" {...register('variant')} />
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4">
            <h4 className="text-sm font-bold text-blue-800 flex items-center justify-between">
              Charger Configuration
              <div className="flex items-center gap-2">
                <input type="checkbox" id="charger_inc" className="w-4 h-4 rounded" {...register('charger_included')} defaultChecked={true} />
                <label htmlFor="charger_inc" className="text-xs text-blue-700">Includes Charger</label>
              </div>
            </h4>
            {watchChargerInc !== false && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Charger Serial" {...register('charger_serial')} />
              </div>
            )}
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-4">
            <h4 className="text-sm font-bold text-emerald-800 flex items-center justify-between">
              Battery Configuration
              <div className="flex items-center gap-2">
                <input type="checkbox" id="battery_inc" className="w-4 h-4 rounded" {...register('battery_included')} defaultChecked={true} />
                <label htmlFor="battery_inc" className="text-xs text-emerald-700">Includes Battery</label>
              </div>
            </h4>
            {watchBatteryInc !== false && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Battery Type" options={[{value: 'lithium_ion', label: 'Lithium Ion'}, {value: 'lead_acid', label: 'Lead Acid'}]} {...register('battery_type')} placeholder="Select Type..." />
                  <Input label="Battery Capacity (e.g., 60V 32Ah)" {...register('battery_capacity')} />
                </div>

                {watchBatType === 'lithium_ion' && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Battery Serial" {...register('battery_serial')} />
                  </div>
                )}

                {watchBatType === 'lead_acid' && (
                  <div className="space-y-4">
                    <Select label="Number of Batteries" options={[{value: '4', label: '4'}, {value: '5', label: '5'}, {value: '6', label: '6'}]} {...register('lead_acid_battery_count')} placeholder="Select count..." />
                    {watchLAcount && Number(watchLAcount) > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Array.from({ length: Number(watchLAcount) }).map((_, idx) => (
                          <Input key={idx} label={`Battery ${idx + 1} Serial`} {...register(`battery_serials.${idx}`)} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <Input label="Purchase Price (₹) - Optional" type="number" {...register('purchase_price')} />
          <div className="pt-3 flex gap-3 justify-end" style={{ borderTop: '1px solid #f1f5f9' }}>
            <Button variant="outline" type="button" onClick={() => { setShowAdd(false); reset() }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Add Vehicle</Button>
          </div>
        </form>
      </Modal>


      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Vehicle Details">
        <form onSubmit={handleSubmit(d => updateMutation.mutate({ ...d, id: editItem?.id }))} className="space-y-4">
          <Input label="Chassis Number" {...register('chassis_number', { required: 'Required' })} error={errors.chassis_number?.message as string} />
          <Input label="Motor Number" {...register('motor_number', { required: 'Required' })} error={errors.motor_number?.message as string} />
          <Input label="Color" {...register('color')} />
          <Input label="Variant" {...register('variant')} />
          <Input label="Notes" {...register('notes')} />
          <div className="pt-3 flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button type="submit" loading={updateMutation.isPending}>Update</Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal open={!!transferItem} onClose={() => setTransferItem(null)} title={`Transfer to ${transferType === 'dealer' ? 'Dealer' : 'Distributor'}`} size="md">
        {transferItem && (
          <form onSubmit={hs2(d => transferMutation.mutate({ id: transferItem.id as number, type: transferType, d }))} className="space-y-4">
            <div className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <p className="text-xs text-slate-400">Vehicle</p>
              <p className="font-mono text-sm font-bold text-blue-600">{transferItem.chassis_number as string}</p>
              <p className="text-xs text-slate-500 mt-0.5">{(transferItem.product as Record<string,unknown>)?.name as string}</p>
            </div>
            <Select
              label={`Select ${transferType === 'dealer' ? 'Dealer' : 'Distributor'}`}
              options={transferType === 'dealer' ? dealers : distributors}
              {...reg2(`${transferType}_id`, { required: 'Required' })}
              placeholder={`Select ${transferType}...`}
            />
            <div className="pt-3 flex gap-3 justify-end" style={{ borderTop: '1px solid #f1f5f9' }}>
              <Button variant="outline" type="button" onClick={() => setTransferItem(null)}>Cancel</Button>
              <Button type="submit" loading={transferMutation.isPending}>Confirm Transfer</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Vehicle Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Vehicle Details" size="md">
        {viewItem && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl text-center"
              style={{ background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)' }}>
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-2"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-slate-800">{(viewItem.product as Record<string,unknown>)?.name as string}</h3>
              <p className="font-mono text-sm text-emerald-600 mt-1">{viewItem.chassis_number as string}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Chassis No.', viewItem.chassis_number as string, 'bi-fingerprint'],
                ['Motor No.', (viewItem.motor_number as string) || '—', 'bi-cpu'],
                ['Battery Serial', (viewItem.battery_serial as string) || '—', 'bi-battery'],
                ['Charger Serial', (viewItem.charger_serial as string) || '—', 'bi-plug'],
                ['Controller Serial', (viewItem.controller_serial as string) || '—', 'bi-cpu'],
                ['Color', (viewItem.color as string) || '—', 'bi-palette'],
                ['Variant', (viewItem.variant as string) || '—', 'bi-tag'],
                ['Status', (viewItem.status as string)?.replace(/_/g, ' '), 'bi-info-circle'],
                ['Added', formatDate(viewItem.created_at as string), 'bi-calendar'],
                ['Purchase Price', formatCurrency(viewItem.purchase_price as number), 'bi-cash'],
              ].map(([k, v, icon]) => (
                <div key={k} className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1"><i className={`bi ${icon}`} />{k}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 capitalize">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}



