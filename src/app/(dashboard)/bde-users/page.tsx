'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/lib/api'
import { formatDate, formatCurrency, getErrorMessage } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, SearchInput, Spinner, EmptyState, Pagination, Input, Select, Stat } from '@/components/ui/Badge'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { UserCheck, Plus, Eye, TrendingUp } from 'lucide-react'

export default function BdeUsersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [viewItem, setViewItem] = useState<Record<string, unknown> | null>(null)
  const [viewCommissions, setViewCommissions] = useState<Record<string, unknown> | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['bde-users', page, search, levelFilter],
    queryFn: () => api.get('/bde-users', {
      params: { page, search: search || undefined, level: levelFilter !== '' ? levelFilter : undefined }
    }).then(r => r.data),
  })

  const { data: commissionsData, isLoading: commissionsLoading } = useQuery({
    queryKey: ['bde-commissions', viewCommissions?.id],
    queryFn: () => api.get(`/bde-users/${viewCommissions?.id}/commissions`).then(r => r.data),
    enabled: !!viewCommissions,
  })

  const { data: districtsData } = useQuery({ queryKey: ['districts'], queryFn: () => api.get('/districts').then(r => r.data) })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Record<string, string>>()

  const createMutation = useMutation({
    mutationFn: (d: Record<string, string>) => api.post('/bde-users', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bde-users'] }); toast.success('BDE created!'); setShowAdd(false); reset() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const bdeUsers = data?.bde_users?.data || []
  const meta = data?.bde_users?.meta || {}
  const districts = (districtsData?.districts || []).map((d: Record<string, unknown>) => ({ value: d.id as number, label: d.name as string }))
  const commissions = commissionsData?.commissions?.data || []
  const commSummary = commissionsData?.summary || {}

  const LEVEL_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444']
  const LEVEL_BG = ['#dbeafe', '#d1fae5', '#fef3c7', '#fee2e2']

  return (
    <div className="fade-in-up">
      <PageHeader
        title="BDE Users"
        subtitle="Business Development Executives — 3-level hierarchy"
        icon={<UserCheck className="h-5 w-5" />}
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>Add BDE</Button>
        }
      />

      {/* Level filter pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[{ value: '', label: 'All Levels' }, { value: '0', label: 'Level 0 (Top)' }, { value: '1', label: 'Level 1' }, { value: '2', label: 'Level 2' }, { value: '3', label: 'Level 3' }].map(o => (
          <button key={o.value} onClick={() => { setLevelFilter(o.value); setPage(1) }}
            className="px-3 py-1.5 text-xs rounded-xl font-semibold transition-all"
            style={levelFilter === o.value ? {
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
            } : { background: '#f1f5f9', color: '#64748b' }}>
            {o.label}
          </button>
        ))}
        <div className="flex-1 min-w-[200px]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search BDE name, email..." />
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-48"><Spinner /></div>
        ) : bdeUsers.length === 0 ? (
          <EmptyState title="No BDE users found" description="Add your first BDE to build the network"
            action={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>Add BDE</Button>} />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>BDE</Th><Th>Level</Th><Th>District</Th><Th>Parent</Th><Th>Emp Code</Th><Th>Status</Th><Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {bdeUsers.map((b: Record<string, unknown>) => (
                  <Tr key={b.id as number}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: `linear-gradient(135deg,${LEVEL_COLORS[b.level as number] || '#64748b'},${LEVEL_COLORS[(b.level as number) + 1] || '#475569'})` }}>
                          {(b.user as Record<string,unknown>)?.name?.toString()?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{(b.user as Record<string,unknown>)?.name as string}</p>
                          <p className="text-xs text-slate-400">{(b.user as Record<string,unknown>)?.email as string}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: LEVEL_BG[b.level as number] || '#f1f5f9', color: LEVEL_COLORS[b.level as number] || '#64748b' }}>
                        L{b.level as number}
                      </span>
                    </Td>
                    <Td className="text-sm text-slate-600">{(b.district as Record<string,unknown>)?.name as string || '—'}</Td>
                    <Td className="text-xs text-slate-500">
                      {(b.parent as Record<string,unknown>)?.user ? ((b.parent as Record<string,unknown>).user as Record<string,unknown>).name as string : <span className="text-slate-300">Root</span>}
                    </Td>
                    <Td><span className="font-mono text-xs text-slate-600">{(b.employee_code as string) || '—'}</span></Td>
                    <Td><Badge label={b.is_active ? 'active' : 'inactive'} status={b.is_active ? 'active' : 'inactive'} /></Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" leftIcon={<Eye className="h-3.5 w-3.5" />} onClick={() => setViewItem(b)}>View</Button>
                        <Button size="sm" variant="outline" leftIcon={<TrendingUp className="h-3.5 w-3.5" />}
                          onClick={() => setViewCommissions(b)}>Commissions</Button>
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

      {/* Add BDE Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title="Add BDE User" subtitle="Create a new BDE in the hierarchy" size="lg">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" {...register('name', { required: 'Required' })} error={errors.name?.message} />
            <Input label="Email" type="email" {...register('email', { required: 'Required' })} error={errors.email?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Mobile" {...register('mobile', { required: 'Required' })} error={errors.mobile?.message} />
            <Input label="Password" type="password" {...register('password', { required: 'Required' })} error={errors.password?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Employee Code (optional)" {...register('employee_code')} />
            <Select label="District" options={districts} {...register('district_id')} placeholder="Select district..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Parent BDE ID (for sub-BDE)" type="number" {...register('parent_bde_id')} hint="Leave blank for top-level BDE" />
            <Input label="Joining Date" type="date" {...register('joined_date')} />
          </div>
          <div className="pt-3 flex gap-3 justify-end" style={{ borderTop: '1px solid #f1f5f9' }}>
            <Button variant="outline" type="button" onClick={() => { setShowAdd(false); reset() }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create BDE</Button>
          </div>
        </form>
      </Modal>

      {/* View BDE Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="BDE Profile" size="md">
        {viewItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: `linear-gradient(135deg,${LEVEL_BG[viewItem.level as number] || '#f1f5f9'},#f8fafc)` }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                style={{ background: `linear-gradient(135deg,${LEVEL_COLORS[viewItem.level as number] || '#64748b'}, #475569)`, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                {(viewItem.user as Record<string,unknown>)?.name?.toString()?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">{(viewItem.user as Record<string,unknown>)?.name as string}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{(viewItem.user as Record<string,unknown>)?.email as string}</p>
                <div className="mt-1.5 flex gap-1.5">
                  <Badge label={viewItem.is_active ? 'active' : 'inactive'} status={viewItem.is_active ? 'active' : 'inactive'} />
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: LEVEL_BG[viewItem.level as number], color: LEVEL_COLORS[viewItem.level as number] }}>
                    Level {viewItem.level as number}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Employee Code', (viewItem.employee_code as string) || '—', 'bi-person-badge'],
                ['District', (viewItem.district as Record<string,unknown>)?.name as string || '—', 'bi-geo-alt'],
                ['Parent BDE', (viewItem.parent as Record<string,unknown>)?.user ? ((viewItem.parent as Record<string,unknown>).user as Record<string,unknown>).name as string : 'Root BDE', 'bi-diagram-3'],
                ['Joined', formatDate(viewItem.joined_date as string), 'bi-calendar'],
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

      {/* Commissions Modal */}
      <Modal open={!!viewCommissions} onClose={() => setViewCommissions(null)} title="Commission Statement" subtitle={(viewCommissions?.user as Record<string,unknown>)?.name as string} size="xl">
        {viewCommissions && (
          <div className="space-y-4">
            {commissionsLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Earned', value: formatCurrency(commSummary.total_earned || 0), color: 'green' },
                    { label: 'Total Paid', value: formatCurrency(commSummary.total_paid || 0), color: 'blue' },
                    { label: 'Pending', value: formatCurrency(commSummary.pending || 0), color: 'orange' },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <p className="text-[11px] text-slate-400">{s.label}</p>
                      <p className="text-base font-bold text-slate-800 mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>
                <Table>
                  <Thead>
                    <Tr><Th>Invoice</Th><Th>Date</Th><Th>Commission</Th><Th>Status</Th></Tr>
                  </Thead>
                  <Tbody>
                    {commissions.map((c: Record<string, unknown>) => (
                      <Tr key={c.id as number}>
                        <Td><span className="font-mono text-xs text-blue-600">{(c.sale as Record<string,unknown>)?.invoice_number as string}</span></Td>
                        <Td className="text-xs text-slate-500">{formatDate(c.earned_at as string)}</Td>
                        <Td className="font-bold text-emerald-600">{formatCurrency(c.commission_rate_rs as number)}</Td>
                        <Td><Badge label={c.payment_status as string} status={c.payment_status as string} /></Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                {commissions.length === 0 && <p className="text-center text-sm text-slate-400 py-4">No commissions yet</p>}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
