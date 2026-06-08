'use client'

import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { Badge, Spinner, EmptyState, Input, Select } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { BadgeIndianRupee, Download, CheckCircle, FileText, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { SalarySlip } from '@/components/hrms/SalarySlip'

export default function AdminPayrollPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  
  const [showGenerate, setShowGenerate] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [showSlip, setShowSlip] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null)
  const [slipData, setSlipData] = useState<any>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payrolls', year, month],
    queryFn: () => api.get('/hrms/payroll', { params: { year, month } }).then(r => r.data)
  })

  const generateMutation = useMutation({
    mutationFn: (d: any) => api.post('/hrms/payroll/generate', d),
    onSuccess: (res) => {
      toast.success(res.data?.message || "Payroll generated successfully!")
      setShowGenerate(false)
      refetch()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error generating payroll.")
  })

  const markPaidMutation = useMutation({
    mutationFn: (d: any) => api.patch(`/hrms/payroll/${d.id}/mark-paid`, d),
    onSuccess: () => {
      toast.success("Marked as paid!")
      setShowPay(false)
      refetch()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error marking as paid.")
  })

  const loadSlip = async (id: number) => {
    try {
      const res = await api.get(`/hrms/payroll/${id}/slip`)
      setSlipData(res.data.slip)
      setShowSlip(true)
    } catch (err: any) {
      toast.error("Error loading salary slip.")
    }
  }

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    generateMutation.mutate({
      year: formData.get('year'),
      month: formData.get('month'),
      entity_type: 'company' // For demo, assuming we generate for all company employees
    })
  }

  const handleMarkPaid = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    markPaidMutation.mutate({
      id: selectedPayroll.id,
      payment_date: formData.get('payment_date'),
      payment_mode: formData.get('payment_mode'),
      bonus: formData.get('bonus') || 0,
      advance_deduction: formData.get('advance_deduction') || 0,
    })
  }

  const payrolls = data?.payrolls?.data || []
  const totals = data?.totals

  return (
    <div className="fade-in-up pb-10">
      <PageHeader
        title="Payroll Management"
        subtitle="Generate payroll, mark payments, and view salary slips"
        icon={<BadgeIndianRupee className="h-5 w-5" />}
        actions={
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowGenerate(true)}>
            Generate Payroll
          </Button>
        }
      />

      {/* Month/Year Filter & Totals */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <Card className="p-4 flex-shrink-0 flex items-end gap-3">
          <Input label="Year" type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-24" />
          <Select label="Month" value={month} onChange={e => setMonth(Number(e.target.value))} className="w-32" options={[
            {value:'1',label:'Jan'}, {value:'2',label:'Feb'}, {value:'3',label:'Mar'}, {value:'4',label:'Apr'},
            {value:'5',label:'May'}, {value:'6',label:'Jun'}, {value:'7',label:'Jul'}, {value:'8',label:'Aug'},
            {value:'9',label:'Sep'}, {value:'10',label:'Oct'}, {value:'11',label:'Nov'}, {value:'12',label:'Dec'}
          ]} />
        </Card>
        
        {totals && (
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-blue-50/50 border-blue-100 flex flex-col justify-center">
              <p className="text-xs font-semibold text-blue-600 uppercase">Total Net Salary</p>
              <p className="text-xl font-bold text-slate-800">₹ {Number(totals.total_net).toLocaleString('en-IN')}</p>
            </Card>
            <Card className="p-4 bg-purple-50/50 border-purple-100 flex flex-col justify-center">
              <p className="text-xs font-semibold text-purple-600 uppercase">Deductions</p>
              <p className="text-xl font-bold text-slate-800">₹ {Number(totals.total_deductions).toLocaleString('en-IN')}</p>
            </Card>
            <Card className="p-4 bg-emerald-50/50 border-emerald-100 flex flex-col justify-center">
              <p className="text-xs font-semibold text-emerald-600 uppercase">Paid Count</p>
              <p className="text-xl font-bold text-slate-800">{totals.paid_count}</p>
            </Card>
            <Card className="p-4 bg-amber-50/50 border-amber-100 flex flex-col justify-center">
              <p className="text-xs font-semibold text-amber-600 uppercase">Pending Count</p>
              <p className="text-xl font-bold text-slate-800">{totals.pending_count}</p>
            </Card>
          </div>
        )}
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Spinner /></div>
        ) : payrolls.length === 0 ? (
          <EmptyState
            title="No Payroll Data"
            description={`No payroll generated for month ${month}/${year}.`}
            action={<Button size="sm" onClick={() => setShowGenerate(true)}>Generate Now</Button>}
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Employee</Th>
                <Th>Working Days</Th>
                <Th>Gross</Th>
                <Th>Deductions</Th>
                <Th>Net Pay</Th>
                <Th>Status</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {payrolls.map((p: any) => (
                <Tr key={p.id}>
                  <Td>
                    <p className="font-semibold text-slate-800">{p.employee?.first_name} {p.employee?.last_name}</p>
                    <p className="text-xs text-slate-500">{p.employee?.employee_code}</p>
                  </Td>
                  <Td>{p.working_days} Days</Td>
                  <Td>₹ {p.gross_earnings}</Td>
                  <Td className="text-red-500">₹ {p.total_deductions}</Td>
                  <Td className="font-bold text-emerald-600">₹ {p.net_salary}</Td>
                  <Td>
                    <Badge 
                      label={p.payment_status} 
                      status={p.payment_status === 'paid' ? 'active' : 'warning'} 
                    />
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => loadSlip(p.id)} title="View Slip">
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      {p.payment_status === 'pending' && (
                        <Button 
                          variant="outline" size="sm" 
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                          onClick={() => { setSelectedPayroll(p); setShowPay(true) }}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Pay
                        </Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Generate Payroll Modal */}
      <Modal open={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Payroll" size="sm">
        <form onSubmit={handleGenerate} className="space-y-4">
          <Input label="Year" name="year" type="number" defaultValue={year} required />
          <Select label="Month" name="month" defaultValue={month} required options={[
            {value:'1',label:'Jan'}, {value:'2',label:'Feb'}, {value:'3',label:'Mar'}, {value:'4',label:'Apr'},
            {value:'5',label:'May'}, {value:'6',label:'Jun'}, {value:'7',label:'Jul'}, {value:'8',label:'Aug'},
            {value:'9',label:'Sep'}, {value:'10',label:'Oct'}, {value:'11',label:'Nov'}, {value:'12',label:'Dec'}
          ]} />
          <p className="text-xs text-slate-500">This will calculate salaries, PF, ESI, deductions, and generate payslips for all eligible employees based on their attendance.</p>
          <div className="pt-3 flex justify-end">
            <Button type="submit" loading={generateMutation.isPending}>Generate Now</Button>
          </div>
        </form>
      </Modal>

      {/* Mark Paid Modal */}
      <Modal open={showPay} onClose={() => setShowPay(false)} title="Mark Salary as Paid" size="sm">
        {selectedPayroll && (
          <form onSubmit={handleMarkPaid} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2 text-sm">
              <p>Employee: <span className="font-semibold">{selectedPayroll.employee?.first_name} {selectedPayroll.employee?.last_name}</span></p>
              <p>Current Net: <span className="font-bold text-emerald-600">₹ {selectedPayroll.net_salary}</span></p>
            </div>
            
            <Input label="Payment Date" name="payment_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            <Select label="Payment Mode" name="payment_mode" required options={[
              {value: 'bank_transfer', label: 'Bank Transfer'},
              {value: 'cash', label: 'Cash'},
              {value: 'cheque', label: 'Cheque'}
            ]} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Bonus (₹)" name="bonus" type="number" defaultValue="0" />
              <Input label="Advance Deduct (₹)" name="advance_deduction" type="number" defaultValue="0" />
            </div>

            <div className="pt-3 flex justify-end">
              <Button type="submit" loading={markPaidMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Confirm Payment
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Slip Modal */}
      {showSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl my-auto fade-in-up">
            <SalarySlip slipData={slipData} onClose={() => setShowSlip(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
