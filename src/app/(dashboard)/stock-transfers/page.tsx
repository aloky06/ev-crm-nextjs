'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/lib/api'
import { formatDate, getErrorMessage } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, Spinner, EmptyState, Pagination, Input, Select, SearchInput } from '@/components/ui/Badge'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Truck, Plus, CheckCircle, Package, Download } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

export default function StockTransfersPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [viewItem, setViewItem] = useState<Record<string, unknown> | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['stock-transfers', page],
    queryFn: () => api.get('/stock-transfers', { params: { page } }).then(r => r.data),
  })
  
  // Data for dropdowns
  const { data: productsData } = useQuery({ queryKey: ['products'], queryFn: () => api.get('/products').then(r => r.data) })
  const { data: dealersData } = useQuery({ queryKey: ['dealers'], queryFn: () => api.get('/dealers').then(r => r.data) })
  const { data: distributorsData } = useQuery({ queryKey: ['distributors'], queryFn: () => api.get('/distributors').then(r => r.data) })
  const { data: vehiclesData } = useQuery({ queryKey: ['vehicles'], queryFn: () => api.get('/vehicles?per_page=1000').then(r => r.data) })
  const { data: componentsData } = useQuery({ queryKey: ['components'], queryFn: () => api.get('/components?per_page=1000').then(r => r.data) })

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    defaultValues: { to_type: 'dealer', to_id: '', notes: '', items: [{ product_id: '', vehicle_id: '', component_id: '', quantity: 1 }] }
  })
  
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchToType = watch('to_type')
  const watchItems = watch('items')

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/stock-transfers', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-transfers'] }); toast.success('Stock Dispatched!'); setShowAdd(false); reset() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const receiveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/stock-transfers/${id}/receive`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-transfers'] }); toast.success('Stock Received!') },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const downloadInvoice = async (id: number, ref: string) => {
    try {
      const response = await api.get(`/stock-transfers/${id}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${ref}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download invoice');
    }
  }

  const transfers = data?.transfers?.data || []
  const meta = data?.transfers?.meta || {}
  
  const products = productsData?.products?.data || []
  const productOptions = products.map((p: any) => ({ value: p.id, label: `${p.name} ${p.is_vehicle ? '(EV)' : '(Spare Part)'}` }))
  
  const allVehicles = vehiclesData?.vehicles?.data || []
  const vehicleOptions = allVehicles
    .filter((v: any) => v.status === 'in_stock_company' || v.status === 'in_stock_distributor')
    .map((v: any) => ({ value: v.id, label: v.chassis_number, product_id: v.product_id }))

  const allComponents = componentsData?.components?.data || []
  const componentOptions = allComponents
    .filter((c: any) => c.status === 'in_stock_company' || c.status === 'in_stock_distributor')
    .map((c: any) => ({ value: c.id, label: c.serial_number, product_id: c.product_id }))
  
  const receiverOptions = watchToType === 'dealer' 
    ? (dealersData?.dealers?.data || []).map((d: any) => ({ value: d.id, label: d.business_name }))
    : (distributorsData?.distributors?.data || []).map((d: any) => ({ value: d.id, label: d.business_name }))

  const STATUS_COLORS: Record<string, string> = {
    pending: 'yellow',
    dispatched: 'blue',
    received: 'green',
    rejected: 'red',
  }

  return (
    <div className="fade-in-up">
      <PageHeader
        title="Stock Transfers"
        subtitle="Manage inventory movement"
        icon={<Truck className="h-5 w-5" />}
        actions={
          (user?.role === 'admin' || user?.role === 'distributor') && (
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>Dispatch Stock</Button>
          )
        }
      />

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-48"><Spinner /></div>
        ) : transfers.length === 0 ? (
          <EmptyState title="No stock transfers found" description="No inventory has been moved yet." />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Ref #</Th><Th>Route</Th><Th>Items</Th><Th>Status</Th><Th>Dates</Th><Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {transfers.map((t: any) => (
                  <Tr key={t.id}>
                    <Td>
                      <p className="font-semibold text-slate-800 text-sm">{t.reference_number}</p>
                    </Td>
                    <Td>
                      <p className="text-xs font-semibold capitalize text-slate-700">{t.from_type} &rarr; {t.to_type}</p>
                    </Td>
                    <Td>
                      <div className="flex flex-col gap-1">
                        {(t.items || []).map((it: any) => (
                          <span key={it.id} className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-block max-w-[200px] truncate">
                            {it.quantity}x {it.product?.name}
                          </span>
                        ))}
                      </div>
                    </Td>
                    <Td><Badge label={t.status} status={t.status} /></Td>
                    <Td>
                      <p className="text-xs text-slate-500">Disp: {t.dispatched_at ? formatDate(t.dispatched_at) : '-'}</p>
                      <p className="text-xs text-slate-500">Recv: {t.received_at ? formatDate(t.received_at) : '-'}</p>
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setViewItem(t)}>View</Button>
                        <Button size="sm" variant="outline" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={() => downloadInvoice(t.id, t.reference_number)}>Invoice</Button>
                        {t.status === 'dispatched' && ((user?.role === 'dealer' && t.to_type === 'dealer') || (user?.role === 'distributor' && t.to_type === 'distributor')) && (
                          <Button size="sm" color="blue" leftIcon={<CheckCircle className="h-3.5 w-3.5" />} onClick={() => receiveMutation.mutate(t.id)} loading={receiveMutation.isPending}>Receive</Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination current={meta.current_page || 1} last={meta.last_page || 1} onChange={setPage} />
          </>
        )}
      </Card>

      {/* Dispatch Stock Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title="Dispatch Stock" subtitle="Transfer inventory to Distributor or Dealer" size="xl">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="To Entity Type" options={[{ value: 'distributor', label: 'Distributor' }, { value: 'dealer', label: 'Dealer' }]} {...register('to_type')} />
            <Select label="Select Receiver" options={receiverOptions} {...register('to_id', { required: 'Required' })} error={errors.to_id?.message as string} placeholder="Select..." />
          </div>
          <Input label="Notes / Reason" {...register('notes')} />

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-semibold text-sm mb-3">Transfer Items</h4>
            {fields.map((item, index) => {
              const selectedProductId = watchItems[index]?.product_id;
              const selectedProduct = products.find((p: any) => String(p.id) === String(selectedProductId));
              const isVehicle = selectedProduct?.is_vehicle;
              const isSerialized = selectedProduct && (selectedProduct.product_type === 'battery' || selectedProduct.product_type === 'charger');
              
              return (
                <div key={item.id} className="flex gap-3 mb-3 items-start">
                  <div className="flex-1">
                    <Select options={productOptions} {...register(`items.${index}.product_id`, { required: 'Required' })} placeholder="Select Product" />
                  </div>
                  {isVehicle ? (
                    <div className="flex-1">
                      <Select options={vehicleOptions.filter((v: any) => String(v.product_id) === String(selectedProductId))} {...register(`items.${index}.vehicle_id`, { required: 'Required' })} placeholder="Select Chassis Number" />
                    </div>
                  ) : isSerialized ? (
                    <div className="flex-1">
                      <Select options={componentOptions.filter((c: any) => String(c.product_id) === String(selectedProductId))} {...register(`items.${index}.component_id`, { required: 'Required' })} placeholder="Select Serial Number" />
                    </div>
                  ) : (
                    <div className="w-24">
                      <Input placeholder="Qty" type="number" {...register(`items.${index}.quantity`)} />
                    </div>
                  )}
                  <Button type="button" variant="outline" color="red" size="sm" className="mt-1" onClick={() => remove(index)}>X</Button>
                </div>
              )
            })}
            <Button type="button" size="sm" variant="outline" onClick={() => append({ product_id: '', vehicle_id: '', component_id: '', quantity: 1 })}>+ Add Item</Button>
          </div>

          <div className="pt-3 flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => { setShowAdd(false); reset() }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Dispatch Stock</Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Transfer Details" size="lg">
        {viewItem && (
          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex-1">
                <p className="text-xs text-slate-500 uppercase font-semibold">Ref Number</p>
                <p className="font-bold">{viewItem.reference_number as string}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
                <Badge label={viewItem.status as string} status={viewItem.status as string} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 uppercase font-semibold">Grand Total</p>
                <p className="font-bold text-slate-800">₹{Number(viewItem.grand_total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Items Included</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table>
                  <Thead>
                    <Tr><Th>Product</Th><Th>Type</Th><Th>Details / Qty</Th></Tr>
                  </Thead>
                  <Tbody>
                    {(viewItem.items as any[]).map((it: any) => (
                      <Tr key={it.id}>
                        <Td className="font-semibold text-sm">{it.product?.name}</Td>
                        <Td><Badge label={it.product?.is_vehicle ? 'EV' : 'Spare Part'} className={it.product?.is_vehicle ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'} /></Td>
                        <Td>
                          {it.product?.is_vehicle ? (
                            <div>
                              <span className="text-xs font-mono font-bold text-blue-600 block">Chassis: {it.vehicle?.chassis_number}</span>
                              <div className="text-[10px] text-slate-500 mt-0.5 font-medium flex flex-wrap gap-1">
                                {it.vehicle?.battery_included === false ? (
                                  <span className="px-1 bg-slate-100 rounded text-slate-500">No Battery</span>
                                ) : it.vehicle?.battery_type === 'lithium_ion' ? (
                                  <span className="px-1 bg-blue-50 rounded text-blue-600">Li-Ion {it.vehicle?.battery_capacity}</span>
                                ) : it.vehicle?.battery_type === 'lead_acid' ? (
                                  <span className="px-1 bg-emerald-50 rounded text-emerald-600">Lead Acid x{it.vehicle?.lead_acid_battery_count}</span>
                                ) : null}
                                
                                {it.vehicle?.charger_included === false ? (
                                  <span className="px-1 bg-slate-100 rounded text-slate-500">No Charger</span>
                                ) : (
                                  <span className="px-1 bg-indigo-50 rounded text-indigo-600">With Charger</span>
                                )}
                              </div>
                            </div>
                          ) : (it.product?.product_type === 'battery' || it.product?.product_type === 'charger') ? (
                            <div>
                              <span className="text-xs font-mono font-bold text-orange-600 block">Serial: {it.component?.serial_number}</span>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold">Qty: {it.quantity}</span>
                          )}
                          <div className="text-xs text-slate-500 mt-1">₹{Number(it.unit_price).toLocaleString()} + {it.tax_rate}% Tax</div>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
