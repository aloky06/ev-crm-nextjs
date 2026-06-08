'use client'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Stat } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  TrendingUp, IndianRupee, MapPin, User, Users,
  Building2, Store, Network
} from 'lucide-react'

interface BdeData {
  profile: {
    id: number; name: string; employee_code: string; level: number; level_label: string;
    parent_name: string; district: string; joined_date: string; is_active: boolean;
  }
  commissions: { total_earned: number; total_pending: number; total_paid: number; this_period: number; recent: any[] }
  network: { distributors_count: number; dealers_count: number; child_bdes_count: number; child_bdes: any[] }
  network_sales: { total_sales: number; total_revenue: number }
}

export default function BdeDashboard({ period }: { period: string }) {
  const { data, isLoading } = useQuery<{ success: boolean } & BdeData>({
    queryKey: ['dashboard', 'bde', period],
    queryFn: () => api.get(`/dashboard?period=${period}`).then(r => r.data),
  })

  if (isLoading || !data) return null
  const d = data

  return (
    <div className="space-y-5 fade-in-up">
      {/* BDE Profile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">{d.profile?.name}</h2>
                <Badge label={d.profile?.level_label} className="bg-blue-100 text-blue-700" />
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                <span className="flex items-center gap-1 font-mono bg-white/50 px-2 rounded"><User size={14} className="text-slate-400"/> {d.profile?.employee_code}</span>
                <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-400"/> {d.profile?.district}</span>
              </div>
            </div>
            {d.profile?.parent_name && (
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Reports To</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/60 text-slate-700 text-sm font-semibold border border-white">
                  <User size={16} className="text-blue-500" /> {d.profile?.parent_name}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="p-5 flex flex-col justify-center h-full">
             <p className="text-xs text-emerald-600 uppercase font-bold tracking-wider mb-2">Commissions Earned This Period</p>
             <p className="text-3xl font-bold text-emerald-600">{formatCurrency(d.commissions?.this_period || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Unpaid Dues" value={formatCurrency(d.commissions?.total_pending || 0)}
          sub={`Lifetime earned: ${formatCurrency(d.commissions?.total_earned || 0)}`}
          icon={<IndianRupee className="h-5 w-5" />} color="blue" />
        <Stat label="Network Sales (Dealers)" value={d.network_sales?.total_sales || 0}
          sub={`Revenue: ${formatCurrency(d.network_sales?.total_revenue || 0)}`}
          icon={<TrendingUp className="h-5 w-5" />} color="green" trend="up" />
        <Stat label="My Dealers"
          value={d.network?.dealers_count || 0}
          icon={<Store className="h-5 w-5" />} color="orange" />
        <Stat label="My Distributors" value={d.network?.distributors_count || 0}
          icon={<Building2 className="h-5 w-5" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Commissions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle><IndianRupee className="h-4 w-4 text-emerald-500 inline mr-2" /> Recent Commissions Earned</CardTitle>
          </CardHeader>
          <div>
            {d.commissions?.recent?.length > 0 ? (
              <table className="w-full text-sm">
                <thead style={{ background: 'linear-gradient(to right,#f8fafc,#f1f5f9)', borderBottom: '1px solid #f1f5f9' }}>
                  <tr>
                    {['Date', 'Invoice', 'Dealer', 'Amount'].map(h => (
                      <th key={h} className={`px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest ${h === 'Amount' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.commissions.recent.map(c => (
                    <tr key={c.id} className="hover:bg-emerald-50 transition-colors" style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td className="px-5 py-3 text-xs text-slate-500 font-medium">{c.earned_at}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-mono font-semibold text-slate-600 px-2 py-0.5 rounded-lg bg-slate-100">{c.invoice}</span>
                        <div className="text-[10px] text-slate-400 mt-1 capitalize">{c.network_type} sale</div>
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-700">{c.dealer}</td>
                      <td className="px-5 py-3 text-right">
                        <p className="text-xs font-bold text-emerald-600">+{formatCurrency(c.commission_rs)}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${c.payment_status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{c.payment_status}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center">
                <IndianRupee className="mx-auto h-10 w-10 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">No commissions earned yet</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
           {/* Downline BDEs */}
           <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center w-full">
                <span className="flex items-center gap-2"><Network className="h-4 w-4 text-blue-500" /> My BDE Downline</span>
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{d.network?.child_bdes_count || 0}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               {d.network?.child_bdes?.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {b.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{b.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{b.code}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded uppercase">Level {b.level}</span>
                  </div>
               ))}
               {!d.network?.child_bdes?.length && (
                <div className="flex flex-col items-center justify-center py-4 text-slate-400">
                  <Users className="h-6 w-6 mb-1 text-slate-200" />
                  <p className="text-xs">No downline BDEs</p>
                </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
