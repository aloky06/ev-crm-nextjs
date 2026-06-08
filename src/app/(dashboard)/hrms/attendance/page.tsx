'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { Badge, Spinner, Pagination } from '@/components/ui/Badge'
import { Clock, Calendar as CalendarIcon, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { format } from 'date-fns'

export default function AttendancePage() {
  const [page, setPage] = useState(1)
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', page, month],
    queryFn: () => api.get('/hrms/attendance', { params: { page, month } }).then(r => r.data)
  })

  const attendance = data?.attendances?.data || []
  const meta = data?.attendances || {}

  return (
    <div className="fade-in-up pb-10">
      <PageHeader
        title="Attendance Tracking"
        subtitle="View daily attendance logs, work hours, and late marks"
        icon={<Clock className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <input 
              type="month" 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>Export</Button>
          </div>
        }
      />

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Spinner /></div>
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Employee</Th>
                  <Th>Check In</Th>
                  <Th>Check Out</Th>
                  <Th>Work Hours</Th>
                  <Th>Status</Th>
                  <Th>Remarks</Th>
                </Tr>
              </Thead>
              <Tbody>
                {attendance.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} className="text-center py-8 text-slate-500">No attendance records found for this period</Td>
                  </Tr>
                ) : (
                  attendance.map((log: any) => (
                    <Tr key={log.id}>
                      <Td className="font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <CalendarIcon size={14} className="text-slate-400" />
                          {log.attendance_date}
                        </div>
                      </Td>
                      <Td>
                        {log.employee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                              {log.employee.first_name[0]}
                            </div>
                            <span className="font-medium text-slate-800">{log.employee.first_name} {log.employee.last_name}</span>
                          </div>
                        ) : '—'}
                      </Td>
                      <Td className="font-mono text-sm">{log.check_in ? log.check_in.substring(11, 16) : '—'}</Td>
                      <Td className="font-mono text-sm">{log.check_out ? log.check_out.substring(11, 16) : '—'}</Td>
                      <Td>
                        {log.work_hours ? (
                          <span className="font-medium text-slate-800">{log.work_hours} hrs</span>
                        ) : '—'}
                      </Td>
                      <Td>
                        <Badge 
                          label={log.status} 
                          status={log.status === 'present' ? 'active' : log.status === 'half_day' ? 'warning' : 'inactive'} 
                        />
                        {log.is_late && <Badge label={`Late by ${log.late_minutes}m`} status="warning" className="ml-2" />}
                      </Td>
                      <Td className="text-slate-500 text-sm max-w-[200px] truncate" title={log.remarks}>
                        {log.remarks || '—'}
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
            <Pagination current={meta.current_page || 1} last={meta.last_page || 1} onChange={setPage} />
          </>
        )}
      </Card>
    </div>
  )
}
