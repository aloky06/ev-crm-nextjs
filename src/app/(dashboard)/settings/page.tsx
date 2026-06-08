'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import api from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Spinner } from '@/components/ui/Badge'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Settings, Save } from 'lucide-react'

export default function SettingsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<Record<string, string>>()

  useEffect(() => {
    if (data?.settings) {
      const s = data.settings
      reset({
        company_name:          s.company_name || '',
        gstin:                 s.gstin || '',
        address:               s.address || '',
        state_code:            s.state_code || '',
        dealer_commission_rs:  String(s.dealer_commission_rs || 0),
        distributor_commission_rs: String(s.distributor_commission_rs || 0),
        l0_commission_rs:      String(s.l0_commission_rs || 0),
        l1_commission_rs:      String(s.l1_commission_rs || 0),
        l2_commission_rs:      String(s.l2_commission_rs || 0),
        free_service_count:    String(s.free_service_count || 0),
        free_service_months:   String(s.free_service_months || 0),
        phone:                 s.phone || '',
        email:                 s.email || '',
      })
    }
  }, [data, reset])

  const updateMutation = useMutation({
    mutationFn: (d: Record<string, string>) => api.put('/settings', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Settings updated!') },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64"><Spinner /></div>
    )
  }

  const s = data?.settings || {}

  return (
    <div className="fade-in-up max-w-3xl">
      <PageHeader
        title="Company Settings"
        subtitle="Configure commission rates, service slots and company info"
        icon={<Settings className="h-5 w-5" />}
      />

      <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-5">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle>
              <i className="bi bi-building text-blue-500" />Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Company Name" {...register('company_name', { required: 'Required' })} error={errors.company_name?.message as string} />
            </div>
            <Input label="GSTIN" {...register('gstin')} />
            <Input label="State Code" {...register('state_code')} hint="e.g. 09 for UP, 07 for Delhi" />
            <Input label="Phone" {...register('phone')} />
            <Input label="Email" type="email" {...register('email')} />
            <div className="col-span-2">
              <Input label="Address" {...register('address')} />
            </div>
          </CardContent>
        </Card>

        {/* Commission Rates */}
        <Card>
          <CardHeader>
            <CardTitle>
              <i className="bi bi-cash-coin text-emerald-500" />Commission Rates (₹ per sale)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Input label="Dealer Commission (₹)" type="number" {...register('dealer_commission_rs')} />
            <Input label="Distributor Commission (₹)" type="number" {...register('distributor_commission_rs')} />
            <Input label="BDE Level 0 Commission (₹)" type="number" {...register('l0_commission_rs')} />
            <Input label="BDE Level 1 Commission (₹)" type="number" {...register('l1_commission_rs')} />
            <div className="col-span-2">
              <Input label="BDE Level 2 Commission (₹)" type="number" {...register('l2_commission_rs')} />
            </div>
          </CardContent>
        </Card>

        {/* Service Settings */}
        <Card>
          <CardHeader>
            <CardTitle>
              <i className="bi bi-tools text-purple-500" />Free Service Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Input label="Free Service Count (slots)" type="number" {...register('free_service_count')} />
            <Input label="Service Validity (months)" type="number" {...register('free_service_months')} />
          </CardContent>
        </Card>

        {/* Current values preview */}
        <Card>
          <CardHeader>
            <CardTitle>
              <i className="bi bi-eye text-slate-400" />Current Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Company', s.company_name || '—'],
                ['GSTIN', s.gstin || '—'],
                ['State Code', s.state_code || '—'],
                ['Dealer Commission', `₹${s.dealer_commission_rs || 0}`],
                ['Free Service Slots', String(s.free_service_count || 0)],
                ['Service Validity', `${s.free_service_months || 0} months`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center p-2.5 rounded-xl"
                  style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <span className="text-xs text-slate-400">{k}</span>
                  <span className="text-xs font-semibold text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" leftIcon={<Save className="h-4 w-4" />} loading={updateMutation.isPending} disabled={!isDirty}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  )
}
