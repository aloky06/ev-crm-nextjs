'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Card } from '@/components/ui/Card'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { Spinner, Badge } from '@/components/ui/Badge'
import { FileText, IndianRupee } from 'lucide-react'

export default function GstReportsPage() {
  const { user } = useAuthStore()

  const getGstEndpoint = () => {
    if (!user) return null
    if (user.role === 'admin') return '/gst/company'
    if (user.role === 'distributor') return `/gst/distributor/${user.id}`
    if (user.role === 'dealer') return `/gst/dealer/${user.id}`
    return '/gst/company'
  }

  const endpoint = getGstEndpoint()

  const { data, isLoading } = useQuery({
    queryKey: ['gst-reports', endpoint],
    queryFn: () => api.get(endpoint as string).then(res => res.data),
    enabled: !!endpoint,
  })

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num || 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">GST Reports</h1>
          <p className="text-slate-500">View your monthly tax liabilities and ITC records</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center space-x-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><IndianRupee size={24} /></div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Taxable Value</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(data?.totals?.taxable_value)}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center space-x-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full"><IndianRupee size={24} /></div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total GST Collected</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(data?.totals?.total_gst)}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center space-x-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-full"><IndianRupee size={24} /></div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total ITC Claimed</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(data?.totals?.itc_total)}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center space-x-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><FileText size={24} /></div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Net Liability</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(data?.totals?.net_gst_liability)}</p>
              </div>
            </Card>
          </div>

          <Card>
            <Table>
              <Thead>
                <Tr>
                  <Th>Period</Th>
                  <Th>Invoices</Th>
                  <Th>Taxable Value</Th>
                  <Th>CGST</Th>
                  <Th>SGST</Th>
                  <Th>Total GST</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data?.summaries?.length === 0 ? (
                  <Tr><Td colSpan={7} className="text-center py-8">No GST records found</Td></Tr>
                ) : (
                  data?.summaries?.map((s: any) => (
                    <Tr key={s.id}>
                      <Td className="font-semibold text-slate-800">{s.year}-{s.month.toString().padStart(2, '0')}</Td>
                      <Td>{s.total_invoices}</Td>
                      <Td>{formatCurrency(s.taxable_value)}</Td>
                      <Td>{formatCurrency(s.cgst_collected)}</Td>
                      <Td>{formatCurrency(s.sgst_collected)}</Td>
                      <Td className="font-semibold">{formatCurrency(s.total_gst)}</Td>
                      <Td>
                        <Badge label={s.filing_status} status={s.filing_status === 'filed' ? 'active' : 'warning'} />
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  )
}
