'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, SearchInput, Spinner, Pagination, Input, Select } from '@/components/ui/Badge'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'
import { Plus, Zap } from 'lucide-react'

export default function ComponentsPage() {
  const qc = useQueryClient()
  const cType = "battery"
  const isBattery = (cType as string) === 'battery'

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [productId, setProductId] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [transferItem, setTransferItem] = useState<Record<string, unknown> | null>(null)
  const [transferType, setTransferType] = useState<'dealer' | 'distributor'>('dealer')
  const [viewItem, setViewItem] = useState<Record<string, unknown> | null>(null)
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const { data: dealersData } = useQuery({ queryKey: ['dealers'], queryFn: () => api.get('/dealers').then(r => r.data) })
  const { data: distributorsData } = useQuery({ queryKey: ['distributors'], queryFn: () => api.get('/distributors').then(r => r.data) })
  
  const dealers = dealersData?.dealers?.data || dealersData?.dealers || [];
  const distributors = distributorsData?.distributors?.data || distributorsData?.distributors || [];

  const { data: productsData } = useQuery({
    queryKey: ['products', cType],
    queryFn: () => api.get('/products', { params: { product_type: cType, per_page: 100 } }).then(r => r.data)
  })
  
  const products = (productsData?.products?.data || productsData?.products || []).map((p: any) => ({ label: p.name, value: p.id }))

  const { data, isLoading } = useQuery({
    queryKey: ['components', cType, page, search, status, productId],
    queryFn: () => api.get('/components', { params: { type: cType, page, search: search || undefined, status: status || undefined, product_id: productId || undefined } }).then(r => r.data)
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>()
  const { register: reg2, handleSubmit: hs2, reset: reset2 } = useForm<any>()

  const transferMutation = useMutation({
    mutationFn: ({ id, type, d }: { id: number; type: string; d: Record<string, string> }) =>
      api.post(`/components/${id}/transfer-to-${type}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['components'] }); toast.success('Transfer done!'); setTransferItem(null); reset2() },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message),
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/components', { ...d, type: cType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] })
      setShowAdd(false)
      reset()
      toast.success(isBattery ? 'Battery Added' : 'Charger Added')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error saving component')
  })

  const items = data?.components?.data || []
  const meta = data?.components || {}

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 capitalize">{cType}s Inventory</h1>
          <p className="text-slate-500">Track and manage individual {cType} serials</p>
        </div>
        {user?.role === 'admin' && (
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>Add {isBattery ? 'Battery' : 'Charger'}</Button>
        )}
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 mb-5 justify-between">
          <div className="flex gap-3">
            <select value={status} onChange={e => setStatus(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">All Status</option>
              <option value="in_stock_company">In Stock (Company)</option>
              <option value="in_stock_distributor">In Stock (Distributor)</option>
              <option value="in_stock_dealer">In Stock (Dealer)</option>
              <option value="sold">Sold</option>
            </select>
            <select value={productId} onChange={e => setProductId(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">All Products</option>
              {products.map((p: any) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-72">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by serial number..." />
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><Spinner /></div>
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Serial Number</Th>
                  <Th>Model</Th>
                  {isBattery && <Th>Capacity / Type</Th>}
                  <Th>Location</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.length === 0 ? (
                  <Tr><Td colSpan={isBattery ? 6 : 5} className="text-center py-8">No items found</Td></Tr>
                ) : items.map((c: any) => (
                  <Tr key={c.id}>
                    <Td className="font-mono text-sm font-semibold text-slate-800">{c.serial_number}</Td>
                    <Td className="font-semibold text-blue-700">{c.product?.name}</Td>
                    {isBattery && <Td className="text-sm capitalize">{c.product?.battery_ah ? c.product.battery_ah + 'Ah' : ''} {c.product?.battery_type?.replace('_', ' ')}</Td>}
                    <Td>
                      <Badge label={c.current_owner_type} status={c.current_owner_type === 'company' ? 'active' : 'warning'} />
                    </Td>
                    <Td>
                      <Badge label={c.status.replace(/_/g, ' ')} status={c.status.includes('in_stock') ? 'active' : c.status === 'sold' ? 'inactive' : 'warning'} />
                    </Td>
                    <Td className="flex items-center gap-2">
                      <Button size="sm" variant="ghost">View</Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination current={meta.current_page || 1} last={meta.last_page || 1} onChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title={`Register New ${cType}`} subtitle={`Add a ${cType} serial to your company stock`} size="md">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <Select label="Model" options={products} {...register('product_id', { required: 'Required' })} error={errors.product_id?.message as string} placeholder="Select model..." />
          <Input label="Serial Number" {...register('serial_number', { required: 'Required' })} error={errors.serial_number?.message as string} />
          <Input label="Internal Notes (Optional)" {...register('notes')} />

          <div className="pt-3 flex gap-3 justify-end border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => { setShowAdd(false); reset() }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Save to Stock</Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal open={!!transferItem} onClose={() => setTransferItem(null)} title={`Transfer to ${transferType === 'dealer' ? 'Dealer' : 'Distributor'}`} size="md">
        {transferItem && (
          <form onSubmit={hs2(d => transferMutation.mutate({ id: transferItem.id as number, type: transferType, d }))} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-400">Serial Number</p>
              <p className="font-mono text-sm font-bold text-blue-600">{transferItem.serial_number as string}</p>
            </div>
            <Select
              label={`Select ${transferType === 'dealer' ? 'Dealer' : 'Distributor'}`}
              options={(transferType === 'dealer' ? dealers : distributors).map((x: any) => ({ label: x.business_name, value: x.id }))}
              {...reg2(`${transferType}_id`, { required: 'Required' })}
              placeholder={`Select ${transferType}...`}
            />
            <div className="pt-3 flex gap-3 justify-end border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setTransferItem(null)}>Cancel</Button>
              <Button type="submit" loading={transferMutation.isPending}>Confirm Transfer</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
