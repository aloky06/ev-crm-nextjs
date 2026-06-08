import React, { useRef } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Printer, Download } from 'lucide-react'

interface SalarySlipProps {
  slipData: any
  onClose?: () => void
}

export function SalarySlip({ slipData, onClose }: SalarySlipProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!slipData) return null

  const handlePrint = () => {
    // A simple approach is to use window.print()
    const content = printRef.current?.innerHTML
    if (content) {
      const originalBody = document.body.innerHTML
      document.body.innerHTML = content
      window.print()
      document.body.innerHTML = originalBody
      window.location.reload()
    }
  }

  const { employee, attendance, earnings, deductions, employer_contributions } = slipData

  return (
    <div className="bg-slate-50 min-h-[500px] p-4 flex flex-col items-center">
      {/* Controls */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">Salary Slip Preview</h2>
        <div className="flex gap-2">
          {onClose && (
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
              Close
            </button>
          )}
          <button onClick={handlePrint} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center gap-2">
            <Printer size={16} /> Print / Download PDF
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div 
        ref={printRef} 
        className="w-full max-w-4xl bg-white p-10 border border-slate-200 shadow-sm"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        <div className="border-b-2 border-slate-800 pb-6 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">EV CRM TECHNOLOGIES</h1>
            <p className="text-sm text-slate-600 mt-1">123 Tech Park, Innovation Hub, New Delhi, India 110001</p>
            <p className="text-sm text-slate-600">Email: payroll@evcrm.test | Phone: +91 98765 43210</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-blue-600">PAYSLIP</h2>
            <p className="text-sm font-semibold text-slate-700 mt-1">For the month of {slipData.month_label}</p>
            <p className="text-xs text-slate-500 mt-1">Ref: {slipData.payroll_reference}</p>
          </div>
        </div>

        {/* Employee Details & Attendance */}
        <div className="flex gap-8 mb-8">
          <div className="flex-1 space-y-2 text-sm">
            <div className="flex"><span className="w-32 text-slate-500 font-medium">Employee Name</span><span className="font-semibold text-slate-800">: {employee.name}</span></div>
            <div className="flex"><span className="w-32 text-slate-500 font-medium">Employee Code</span><span className="font-semibold text-slate-800">: {employee.code}</span></div>
            <div className="flex"><span className="w-32 text-slate-500 font-medium">Designation</span><span className="font-semibold text-slate-800">: {employee.designation || 'N/A'}</span></div>
            <div className="flex"><span className="w-32 text-slate-500 font-medium">Department</span><span className="font-semibold text-slate-800">: {employee.department || 'N/A'}</span></div>
          </div>
          <div className="flex-1 space-y-2 text-sm">
            <div className="flex"><span className="w-32 text-slate-500 font-medium">PAN</span><span className="font-semibold text-slate-800">: {employee.pan || 'N/A'}</span></div>
            <div className="flex"><span className="w-32 text-slate-500 font-medium">Bank A/C</span><span className="font-semibold text-slate-800">: {employee.bank || 'N/A'}</span></div>
            <div className="flex"><span className="w-32 text-slate-500 font-medium">Total Working Days</span><span className="font-semibold text-slate-800">: {attendance.working_days}</span></div>
            <div className="flex"><span className="w-32 text-slate-500 font-medium">Loss of Pay Days</span><span className="font-semibold text-slate-800">: {attendance.absent_days}</span></div>
          </div>
        </div>

        {/* Earnings & Deductions Table */}
        <div className="flex border border-slate-300 rounded-sm overflow-hidden mb-6">
          {/* Earnings */}
          <div className="flex-1 border-r border-slate-300">
            <div className="bg-slate-100 py-2 px-4 border-b border-slate-300 font-bold text-slate-800 text-sm uppercase tracking-wider flex justify-between">
              <span>Earnings</span>
              <span>Amount (Rs)</span>
            </div>
            <div className="p-4 space-y-3 text-sm">
              {Object.entries(earnings).map(([key, value]: any) => {
                if (key === 'Gross Earnings' || Number(value) === 0) return null;
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-600">{key}</span>
                    <span className="font-medium text-slate-800">{Number(value).toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
            <div className="bg-slate-50 py-3 px-4 border-t border-slate-300 font-bold flex justify-between text-sm">
              <span className="text-slate-800">Gross Earnings (A)</span>
              <span className="text-slate-900">{Number(earnings['Gross Earnings']).toFixed(2)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="flex-1">
            <div className="bg-slate-100 py-2 px-4 border-b border-slate-300 font-bold text-slate-800 text-sm uppercase tracking-wider flex justify-between">
              <span>Deductions</span>
              <span>Amount (Rs)</span>
            </div>
            <div className="p-4 space-y-3 text-sm">
              {Object.entries(deductions).map(([key, value]: any) => {
                if (key === 'Total Deductions' || Number(value) === 0) return null;
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-600">{key}</span>
                    <span className="font-medium text-slate-800">{Number(value).toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
            <div className="bg-slate-50 py-3 px-4 border-t border-slate-300 font-bold flex justify-between text-sm">
              <span className="text-slate-800">Total Deductions (B)</span>
              <span className="text-slate-900">{Number(deductions['Total Deductions']).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Net Salary */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4 flex justify-between items-center mb-8">
          <div>
            <p className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Net Salary Payable (A - B)</p>
            <p className="text-xs text-emerald-600 mt-0.5 font-medium">Amount transferred to bank account</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-emerald-700">₹ {Number(slipData.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Payment Status & Signatures */}
        <div className="flex justify-between items-end mt-12 pt-8 border-t border-slate-200">
          <div className="text-sm">
            <p className="text-slate-500 mb-1">Payment Status: <span className="font-bold text-slate-800 uppercase">{slipData.payment_status}</span></p>
            {slipData.payment_date && (
              <p className="text-slate-500 mb-1">Payment Date: <span className="font-semibold text-slate-800">{slipData.payment_date}</span></p>
            )}
            {slipData.payment_mode && (
              <p className="text-slate-500">Mode: <span className="font-semibold text-slate-800 capitalize">{slipData.payment_mode.replace('_', ' ')}</span></p>
            )}
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-slate-400 mb-2"></div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Authorized Signatory</p>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-8">This is a computer generated document and does not require a physical signature.</p>
      </div>
    </div>
  )
}
