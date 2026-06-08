'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/lib/api'
import { formatDate, formatCurrency, getErrorMessage } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, Spinner, EmptyState, Pagination, Input, Select, SearchInput, Stat } from '@/components/ui/Badge'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Package, Plus, Eye, AlertTriangle, ArrowDownUp, History, CarFront, Wrench, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

const BATTERY_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'lead_acid', label: 'Lead Acid' },
  { value: 'lithium_ion', label: 'Lithium Ion' },
]
const WARRANTY_TYPES = [
  { value: 'no_warranty', label: 'No Warranty' },
  { value: 'with_warranty', label: 'With Warranty' },
  { value: 'with_guarantee', label: 'With Guarantee' },
]
const TAX_RATES = [
  { value: '5', label: '5%' }, { value: '12', label: '12%' },
  { value: '18', label: '18%' }, { value: '28', label: '28%' },
]
const UNIT_TYPES = [
  { value: 'pcs', label: 'Pieces (Pcs)' },
  { value: 'box', label: 'Boxes' },
  { value: 'pkg', label: 'Packages (Pkg)' },
  { value: 'set', label: 'Sets' },
  { value: 'kg', label: 'Kilograms (Kg)' },
  { value: 'ltr', label: 'Liters (Ltr)' },
]

import { useSearchParams } from 'next/navigation'

export default function ProductsPage() {
  const qc = useQueryClient()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as 'vehicle' | 'spare' | 'battery' | 'charger') || 'vehicle'
  
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addTab, setAddTab] = useState<'vehicle' | 'spare' | 'battery' | 'charger'>('vehicle')
  const [viewItem, setViewItem] = useState<Record<string, unknown> | null>(null)
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null)
  const [editTab, setEditTab] = useState<'vehicle' | 'spare' | 'battery' | 'charger'>('vehicle')
  const [adjustItem, setAdjustItem] = useState<Record<string, unknown> | null>(null)
  const [listTab, setListTab] = useState<'vehicle' | 'spare' | 'battery' | 'charger'>(initialTab)
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, listTab],
    queryFn: () => api.get('/products', { params: { page, search: search || undefined, product_type: listTab === 'vehicle' ? 'vehicle' : listTab === 'spare' ? 'spare_part' : listTab === 'battery' ? 'battery' : 'charger' } }).then(r => r.data),
  })
  const { data: lowStockData } = useQuery({
    queryKey: ['products-low-stock'],
    queryFn: () => api.get('/products/low-stock').then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Record<string, string>>()
  const { register: reg2, handleSubmit: hs2, reset: reset2, setValue: sv2 } = useForm<Record<string, string>>()
  const { register: reg3, handleSubmit: hs3, reset: reset3, formState: { errors: err3 } } = useForm<Record<string, string>>()

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['inventory-history', viewItem?.id],
    queryFn: () => api.get(`/inventory/${viewItem?.id}/history`).then(r => r.data),
    enabled: !!viewItem,
  })

  const createMutation = useMutation({
    mutationFn: (d: Record<string, string>) => api.post('/products', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product created!'); setShowAdd(false); reset() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: number; d: Record<string, string> }) => api.put(`/products/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product updated!'); setEditItem(null) },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
  const adjustMutation = useMutation({
    mutationFn: (d: Record<string, string>) => api.post('/inventory/adjust', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Stock adjusted!'); setAdjustItem(null); reset3() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const products = data?.products?.data || []
  const meta = data?.products?.meta || {}
  const lowStock = lowStockData?.products || []

  const BATTERY_COLORS: Record<string, { bg: string; color: string }> = {
    lithium_ion: { bg: '#ede9fe', color: '#7c3aed' },
    lead_acid:   { bg: '#fef3c7', color: '#d97706' },
    none:        { bg: '#f1f5f9', color: '#64748b' },
  }

  return (
    <div className="fade-in-up">
      <PageHeader
        title="Products"
        subtitle={`${meta.total || 0} EV models`}
        icon={<Package className="h-5 w-5" />}
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>Add Product</Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Items" value={meta.total || 0} icon={<Package className="h-5 w-5" />} color="blue" />
        <Stat label="Active Items" value={products.filter((p: Record<string, unknown>) => p.is_active).length} icon={<i className="bi bi-check-circle" />} color="green" />
        <Stat label="Low Stock Alerts" value={lowStock.length} icon={<AlertTriangle className="h-5 w-5" />} color="orange" />
        <Stat label="Avg Tax Rate" value={`${products.reduce((a: number, p: Record<string, unknown>) => a + (p.tax_rate as number || 0), 0) / (products.length || 1)}%`} icon={<i className="bi bi-percent" />} color="purple" />
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="mb-5 p-4 rounded-2xl flex items-start gap-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Low Stock Alert — {lowStock.length} product(s)</p>
            <p className="text-xs text-amber-600 mt-0.5">{lowStock.map((p: Record<string, unknown>) => p.name).join(' · ')}</p>
          </div>
        </div>
      )}

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-full sm:w-auto overflow-x-auto">
            <button onClick={() => { setListTab('vehicle'); setPage(1) }} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all flex items-center gap-2 ${listTab === 'vehicle' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CarFront className="h-4 w-4" /> EV Models</button>
            <button onClick={() => { setListTab('battery'); setPage(1) }} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all flex items-center gap-2 ${listTab === 'battery' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Zap className="h-4 w-4" /> Batteries</button>
            <button onClick={() => { setListTab('charger'); setPage(1) }} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all flex items-center gap-2 ${listTab === 'charger' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Zap className="h-4 w-4" /> Chargers</button>
            <button onClick={() => { setListTab('spare'); setPage(1) }} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all flex items-center gap-2 ${listTab === 'spare' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Wrench className="h-4 w-4" /> Spare Parts</button>
          </div>

        <div className="w-full sm:w-72">
          <SearchInput value={search} onChange={setSearch} placeholder={`Search ${listTab === 'vehicle' ? 'models' : 'parts'}, HSN...`} />
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-48"><Spinner /></div>
        ) : products.length === 0 ? (
          <EmptyState title="No products found" description="Add your first EV model to get started"
            action={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>Add Product</Button>} />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>{listTab === 'vehicle' ? 'Model Name' : 'Part Name'}</Th>
                  <Th>HSN Code</Th>
                  <Th>Tax Rate</Th>
                  {listTab === 'vehicle' ? (
                    <>
                      <Th>Battery</Th>
                      <Th>Warranty</Th>
                    </>
                  ) : (
                    <Th>Unit</Th>
                  )}
                  <Th>Price (₹)</Th>
                  <Th>Stock</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {products.map((p: Record<string, unknown>) => {
                  const isLow = (p.stock_quantity as number) < (p.min_stock_alert as number)
                  const bc = BATTERY_COLORS[p.battery_type as string] || BATTERY_COLORS.none
                  return (
                    <Tr key={p.id as number}>
                      <Td>
                        <p className="font-semibold text-slate-800 text-sm">{p.name as string}</p>
                        <p className="text-xs text-slate-400">{(p.description as string)?.slice(0, 30) || '—'}</p>
                      </Td>
                      <Td><span className="font-mono text-xs text-slate-600">{(p.hsn_code as string) || '—'}</span></Td>
                      <Td>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#eff6ff', color: '#2563eb' }}>
                          {p.tax_rate as number}%
                        </span>
                      </Td>
                      {listTab === 'vehicle' ? (
                        <>
                          <Td>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ background: bc.bg, color: bc.color }}>
                              {(p.battery_type as string)?.replace('_', ' ')}
                            </span>
                          </Td>
                          <Td className="text-xs text-slate-600 capitalize">{(p.warranty_type as string)?.replace('_', ' ')}</Td>
                        </>
                      ) : (
                        <Td>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                            {p.unit as string || 'PCS'}
                          </span>
                        </Td>
                      )}
                      <Td className="font-semibold text-slate-800">{formatCurrency(p.retail_price as number)}</Td>
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                            {p.stock_quantity as number}
                          </span>
                          {isLow && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: '#fee2e2', color: '#dc2626' }}>LOW</span>
                          )}
                        </div>
                      </Td>
                      <Td><Badge label={p.is_active ? 'active' : 'inactive'} status={p.is_active ? 'active' : 'inactive'} /></Td>
                      <Td>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" leftIcon={<Eye className="h-3.5 w-3.5" />} onClick={() => setViewItem(p)}>View</Button>
                          {!p.is_vehicle && (
                            <Button size="sm" variant="outline" leftIcon={<ArrowDownUp className="h-3.5 w-3.5" />} onClick={() => { setAdjustItem(p); reset3({ product_id: String(p.id), type: 'in', reference_type: 'adjustment', quantity: '1' }) }}>Adjust</Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditItem(p)
                            setEditTab(p.product_type === 'vehicle' ? 'vehicle' : p.product_type === 'battery' ? 'battery' : p.product_type === 'charger' ? 'charger' : 'spare')
                            Object.entries(p).forEach(([k, v]) => sv2(k, v === null ? '' : (typeof v === 'boolean' ? (v ? '1' : '0') : String(v))))
                          }}>Edit</Button>
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

      {/* Add Product Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title="Register New Item" subtitle="Add a new EV Model or Spare Part to your catalog" size="lg">
        {/* Modern Tabs */}
        
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl mb-6 overflow-x-auto">
            <button onClick={() => setAddTab('vehicle')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${addTab === 'vehicle' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CarFront className="h-4 w-4" /> EV Model</button>
            <button onClick={() => setAddTab('battery')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${addTab === 'battery' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Zap className="h-4 w-4" /> Battery</button>
            <button onClick={() => setAddTab('charger')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${addTab === 'charger' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Zap className="h-4 w-4" /> Charger</button>
            <button onClick={() => setAddTab('spare')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${addTab === 'spare' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Wrench className="h-4 w-4" /> Spare Part</button>
          </div>


        <form onSubmit={handleSubmit(d => {
          const isVehicle = addTab === 'vehicle'; const pType = addTab === 'spare' ? 'spare_part' : addTab;
          const payload = {
            ...d,
            product_type: pType,
            warranty_type: d.warranty_type || 'no_warranty',
            battery_type: d.battery_type || 'none',
            unit: d.unit || 'pcs',
          };
          const cleanPayload: any = {};
          for (const [k, v] of Object.entries(payload)) {
            if (v === '' || v === 'null') continue;
            cleanPayload[k] = v;
          }
          cleanPayload.is_vehicle = isVehicle ? true : false;
          cleanPayload.with_battery = isVehicle ? (d.battery_type && d.battery_type !== 'none' ? true : false) : false;
          if (cleanPayload.is_active !== undefined) cleanPayload.is_active = Boolean(Number(cleanPayload.is_active));
          createMutation.mutate(cleanPayload);
        })} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={addTab === 'vehicle' ? 'Vehicle Model Name' : addTab === 'battery' ? 'Battery Name/Model' : addTab === 'charger' ? 'Charger Model' : 'Part Name'} {...register('name', { required: 'Required' })} error={errors.name?.message as string} />
            <Input label="HSN Code" {...register('hsn_code')} />
          </div>
          <Input label="Description" {...register('description')} />

          <div className="grid grid-cols-2 gap-4">
            {addTab === 'spare' && (
              <Select label="Unit of Measurement" options={UNIT_TYPES} {...register('unit', { required: addTab === 'spare' ? 'Required' : false })} error={errors.unit?.message as string} placeholder="Select Unit..." />
            )}
            <Select label="Tax Rate (%)" options={TAX_RATES} {...register('tax_rate', { required: 'Required' })} error={errors.tax_rate?.message as string} placeholder="Select Tax..." />
          </div>

          
          {(addTab === 'battery' || addTab === 'vehicle') && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-4">
              <h4 className="text-sm font-bold text-emerald-800">{addTab === 'battery' ? 'Battery Specifications' : 'Battery & Warranty'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Battery Type" options={BATTERY_TYPES} {...register('battery_type')} placeholder="Select..." />
                {addTab === 'battery' && <Input label="Capacity (e.g. 60V 32Ah)" {...register('motor_watt')} />}
                <Select label="Warranty Type" options={WARRANTY_TYPES} {...register('warranty_type')} placeholder="Select..." />
              </div>
              {addTab === 'vehicle' && (
                <div className="grid grid-cols-4 gap-4">
                  <Input label="Bat. War. (Mos)" type="number" {...register('battery_warranty_months')} />
                  <Input label="Motor War. (Mos)" type="number" {...register('motor_warranty_months')} />
                  <Input label="Charger War. (Mos)" type="number" {...register('charger_warranty_months')} />
                  <Input label="Ctrl War. (Mos)" type="number" {...register('controller_warranty_months')} />
                </div>
              )}
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-sm font-bold text-slate-800">Pricing & Inventory Config</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Purchase Price (Base) ₹" type="number" {...register('purchase_price')} />
              <Input label="Sale Price (Retail) ₹" type="number" {...register('retail_price', { required: 'Required' })} error={errors.retail_price?.message as string} />

            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Distributor Price (B2B) ₹" type="number" {...register('distributor_price')} />
              <Input label="Dealer Price (B2B) ₹" type="number" {...register('wholesale_price')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Min Stock Alert (Qty)" type="number" {...register('min_stock_alert')} />
            </div>
          </div>

          <div className="pt-3 flex gap-3 justify-end border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => { setShowAdd(false); reset() }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Save {addTab === 'vehicle' ? 'Vehicle' : 'Spare Part'}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title={`Edit ${editTab === 'vehicle' ? 'Vehicle Model' : 'Spare Part'}`} size="lg">
        {editItem && (
          <form onSubmit={hs2(d => {
            const isVehicle = editTab === 'vehicle'; const pType = editTab === 'spare' ? 'spare_part' : editTab;
            const payload = {
              ...d,
              product_type: pType,
              warranty_type: d.warranty_type || 'no_warranty',
              battery_type: d.battery_type || 'none',
              unit: d.unit || 'pcs',
            };
            const cleanPayload: any = {};
            for (const [k, v] of Object.entries(payload)) {
              if (v === '' || v === 'null') continue;
              cleanPayload[k] = v;
            }
            cleanPayload.is_vehicle = isVehicle ? true : false;
            cleanPayload.with_battery = isVehicle ? (d.battery_type && d.battery_type !== 'none' ? true : false) : false;
            if (cleanPayload.is_active !== undefined) cleanPayload.is_active = Boolean(Number(cleanPayload.is_active));
            updateMutation.mutate({ id: editItem.id as number, d: cleanPayload });
          })} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label={editTab === 'vehicle' ? 'Vehicle Model Name' : editTab === 'battery' ? 'Battery Name/Model' : editTab === 'charger' ? 'Charger Model' : 'Part Name'} {...reg2('name', { required: 'Required' })} />
              <Input label="HSN Code" {...reg2('hsn_code')} />
            </div>
            <Input label="Description" {...reg2('description')} />

            <div className="grid grid-cols-2 gap-4">
              {editTab === 'spare' && (
                <Select label="Unit of Measurement" options={UNIT_TYPES} {...reg2('unit')} placeholder="Select Unit..." />
              )}
              <Select label="Tax Rate (%)" options={TAX_RATES} {...reg2('tax_rate')} placeholder="Select Tax..." />
            </div>

            
          {(editTab === 'battery' || editTab === 'vehicle') && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-4">
              <h4 className="text-sm font-bold text-emerald-800">{editTab === 'battery' ? 'Battery Specifications' : 'Battery & Warranty'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Battery Type" options={BATTERY_TYPES} {...reg2('battery_type')} placeholder="Select..." />
                {editTab === 'battery' && <Input label="Capacity (e.g. 60V 32Ah)" {...reg2('motor_watt')} />}
                <Select label="Warranty Type" options={WARRANTY_TYPES} {...reg2('warranty_type')} placeholder="Select..." />
              </div>
              {editTab === 'vehicle' && (
                <div className="grid grid-cols-4 gap-4">
                  <Input label="Bat. War. (Mos)" type="number" {...reg2('battery_warranty_months')} />
                  <Input label="Motor War. (Mos)" type="number" {...reg2('motor_warranty_months')} />
                  <Input label="Charger War. (Mos)" type="number" {...reg2('charger_warranty_months')} />
                  <Input label="Ctrl War. (Mos)" type="number" {...reg2('controller_warranty_months')} />
                </div>
              )}
            </div>
          )}

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-sm font-bold text-slate-800">Pricing & Inventory Config</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Purchase Price (Base) ₹" type="number" {...reg2('purchase_price')} />
                <Input label="Sale Price (Retail) ₹" type="number" {...reg2('retail_price', { required: 'Required' })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Distributor Price (B2B) ₹" type="number" {...reg2('distributor_price')} />
                <Input label="Dealer Price (B2B) ₹" type="number" {...reg2('wholesale_price')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Min Stock Alert" type="number" {...reg2('min_stock_alert')} />
              </div>
            </div>

            <div className="pt-3 flex gap-3 justify-end border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button type="submit" loading={updateMutation.isPending}>Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Modal with Timeline */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Item Dashboard" size="xl">
        {viewItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)' }}>
                <h3 className="font-bold text-slate-800 text-lg">{viewItem.name as string}</h3>
                <p className="text-sm text-slate-500 mt-1">{(viewItem.description as string) || 'No description'}</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">{viewItem.hsn_code as string}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">{viewItem.tax_rate as number}% Tax</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl flex flex-col justify-center" style={{ background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', border: '1px solid #d1fae5' }}>
                <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">Stock in Hand</p>
                <p className="text-4xl font-bold text-slate-800 mt-1">{viewItem.stock_quantity as number}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Est Value: <span className="font-semibold text-slate-700">₹{Number(viewItem.stock_quantity as number) * Number(viewItem.retail_price as number)}</span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-4">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <History className="h-4 w-4 text-slate-500" />
                <h4 className="font-semibold text-slate-800 text-sm">Stock Ledger / Timeline</h4>
              </div>
              {historyLoading ? (
                <div className="flex justify-center p-6"><Spinner /></div>
              ) : historyData?.history?.data?.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No transaction history found for this item.</div>
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Date</Th><Th>Transaction Details</Th><Th>IN</Th><Th>OUT</Th><Th>Balance</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {historyData?.history?.data?.map((ledger: any) => (
                      <Tr key={ledger.id}>
                        <Td className="text-xs text-slate-500">{formatDate(ledger.created_at)}</Td>
                        <Td>
                          <p className="text-xs font-semibold capitalize text-slate-800">{ledger.reference_type}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{ledger.reference_id}</p>
                          {ledger.vehicle && <p className="text-[10px] text-blue-600 font-mono mt-0.5">{ledger.vehicle.chassis_number}</p>}
                        </Td>
                        <Td>
                          {ledger.type === 'in' ? <span className="text-sm font-bold text-emerald-600">+{ledger.quantity}</span> : '-'}
                        </Td>
                        <Td>
                          {ledger.type === 'out' ? <span className="text-sm font-bold text-red-600">-{ledger.quantity}</span> : '-'}
                        </Td>
                        <Td className="font-bold text-slate-800 text-sm">{ledger.running_balance}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal open={!!adjustItem} onClose={() => setAdjustItem(null)} title="Adjust Stock" size="sm">
        {adjustItem && (
          <form onSubmit={hs3(d => adjustMutation.mutate(d))} className="space-y-4">
            <input type="hidden" {...reg3('product_id')} />
            <div className="p-3 bg-slate-50 rounded-lg text-sm border border-slate-200">
              <span className="font-semibold">Product:</span> {adjustItem.name as string}
              <br/>
              <span className="font-semibold">Current Stock:</span> {adjustItem.stock_quantity as number}
            </div>
            <Select label="Adjustment Type" options={[{ value: 'in', label: 'Add Stock (+)' }, { value: 'out', label: 'Reduce Stock (-)' }]} {...reg3('type', { required: 'Required' })} />
            <Input label="Quantity" type="number" {...reg3('quantity', { required: 'Required', min: 1 })} error={err3.quantity?.message} />
            <Select label="Reason" options={[{ value: 'adjustment', label: 'Manual Adjustment / Damage' }, { value: 'opening', label: 'Opening Balance' }]} {...reg3('reference_type', { required: 'Required' })} />
            <Input label="Notes (Optional)" {...reg3('notes')} />
            <div className="pt-3 flex gap-3 justify-end border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setAdjustItem(null)}>Cancel</Button>
              <Button type="submit" loading={adjustMutation.isPending}>Save</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}


