'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, SearchInput, Spinner, EmptyState, Pagination, Input, Select } from '@/components/ui/Badge'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ShoppingCart, Plus, Eye, Download, X, Printer } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]
const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'emi', label: 'EMI' },
  { value: 'cheque', label: 'Cheque' },
]
const WARRANTY_TYPES = [
  { value: 'no_warranty', label: 'No Warranty' },
  { value: 'with_warranty', label: 'With Warranty' },
  { value: 'with_guarantee', label: 'With Guarantee' },
]
const BATTERY_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'lead_acid', label: 'Lead Acid' },
  { value: 'lithium_ion', label: 'Lithium Ion' },
]

export default function SalesPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [invoice, setInvoice] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [discountType, setDiscountType] = useState<'flat'|'percent'>('flat')
  const [viewItem, setViewItem] = useState<Record<string, unknown> | null>(null)
  const [cancelId, setCancelId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, invoice, status, from, to],
    queryFn: () => api.get('/sales', {
      params: { page, invoice: invoice || undefined, status: status || undefined, from: from || undefined, to: to || undefined }
    }).then(r => r.data),
  })

  const { data: dealersData } = useQuery({ queryKey: ['dealers-list'], queryFn: () => api.get('/dealers').then(r => r.data) })
  const { data: customersData } = useQuery({ queryKey: ['customers-list'], queryFn: () => api.get('/customers').then(r => r.data) })
  const { data: vehiclesData } = useQuery({ queryKey: ['vehicles-stock'], queryFn: () => api.get('/vehicles', { params: { status: 'in_stock_dealer' } }).then(r => r.data) })
  const { data: productsData } = useQuery({ queryKey: ['products-list'], queryFn: () => api.get('/products').then(r => r.data) })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<Record<string, any>>()
  const selectedDealerId = watch('dealer_id')

  
  const extractArray = (r: any) => r.data?.components?.data || r.data?.components || (Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []));
  const { data: dealerBatteries = [] } = useQuery({ 
    queryKey: ['dealer-batteries', selectedDealerId], 
    queryFn: () => selectedDealerId ? api.get('/components', { params: { type: 'battery', owner_type: 'dealer', owner_id: selectedDealerId, status: 'in_stock_dealer', per_page: 100 } }).then(extractArray) : [],
    enabled: !!selectedDealerId
  })
  const { data: dealerChargers = [] } = useQuery({ 
    queryKey: ['dealer-chargers', selectedDealerId], 
    queryFn: () => selectedDealerId ? api.get('/components', { params: { type: 'charger', owner_type: 'dealer', owner_id: selectedDealerId, status: 'in_stock_dealer', per_page: 100 } }).then(extractArray) : [],
    enabled: !!selectedDealerId
  })

  const battOptions = (Array.isArray(dealerBatteries) ? dealerBatteries : dealerBatteries.data || []).map((b: any) => ({ value: b.id, label: `${b.serial_number} (${b.product?.name})` }));
  const chargerOptions = (Array.isArray(dealerChargers) ? dealerChargers : dealerChargers.data || []).map((c: any) => ({ value: c.id, label: `${c.serial_number} (${c.product?.name})` }));

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/sales', { ...d, battery_ids: d.battery_ids?.map(Number) || [], charger_id: d.charger_id || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); toast.success('Sale recorded!'); setShowAdd(false); reset() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.patch(`/sales/${id}/cancel`, { cancel_reason: reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); toast.success('Sale cancelled'); setCancelId(null); setCancelReason('') },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const sales = data?.sales?.data || []
  const meta = data?.sales?.meta || {}
  const rawDealers = dealersData?.dealers?.data || (Array.isArray(dealersData?.dealers) ? dealersData?.dealers : []);
  const dealers = rawDealers.map((d: Record<string, unknown>) => ({ value: d.id as number, label: d.business_name as string }))
  const customers = (customersData?.customers?.data || []).map((c: Record<string, unknown>) => ({ value: c.id as number, label: `${c.name} (${c.mobile})` }))
  const vehicles = (vehiclesData?.vehicles?.data || []).map((v: Record<string, unknown>) => ({ value: v.chassis_number as string, label: `${(v.product as Record<string,unknown>)?.name} - ${v.chassis_number}`, chassis: v.chassis_number }))
  const products = (productsData?.products?.data || []).map((p: Record<string, unknown>) => ({ value: p.id as number, label: p.name as string }))
  const watchedChassis = watch('chassis_number')
  const chassisExistsInStock = vehicles.some((v:any) => v.chassis === watchedChassis)
  const selectedVehicle = vehiclesData?.vehicles?.data?.find((v:any) => v.chassis_number === watchedChassis)
  const isNewCustomer = watch('customer_id') === 'new'

  const watchedTaxableAmount = watch('taxable_amount') || '0';
  const watchedDiscountValue = watch('discount_value') || '0';
  const watchedAmountPaid = watch('amount_paid') || '';
  const watchedBatteryType = watch('battery_type') || 'none';
  const watchedLeadAcidCount = watch('lead_acid_battery_count') || '4';
  const defaultDealerId = dealers.length === 1 ? dealers[0].value : (dealers.length > 0 ? dealers[0].value : '');
  const isBatteryValid = (serial: string) => serial && dealerBatteries.some((b:any) => b.serial_number === serial);
  const isChargerValid = (serial: string) => serial && dealerChargers.some((c:any) => c.serial_number === serial);
  const watchedChargerSerial = watch('charger_serial');
  const watchedLithiumSerial = watch('battery_serial');
  const watchedLeadAcidSerials = [0,1,2,3,4,5].map(i => watch(`battery_serials.${i}`));
  const taxAmtNum = parseFloat(watchedTaxableAmount) || 0;
  const discValNum = parseFloat(watchedDiscountValue) || 0;
  const computedDiscount = discountType === 'percent' ? (taxAmtNum * discValNum / 100) : discValNum;
  const computedNet = Math.max(0, taxAmtNum - computedDiscount);
  const estimatedGst = computedNet * 0.05; // Most EVs are 5%
  const computedTotal = Math.round(computedNet + estimatedGst);
  const paidNum = watchedAmountPaid ? parseFloat(watchedAmountPaid) : computedTotal;
  const computedDue = Math.max(0, computedTotal - paidNum);


  useEffect(() => {
    if (selectedVehicle) {
      setValue('product_id', String(selectedVehicle.product_id || ''))
      setValue('motor_number', selectedVehicle.motor_number || '')
      setValue('controller_number', selectedVehicle.controller_serial || '')
      setValue('color', selectedVehicle.color || '')
      setValue('variant', selectedVehicle.variant || '')
    }
    if (defaultDealerId) {
       setValue('dealer_id', defaultDealerId);
    }
  }, [selectedVehicle, setValue, defaultDealerId])
  return (
    <div className="fade-in-up">
      <PageHeader
        title="Sales"
        subtitle={`${meta.total || 0} total transactions`}
        icon={<ShoppingCart className="h-5 w-5" />}
        actions={
          user?.role === 'dealer' && (
            <div className="flex gap-2">
              <a href="/api/export/sales" download>
                <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
              </a>
              <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>New Sale</Button>
            </div>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-[200px]">
          <SearchInput value={invoice} onChange={setInvoice} placeholder="Search invoice number..." />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-48"><Spinner /></div>
        ) : sales.length === 0 ? (
          <EmptyState title="No sales found" description="Record a new sale to get started"
            action={user?.role === 'dealer' ? <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>New Sale</Button> : undefined} />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Invoice</Th><Th>Date</Th><Th>Customer</Th><Th>Dealer</Th><Th>Product</Th><Th>Amount</Th><Th>Payment</Th><Th>Status</Th><Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {sales.map((s: Record<string, unknown>) => (
                  <Tr key={s.id as number}>
                    <Td>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: '#eff6ff', color: '#2563eb' }}>
                        {s.invoice_number as string}
                      </span>
                    </Td>
                    <Td className="text-xs text-slate-500">{formatDate(s.sold_at as string)}</Td>
                    <Td>
                      <p className="text-sm font-medium text-slate-800">{(s.customer as Record<string,unknown>)?.name as string}</p>
                      <p className="text-xs text-slate-400">{(s.customer as Record<string,unknown>)?.mobile as string}</p>
                    </Td>
                    <Td className="text-sm text-slate-600">{(s.dealer as Record<string,unknown>)?.business_name as string}</Td>
                    <Td className="text-xs text-slate-600">{(s.product as Record<string,unknown>)?.name as string}</Td>
                    <Td>
                      <p className="text-sm font-bold text-emerald-600">{formatCurrency(s.invoice_total as number)}</p>
                      {(s.amount_due as number) > 0 && (
                        <p className="text-[11px] text-red-500">Due: {formatCurrency(s.amount_due as number)}</p>
                      )}
                    </Td>
                    <Td>
                      <span className="text-xs capitalize px-2 py-0.5 rounded-full font-medium"
                        style={{ background: '#f1f5f9', color: '#475569' }}>
                        {(s.payment_mode as string)?.replace('_', ' ')}
                      </span>
                    </Td>
                    <Td><Badge label={s.status as string} status={s.status as string} /></Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sales/${s.id}/invoice`, '_blank')}>
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" leftIcon={<Eye className="h-3.5 w-3.5" />} onClick={() => setViewItem(s)}>View</Button>
                        {s.status === 'completed' && user?.role === 'dealer' && (
                          <Button size="sm" variant="ghost" leftIcon={<X className="h-3.5 w-3.5" />}
                            style={{ color: '#ef4444' }} onClick={() => setCancelId(s.id as number)}>Cancel</Button>
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

      {/* New Sale Modal */}
            <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title="Record New Sale" subtitle="Complete vehicle sale transaction" size="2xl">
        <form onSubmit={handleSubmit(d => {
            const taxAmt = parseFloat(d.taxable_amount) || 0;
            const discVal = parseFloat(d.discount_value) || 0;
            const discAmt = discountType === 'percent' ? (taxAmt * discVal / 100) : discVal;
            const payload: any = { ...d, discount_amount: discAmt, with_battery: d.battery_type !== 'none' ? 'true' : 'false' };
            if (payload.customer_id === 'new') {
                delete payload.customer_id;
            }
            createMutation.mutate(payload);
        })} className="space-y-6">
            
            {/* 1. Customer Selection */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs">1</span> Customer Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Dealer" options={dealers} {...register('dealer_id', { required: 'Required' })} error={errors.dealer_id?.message as string} placeholder="Select dealer..." disabled={true} />
                <Select label="Customer" options={[{value: 'new', label: '+ Add New Customer'}, ...customers]} {...register('customer_id', { required: 'Required' })} error={errors.customer_id?.message as string} placeholder="Select customer..." />
              </div>

              {isNewCustomer && (
                  <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <Input label="Full Name" {...register('customer_name', { required: isNewCustomer ? 'Required' : false })} />
                          <Input label="Mobile Number" {...register('customer_mobile', { required: isNewCustomer ? 'Required' : false })} />
                          <Input label="City/Village" {...register('customer_city')} />
                          <Input label="Pincode" {...register('customer_pincode')} />
                      </div>
                      <Input label="Full Address" {...register('customer_address')} />
                  </div>
              )}
            </div>

            {/* 2. EV Configuration */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs">2</span> Vehicle Details
              </h3>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-5">
                  <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-700">Base Chassis & Motor</h4>
                      {watchedChassis && chassisExistsInStock && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full"><i className="bi bi-check-circle-fill mr-1.5" />In Stock</span>
                      )}
                  </div>
                  
                  {!chassisExistsInStock && (
                     <div className="mb-3">
                         <Select label="EV Model (Product)" options={products} {...register('product_id', { required: !chassisExistsInStock ? 'Required' : false })} placeholder="Select Model..." />
                     </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                      <Select label="Chassis Number" options={vehicles} {...register('chassis_number', { required: 'Required' })} placeholder="Select Chassis..." />
                      <Input label="Motor Number" {...register('motor_number')} disabled={chassisExistsInStock} />
                      <Input label="Controller Serial" {...register('controller_number')} disabled={chassisExistsInStock} />
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                      <Input label="Motor Warranty (Mos)" type="number" {...register('motor_warranty_months')} />
                      <Input label="Controller Warranty (Mos)" type="number" {...register('controller_warranty_months')} />
                      <Input label="Color" {...register('color')} disabled={chassisExistsInStock} />
                      <Input label="Variant" {...register('variant')} disabled={chassisExistsInStock} />
                  </div>
              </div>

              {/* 3. Components */}
              {watchedChassis && chassisExistsInStock && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4">
                        <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                            <i className="bi bi-battery-charging text-lg" /> Battery Details
                        </h4>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Select label="Battery Type" options={BATTERY_TYPES} {...register('battery_type')} placeholder="Select Type..." />
                                {watchedBatteryType !== 'none' && (
                                    <Input label="Battery Capacity (e.g. 60V 32Ah)" {...register('battery_capacity')} />
                                )}
                            </div>
                            
                            {watchedBatteryType === 'lead_acid' && (
                                <div className="space-y-4">
                                    <Select label="Number of Batteries" options={[{value:'3',label:'3'},{value:'4',label:'4'},{value:'5',label:'5'},{value:'6',label:'6'}]} {...register('lead_acid_battery_count')} />
                                    <div className="grid grid-cols-2 gap-3">
                                        {Array.from({length: parseInt(watchedLeadAcidCount) || 4}).map((_, i) => (
                                            <div key={i} className="relative">
                                                <Input label={`Serial No ${i+1}`} {...register(`battery_serials.${i}`)} placeholder="Enter Serial..." />
                                                {isBatteryValid(watchedLeadAcidSerials[i]) && (
                                                    <span className="absolute right-3 top-[34px] text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full shadow-sm"><i className="bi bi-check-circle-fill mr-1" />In Stock</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {watchedBatteryType === 'lithium_ion' && (
                                <div className="relative">
                                    <Input label="Battery Serial 1" {...register('battery_serial')} placeholder="Enter Lithium Battery Serial..." />
                                    {isBatteryValid(watchedLithiumSerial) && (
                                        <span className="absolute right-3 top-[34px] text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full shadow-sm"><i className="bi bi-check-circle-fill mr-1" />In Stock</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 space-y-4">
                        <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                            <i className="bi bi-plug text-lg" /> Charger Details
                        </h4>
                        <div className="space-y-3">
                            <div className="relative">
                                <Input label="Charger Serial" {...register('charger_serial')} placeholder="Enter Charger Serial..." />
                                {isChargerValid(watchedChargerSerial) && (
                                    <span className="absolute right-3 top-[34px] text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full shadow-sm"><i className="bi bi-check-circle-fill mr-1" />In Stock</span>
                                )}
                            </div>
                            <Input label="Charger Config" {...register('charger_configuration')} placeholder="e.g. 60V 3A" />
                        </div>
                    </div>
                  </div>
              )}
            </div>

            {/* 4. Financials */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs">3</span> Financials & Billing
              </h3>
              
              <div className="flex gap-6">
                {/* Left Side: Inputs */}
                <div className="flex-1 space-y-4">
                  <Input label="Taxable Amount (₹)" type="number" {...register('taxable_amount', { required: 'Required' })} error={errors.taxable_amount?.message as string} className="text-lg font-semibold" />
                  
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">Discount</label>
                    <div className="flex gap-2 mb-2">
                        <button type="button" onClick={() => setDiscountType('flat')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${discountType === 'flat' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Flat (₹)</button>
                        <button type="button" onClick={() => setDiscountType('percent')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${discountType === 'percent' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Percent (%)</button>
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">{discountType === 'flat' ? '₹' : '%'}</span>
                        <input type="number" {...register('discount_value')} className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-400 outline-none" placeholder="0.00" />
                    </div>
                  </div>

                  <Select label="Warranty Plan" options={WARRANTY_TYPES} {...register('warranty_type', { required: 'Required' })} error={errors.warranty_type?.message as string} placeholder="Select..." />
                  
                  <div className="grid grid-cols-2 gap-4">
                    
                    
                  </div>
                </div>

                {/* Right Side: Calculation Summary Card */}
                <div className="w-[320px] bg-slate-800 rounded-2xl p-5 text-white shadow-xl flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-4">Billing Summary</h4>
                    
                    <div className="space-y-3 flex-1">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Taxable Amount</span>
                            <span className="font-semibold">{formatCurrency(taxAmtNum)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Discount ({discountType === 'flat' ? 'Flat' : watchedDiscountValue + '%'})</span>
                            <span className="font-semibold text-emerald-400">- {formatCurrency(computedDiscount)}</span>
                        </div>
                        <div className="w-full h-px bg-slate-700 my-2"></div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Net Taxable</span>
                            <span className="font-semibold">{formatCurrency(computedNet)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Est. GST (5% approx)</span>
                            <span className="font-semibold">+ {formatCurrency(estimatedGst)}</span>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="flex justify-between items-end">
                            <span className="text-slate-300 font-medium text-sm">Est. Grand Total</span>
                            <span className="text-2xl font-black text-white">{formatCurrency(computedTotal)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 text-right">*Final GST will be calculated by system</p>
                    </div>
                </div>
              </div>
            </div>

            {/* 5. Payment Details */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs">4</span> Payment Details
              </h3>
              
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                  <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-2">Select Payment Mode</label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {[
                              { id: 'cash', icon: 'bi-cash-stack', label: 'Cash' },
                              { id: 'upi', icon: 'bi-qr-code-scan', label: 'UPI' },
                              { id: 'bank_transfer', icon: 'bi-bank', label: 'Bank' },
                              { id: 'card', icon: 'bi-credit-card', label: 'Card' },
                              { id: 'emi', icon: 'bi-calendar-check', label: 'EMI' },
                              { id: 'cheque', icon: 'bi-journal-check', label: 'Cheque' },
                          ].map(mode => (
                              <label key={mode.id} className="cursor-pointer">
                                  <input type="radio" value={mode.id} {...register('payment_mode', { required: 'Required' })} className="hidden peer" />
                                  <div className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-xl peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 text-slate-500 hover:bg-slate-50 transition-all text-center">
                                      <i className={`bi ${mode.icon} text-xl mb-1`} />
                                      <span className="text-[10px] font-bold uppercase">{mode.label}</span>
                                  </div>
                              </label>
                          ))}
                      </div>
                      {errors.payment_mode && <p className="text-xs text-red-500 mt-1">{errors.payment_mode.message as string}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <Input label="Payment Reference / Txn ID" {...register('payment_reference')} placeholder="e.g. UPI Ref / Cheque No" />
                      <div className="flex gap-4">
                          <div className="flex-1">
                              <Input label="Amount Paid Now (₹)" type="number" {...register('amount_paid')} placeholder="Full amount if empty" className="font-semibold text-blue-700" />
                          </div>
                          {computedDue > 0 && (
                              <div className="flex-1 flex flex-col justify-end">
                                  <div className="p-2.5 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center">
                                      <span className="text-xs font-bold text-red-700">Due Amt:</span>
                                      <span className="text-sm font-black text-red-700">{formatCurrency(computedDue)}</span>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
                  
                  <Input label="Sale Notes" {...register('notes')} placeholder="Any additional notes or comments..." />
              </div>
            </div>

            <div className="pt-4 flex gap-3 justify-end" style={{ borderTop: '1px solid #f1f5f9' }}>
              <Button variant="outline" type="button" onClick={() => { setShowAdd(false); reset() }} className="rounded-xl font-bold px-6">Cancel</Button>
              <Button type="submit" loading={createMutation.isPending} className="rounded-xl font-bold px-8 shadow-lg shadow-blue-500/30 bg-gradient-to-r from-blue-600 to-indigo-600">Complete Sale</Button>
            </div>
          </form>
      </Modal>


      {/* Cancel Sale Modal */}
      <Modal open={!!cancelId} onClose={() => { setCancelId(null); setCancelReason('') }} title="Cancel Sale" subtitle="This will reverse the transaction" size="sm">
        <div className="space-y-4">
          <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <i className="bi bi-exclamation-triangle-fill text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">This will return the vehicle to dealer stock and reverse BDE commissions.</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Cancellation Reason *</label>
            <textarea
              value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              rows={3} placeholder="Explain reason for cancellation..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setCancelId(null); setCancelReason('') }}>Keep Sale</Button>
            <Button variant="danger" loading={cancelMutation.isPending} disabled={cancelReason.trim().length < 5}
              onClick={() => cancelId && cancelReason.trim().length >= 5 && cancelMutation.mutate({ id: cancelId, reason: cancelReason.trim() })}>
              Cancel Sale
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Sale Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Sale Details" subtitle={viewItem?.invoice_number as string} size="lg">
        {viewItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Invoice #', viewItem.invoice_number as string, 'bi-receipt'],
                ['Sale Date', formatDate(viewItem.sold_at as string), 'bi-calendar'],
                ['Customer', (viewItem.customer as Record<string,unknown>)?.name as string, 'bi-person'],
                ['Dealer', (viewItem.dealer as Record<string,unknown>)?.business_name as string, 'bi-shop'],
                ['Product', (viewItem.product as Record<string,unknown>)?.name as string, 'bi-lightning-charge'],
                ['Payment Mode', (viewItem.payment_mode as string)?.replace('_', ' '), 'bi-cash-coin'],
                ['Warranty', viewItem.warranty_type as string, 'bi-shield-check'],
                ['Batteries', (viewItem.vehicle as any)?.components?.filter((c: any) => c.type === 'battery').map((c: any) => c.serial_number).join(', ') || 'No battery', 'bi-battery-charging'],
                  ['Charger', (viewItem.vehicle as any)?.components?.find((c: any) => c.type === 'charger')?.serial_number || 'No charger', 'bi-plug'],
                ['Bat. War.', `${viewItem.battery_warranty_months || 0} mos`, 'bi-battery-half'],
                ['Motor War.', `${viewItem.motor_warranty_months || 0} mos`, 'bi-gear'],
                ['Chgr War.', `${viewItem.charger_warranty_months || 0} mos`, 'bi-plug'],
                ['Ctrl War.', `${viewItem.controller_warranty_months || 0} mos`, 'bi-cpu'],
              ].map(([k, v, icon]) => (
                <div key={k} className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1"><i className={`bi ${icon}`} />{k}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 capitalize">{v || '—'}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #bbf7d0' }}>
              <div className="px-4 py-2.5" style={{ background: 'linear-gradient(to right,#f0fdf4,#ecfdf5)', borderBottom: '1px solid #bbf7d0' }}>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="bi bi-calculator" />GST Breakdown
                </p>
              </div>
              <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-emerald-100">
                {[
                  ['Taxable Amount', formatCurrency(viewItem.taxable_after_discount as number)],
                  ['Total Tax', formatCurrency(viewItem.total_tax_amount as number)],
                  ['CGST', formatCurrency(viewItem.cgst_amount as number)],
                  ['SGST', formatCurrency(viewItem.sgst_amount as number)],
                  ['IGST', formatCurrency(viewItem.igst_amount as number)],
                  ['Invoice Total', formatCurrency(viewItem.invoice_total as number)],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 bg-white">
                    <p className="text-[11px] text-slate-400">{k}</p>
                    <p className="text-sm font-bold text-slate-800">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between p-3 rounded-xl" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div>
                <p className="text-xs text-slate-400">Amount Paid</p>
                <p className="text-base font-bold text-blue-700">{formatCurrency(viewItem.amount_paid as number)}</p>
              </div>
              {(viewItem.amount_due as number) > 0 && (
                <div className="text-right">
                  <p className="text-xs text-slate-400">Amount Due</p>
                  <p className="text-base font-bold text-red-600">{formatCurrency(viewItem.amount_due as number)}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button variant="primary" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sales/${viewItem.id}/invoice`, '_blank')}>
                <i className="bi bi-printer mr-2" />Print Invoice
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
