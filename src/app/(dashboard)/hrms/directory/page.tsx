'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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
import { Plus, Download, UserPlus, Eye, Users } from 'lucide-react'

const ENTITY_OPTIONS = [
  { value: 'company',     label: 'Company HQ' },
  { value: 'dealer',      label: 'Dealer' },
  { value: 'distributor', label: 'Distributor' },
]

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract',  label: 'Contract' },
  { value: 'intern',    label: 'Intern' },
]

const EMPLOYMENT_COLORS: Record<string, string> = {
  full_time: 'bg-emerald-50 text-emerald-700',
  part_time: 'bg-blue-50 text-blue-700',
  contract:  'bg-purple-50 text-purple-700',
  intern:    'bg-amber-50 text-amber-700',
}

export default function EmployeesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showAddDept, setShowAddDept] = useState(false)
  const [viewEmp, setViewEmp] = useState<Record<string,unknown> | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search, entityType, entityId],
    queryFn: () => api.get('/hrms/employees', {
      params: { page, search: search || undefined, entity_type: entityType || undefined, entity_id: entityId || undefined }
    }).then(r => r.data.employees),
  })

  const { data: depts } = useQuery({
    queryKey: ['departments', entityType, entityId],
    queryFn: () => api.get('/hrms/departments', {
      params: { entity_type: entityType || 'company', entity_id: entityId || undefined }
    }).then(r => r.data.departments),
    enabled: showAdd || showAddDept,
  })

  const { data: dealersData } = useQuery({
    queryKey: ['dealers-list'],
    queryFn: () => api.get('/dealers').then(r => r.data.dealers.data || r.data.dealers),
    enabled: showAdd && entityType === 'dealer'
  })

  const { data: distributorsData } = useQuery({
    queryKey: ['distributors-list'],
    queryFn: () => api.get('/distributors').then(r => r.data.distributors.data || r.data.distributors),
    enabled: showAdd && entityType === 'distributor'
  })

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<Record<string,any>>()
  const { register: regDept, handleSubmit: handleDeptSubmit, reset: resetDept } = useForm<Record<string,string>>()

  const createLogin = watch('create_login')

  const createMutation = useMutation({
    mutationFn: (d: Record<string,string>) => api.post('/hrms/employees', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee created!')
      setShowAdd(false)
      reset()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const createDeptMutation = useMutation({
    mutationFn: (d: Record<string,string>) => api.post('/hrms/departments', { ...d, entity_type: entityType || 'company', entity_id: entityId || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Department added!')
      setShowAddDept(false)
      resetDept()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => api.put(`/hrms/employees/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Status updated!')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const employees = data?.data || []
  const meta = data?.meta || {}

  return (
    <div className="fade-in-up">
      <PageHeader
        title="Employee Directory"
        subtitle="Browse your organization's people, departments, and roles."
        icon={<Users className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <a href="/api/export/commissions" download>
              <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            </a>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>
              Add Employee
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-[200px]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, code, mobile..." />
        </div>
        <select
          value={entityType} onChange={e => { setEntityType(e.target.value); setEntityId(''); }}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
        >
          <option value="">All Entity Types</option>
          {ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {entityType === 'dealer' && (
          <select
            value={entityId} onChange={e => setEntityId(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 w-48 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          >
            <option value="">Select Dealer...</option>
            {(dealersData || []).map((d: any) => <option key={d.id} value={d.id}>{d.user?.name || d.name || `Dealer #${d.id}`}</option>)}
          </select>
        )}
        {entityType === 'distributor' && (
          <select
            value={entityId} onChange={e => setEntityId(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 w-48 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          >
            <option value="">Select Distributor...</option>
            {(distributorsData || []).map((d: any) => <option key={d.id} value={d.id}>{d.user?.name || d.name || `Distributor #${d.id}`}</option>)}
          </select>
        )}
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Spinner /></div>
        ) : employees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description="Add your first employee to get started"
            action={
              <Button size="sm" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>
                Add Employee
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Code</Th><Th>Employee</Th><Th>Entity</Th><Th>Department</Th>
                  <Th>Type</Th><Th>Gross Salary</Th><Th>Status</Th><Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {employees.map((emp: Record<string,unknown>) => (
                  <Tr key={emp.id as number}>
                    <Td>
                      <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                        {emp.employee_code as string}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #2563eb, #8b5cf6)' }}>
                          {(emp.first_name as string)?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {emp.first_name as string} {emp.last_name as string}
                          </p>
                          <p className="text-xs text-slate-400">{emp.mobile as string}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <Badge label={emp.entity_type as string} />
                        {emp.entity_id && <span className="text-xs text-slate-400">#{emp.entity_id as number}</span>}
                      </div>
                    </Td>
                    <Td className="text-xs text-slate-600">{(emp.department as Record<string,unknown>)?.name as string || '—'}</Td>
                    <Td>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${EMPLOYMENT_COLORS[emp.employment_type as string] || 'bg-slate-100 text-slate-600'}`}>
                        {emp.employment_type as string}
                      </span>
                    </Td>
                    <Td className="font-semibold text-slate-800">{formatCurrency(emp.gross_salary as number)}</Td>
                    <Td>
                      <select
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-500/30 ${
                          emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                          emp.status === 'inactive' ? 'bg-slate-100 text-slate-600' :
                          emp.status === 'on_leave' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}
                        value={emp.status as string}
                        onChange={(e) => updateStatusMutation.mutate({ id: emp.id as number, status: e.target.value })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </Td>
                    <Td>
                      <Button size="sm" variant="ghost" leftIcon={<Eye className="h-3.5 w-3.5" />}
                        onClick={() => setViewEmp(emp)}>
                        View
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination current={meta.current_page || 1} last={meta.last_page || 1} onChange={setPage} />
          </>
        )}
      </Card>

      {/* Add Employee Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Employee" subtitle="Fill in the employee details below" size="xl">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Entity Type" options={ENTITY_OPTIONS}
              {...register('entity_type', { required: 'Required' })}
              error={errors.entity_type?.message} placeholder="Select..." 
              onChange={(e: any) => { setEntityType(e.target.value); setEntityId(''); }}
            />
            {entityType === 'company' || !entityType ? (
              <Input label="Entity ID" placeholder="Leave blank for Company" disabled value="" />
            ) : entityType === 'dealer' ? (
              <Select label="Select Dealer" 
                options={(dealersData || []).map((d: any) => ({ value: d.id, label: d.user?.name || d.name || `Dealer #${d.id}` }))}
                {...register('entity_id')} placeholder="Select Dealer..." />
            ) : (
              <Select label="Select Distributor" 
                options={(distributorsData || []).map((d: any) => ({ value: d.id, label: d.user?.name || d.name || `Distributor #${d.id}` }))}
                {...register('entity_id')} placeholder="Select Distributor..." />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" {...register('first_name', { required: 'Required' })} error={errors.first_name?.message} />
            <Input label="Last Name" {...register('last_name')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Mobile" {...register('mobile', { required: 'Required' })} error={errors.mobile?.message} />
            <Input label="Email" type="email" {...register('email')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label="Employment Type" options={EMPLOYMENT_TYPES} placeholder="Select..."
              {...register('employment_type', { required: 'Required' })} error={errors.employment_type?.message} />
            <Input label="Joining Date" type="date" {...register('joining_date', { required: 'Required' })} error={errors.joining_date?.message} />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Department</label>
                <button type="button" onClick={() => setShowAddDept(true)} className="text-xs text-blue-600 hover:underline">
                  + Add New
                </button>
              </div>
              <select
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                {...register('department_id')}
              >
                <option value="">Select dept...</option>
                {(depts || []).map((d: Record<string,unknown>) => (
                  <option key={d.id as number} value={d.id as number}>{d.name as string}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Basic Salary (₹)" type="number" {...register('basic_salary', { required: 'Required' })} error={errors.basic_salary?.message} />
            <Input label="HRA (auto-calc if blank)" type="number" {...register('hra')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Bank Account" {...register('bank_account')} />
            <Input label="IFSC Code" {...register('ifsc')} />
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('create_login')} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="text-sm font-semibold text-slate-700">Create Login Account for Employee</span>
            </label>
            {createLogin && (
              <div className="pl-6 text-sm text-slate-500">
                <p className="mb-3 text-xs">An account will be created using the email address provided above.</p>
                <Input label="Password" type="password" placeholder="Minimum 8 characters" {...register('password', { required: createLogin ? 'Required' : false })} error={errors.password?.message as string} />
              </div>
            )}
          </div>

          <div className="pt-3 flex gap-3 justify-end" style={{ borderTop: '1px solid rgba(148,163,184,0.15)' }}>
            <Button variant="outline" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>
              <i className="bi bi-person-plus" />
              Create Employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Department Modal */}
      <Modal open={showAddDept} onClose={() => setShowAddDept(false)} title="Add Department" size="sm">
        <form onSubmit={handleDeptSubmit(d => createDeptMutation.mutate(d))} className="space-y-4">
          <Input label="Department Name" placeholder="e.g. Sales, HR, Tech" {...regDept('name', { required: true })} />
          <div className="pt-3 flex gap-3 justify-end border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowAddDept(false)}>Cancel</Button>
            <Button type="submit" loading={createDeptMutation.isPending}>Add</Button>
          </div>
        </form>
      </Modal>

      {/* View Employee Modal */}
      <Modal open={!!viewEmp} onClose={() => setViewEmp(null)} title="Employee Profile" subtitle="Full employee details and leave balance" size="lg">
        {viewEmp && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #f0f7ff, #f5f3ff)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #2563eb, #8b5cf6)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                {(viewEmp.first_name as string)?.[0]}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {viewEmp.first_name as string} {viewEmp.last_name as string}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-mono">{viewEmp.employee_code as string}</span>
                  {' · '}
                  {viewEmp.employment_type as string}
                </p>
                <div className="mt-1.5">
                  <Badge label={viewEmp.status as string} status={viewEmp.status as string} />
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Mobile', viewEmp.mobile as string, 'bi-phone'],
                ['Email', viewEmp.email as string || '—', 'bi-envelope'],
                ['Entity', `${viewEmp.entity_type}${viewEmp.entity_id ? ' #' + viewEmp.entity_id : ''}`, 'bi-building'],
                ['Joining Date', formatDate(viewEmp.joining_date as string), 'bi-calendar'],
                ['Gross Salary', formatCurrency(viewEmp.gross_salary as number), 'bi-cash-coin'],
                ['Net Salary', formatCurrency(viewEmp.net_salary as number), 'bi-wallet2'],
                ['PF (Employee)', formatCurrency(viewEmp.pf_employee as number), 'bi-bank'],
                ['ESI (Employee)', formatCurrency(viewEmp.esi_employee as number), 'bi-heart-pulse'],
              ].map(([k, v, icon]) => (
                <div key={k as string} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-0.5">
                    <i className={`bi ${icon}`} />
                    {k}
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{v}</p>
                </div>
              ))}
            </div>

            {/* Leave balance */}
            <div className="rounded-2xl overflow-hidden border border-slate-100">
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ background: 'linear-gradient(to right, #f8fafc, #f1f5f9)' }}>
                <i className="bi bi-calendar-week text-blue-500 text-sm" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Leave Balance</p>
              </div>
              <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100">
                {[
                  { type: 'Annual',  balance: viewEmp.annual_leave_balance,  color: '#2563eb', icon: 'bi-sun' },
                  { type: 'Sick',    balance: viewEmp.sick_leave_balance,     color: '#10b981', icon: 'bi-thermometer-half' },
                  { type: 'Casual',  balance: viewEmp.casual_leave_balance,   color: '#8b5cf6', icon: 'bi-umbrella' },
                ].map(lb => (
                  <div key={lb.type as string} className="p-4 text-center bg-white">
                    <i className={`bi ${lb.icon} text-lg`} style={{ color: lb.color }} />
                    <p className="text-2xl font-bold mt-1" style={{ color: lb.color }}>
                      {lb.balance as number ?? '—'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{lb.type as string}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
