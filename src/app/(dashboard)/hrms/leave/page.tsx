'use client'

import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { Badge, Spinner, EmptyState } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { Calendar, Plus, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { Input, Select } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/auth'

export default function LeavePage() {
  const [showApply, setShowApply] = useState(false)
  const [showAction, setShowAction] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<any>(null)
  const [actionType, setActionType] = useState<'approved'|'rejected'>('approved')
  const [approverNote, setApproverNote] = useState('')

  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  // Using a fallback query if leaves table doesn't exist yet
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['leaves'],
    queryFn: () => api.get('/hrms/leave').then(r => r.data).catch(() => ({ leaves: { data: [] } }))
  })

  // Fetch current employee's leave balance
  const { data: summaryData } = useQuery({
    queryKey: ['employeeSummary', 1], // using 1 for demo
    queryFn: () => api.get('/hrms/employees/1/summary').then(r => r.data).catch(() => null)
  })

  const leaveBalance = summaryData?.leave_balance || { annual: 12, sick: 5, casual: 8 }

  const applyMutation = useMutation({
    mutationFn: (d: any) => api.post('/hrms/leave/request', d),
    onSuccess: () => {
      toast.success("Leave application submitted!")
      setShowApply(false)
      reset()
      refetch()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Error submitting leave request.")
    }
  })

  const actionMutation = useMutation({
    mutationFn: (d: { id: number, action: string, approver_note: string }) => 
      api.patch(`/hrms/leave/${d.id}/action`, { action: d.action, approver_note: d.approver_note }),
    onSuccess: () => {
      toast.success(`Leave ${actionType} successfully!`)
      setShowAction(false)
      refetch()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Error processing leave action.")
    }
  })

  const leaves = data?.leaves?.data || []

  const onSubmitLeave = (data: any) => {
    // Hardcoding employee_id to 1 for demo purposes if employee doesn't exist on user
    applyMutation.mutate({
      ...data,
      employee_id: 1, 
      is_half_day: data.is_half_day === 'true' || data.is_half_day === true
    })
  }

  return (
    <div className="fade-in-up pb-10">
      <PageHeader
        title="Leave Management"
        subtitle="Apply for leave and track your time off requests"
        icon={<Calendar className="h-5 w-5" />}
        actions={
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowApply(true)}>
            Apply for Leave
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-4 flex flex-col justify-center items-center bg-blue-50/50 border-blue-100">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Annual Leave</p>
          <p className="text-3xl font-bold text-slate-800">{leaveBalance.annual}<span className="text-sm font-normal text-slate-500 ml-1">Remaining</span></p>
        </Card>
        <Card className="p-4 flex flex-col justify-center items-center bg-emerald-50/50 border-emerald-100">
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">Sick Leave</p>
          <p className="text-3xl font-bold text-slate-800">{leaveBalance.sick}<span className="text-sm font-normal text-slate-500 ml-1">Remaining</span></p>
        </Card>
        <Card className="p-4 flex flex-col justify-center items-center bg-purple-50/50 border-purple-100">
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-2">Casual Leave</p>
          <p className="text-3xl font-bold text-slate-800">{leaveBalance.casual}<span className="text-sm font-normal text-slate-500 ml-1">Remaining</span></p>
        </Card>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Spinner /></div>
        ) : leaves.length === 0 ? (
          <EmptyState
            title="No Leave Requests"
            description="You have not requested any time off recently."
            action={<Button size="sm" onClick={() => setShowApply(true)}>Apply for Leave</Button>}
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Type</Th>
                <Th>Date Range</Th>
                <Th>Duration</Th>
                <Th>Reason</Th>
                <Th>Status</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {leaves.map((l: any) => (
                <Tr key={l.id}>
                  <Td className="font-semibold text-slate-700 capitalize">{(l.leave_type || '').replace('_', ' ')}</Td>
                  <Td className="text-sm">
                    {new Date(l.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {l.from_date !== l.to_date && ` - ${new Date(l.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </Td>
                  <Td className="text-sm font-medium">{l.total_days} {l.total_days === 1 ? 'Day' : 'Days'}</Td>
                  <Td className="text-sm text-slate-500 max-w-[200px] truncate">{l.reason}</Td>
                  <Td>
                    <Badge 
                      label={l.status} 
                      status={l.status === 'approved' ? 'active' : l.status === 'pending' ? 'warning' : 'inactive'} 
                    />
                  </Td>
                  <Td className="text-right">
                    {l.status === 'pending' && isAdmin ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                          onClick={() => { setSelectedLeave(l); setActionType('approved'); setApproverNote(''); setShowAction(true); }}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => { setSelectedLeave(l); setActionType('rejected'); setApproverNote(''); setShowAction(true); }}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    ) : l.status === 'pending' ? (
                      <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 border-red-200">
                        Cancel
                      </Button>
                    ) : null}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Apply Leave Modal */}
      <Modal open={showApply} onClose={() => setShowApply(false)} title="Apply for Leave" size="sm">
        <form onSubmit={handleSubmit(onSubmitLeave)} className="space-y-4">
          <Select 
            label="Leave Type" 
            options={[
              { value: '', label: 'Select...' },
              { value: 'annual', label: 'Annual Leave' },
              { value: 'sick', label: 'Sick Leave' },
              { value: 'casual', label: 'Casual Leave' },
              { value: 'unpaid', label: 'Unpaid Leave' }
            ]}
            {...register('leave_type', { required: 'Required' })} 
            error={errors.leave_type?.message as string}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="From Date" type="date" {...register('from_date', { required: 'Required' })} error={errors.from_date?.message as string} />
            <Input label="To Date" type="date" {...register('to_date', { required: 'Required' })} error={errors.to_date?.message as string} />
          </div>
          <div className="flex items-center gap-2 mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer">
            <input type="checkbox" id="half_day" {...register('is_half_day')} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
            <label htmlFor="half_day" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">This is a Half Day leave</label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Reason</label>
            <textarea 
              {...register('reason', { required: 'Required', minLength: 5 })} 
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[80px]"
              placeholder="Please provide a brief reason for your leave..."
            ></textarea>
            {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message as string}</p>}
          </div>

          <div className="pt-3 flex gap-3 justify-end border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowApply(false)}>Cancel</Button>
            <Button type="submit" loading={applyMutation.isPending}>Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Admin Action Modal */}
      <Modal open={showAction} onClose={() => setShowAction(false)} title={actionType === 'approved' ? 'Approve Leave' : 'Reject Leave'} size="sm">
        <div className="space-y-4">
          <div className={`p-3 rounded-xl border ${actionType === 'approved' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <p className="text-sm font-semibold text-slate-800 mb-1">
              You are about to {actionType} the leave request for {selectedLeave?.total_days} days.
            </p>
            <p className="text-xs text-slate-500">Employee Reason: {selectedLeave?.reason}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Add Note / Comment (Optional)</label>
            <textarea 
              value={approverNote}
              onChange={(e) => setApproverNote(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[80px]"
              placeholder="E.g., Enjoy your vacation! or Too many pending tasks..."
            ></textarea>
          </div>
          <div className="pt-3 flex gap-3 justify-end border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowAction(false)}>Cancel</Button>
            <Button 
              className={actionType === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
              loading={actionMutation.isPending}
              onClick={() => actionMutation.mutate({ id: selectedLeave.id, action: actionType, approver_note: approverNote })}
            >
              Confirm {actionType === 'approved' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
