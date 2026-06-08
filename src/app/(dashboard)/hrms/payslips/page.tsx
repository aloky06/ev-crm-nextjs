'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { Badge, Spinner, EmptyState } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { FileText, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { SalarySlip } from '@/components/hrms/SalarySlip'
import { useAuthStore } from '@/store/auth'

export default function EmployeePayslipsPage() {
  const { user } = useAuthStore()
  const [showSlip, setShowSlip] = useState(false)
  const [slipData, setSlipData] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['myPayrolls'],
    // Pass employee_id=1 for demo since user might just be 'admin' or 'bde'. In a real app we pass the current employee ID
    queryFn: () => api.get('/hrms/payroll', { params: { employee_id: 1 } }).then(r => r.data)
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

  const payrolls = data?.payrolls?.data || []

  return (
    <div className="fade-in-up pb-10">
      <PageHeader
        title="My Payslips"
        subtitle="View and download your monthly salary slips"
        icon={<FileText className="h-5 w-5" />}
      />

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Spinner /></div>
        ) : payrolls.length === 0 ? (
          <EmptyState
            title="No Payslips Found"
            description="Your salary slips will appear here once payroll is generated."
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Month / Year</Th>
                <Th>Working Days</Th>
                <Th>Gross Earnings</Th>
                <Th>Deductions</Th>
                <Th>Net Salary</Th>
                <Th>Status</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {payrolls.map((p: any) => (
                <Tr key={p.id}>
                  <Td className="font-semibold text-slate-800">
                    {new Date(p.year, p.month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
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
                    <Button variant="outline" size="sm" onClick={() => loadSlip(p.id)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Download className="h-3.5 w-3.5 mr-1.5" /> View Slip
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Slip Modal */}
      {showSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl my-auto fade-in-up mt-20">
            <SalarySlip slipData={slipData} onClose={() => setShowSlip(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
