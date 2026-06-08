'use client'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Stat } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  ShoppingCart, Package, Clock, IndianRupee, MapPin, User,
  Store, Users, AlertCircle
, CheckCircle } from 'lucide-react'

interface DistributorData {
  profile: {
    id: number; business_name: string; district: string; state: string; credit_limit: number;
    opening_balance: number; bde_name: string; is_active: boolean;
  }
  dealers: { total: number; active: number; inactive: number; list: any[]; top: any[] }
  stock: { total_vehicles: number; by_product: { product: string; sku: string; count: number }[] }
  sales: { total_sales: number; total_revenue: number; outstanding: number; revenue_growth: number }
  my_sales: { total_sales: number; total_revenue: number; total_gst: number; revenue_growth: number }
  my_purchases: { total_purchases: number; total_expense: number }
  orders: { pending: number; approved: number; dispatched: number; received: number; pending_list: any[] }
  gst: { month: string; total_gst: number; net_liability: number; filing_status: string }
  service: { upcoming_count: number; upcoming: any[] }
  expenses: { total: number }
}

export default function DistributorDashboard({ period }: { period: string }) {
  const { data, isLoading } = useQuery<{ success: boolean } & DistributorData>({
    queryKey: ['dashboard', 'distributor', period],
    queryFn: () => api.get(`/dashboard?period=${period}`).then(r => r.data),
  })

  if (isLoading || !data) return null
  const d = data

  return (
    <div className="space-y-5 fade-in-up">
      {/* Profile Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-100">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">{d.profile?.business_name}</h2>
                <Badge label="Distributor" className="bg-violet-100 text-violet-700" />
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-400"/> {d.profile?.district}, {d.profile?.state}</span>
                <span className="flex items-center gap-1"><User size={14} className="text-slate-400"/> BDE: {d.profile?.bde_name || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex flex-col justify-center h-full">
             <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Available Credit Limit</p>
             <p className="text-3xl font-bold text-emerald-600">{formatCurrency(d.profile?.credit_limit || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat label="Vehicles in Stock"
          value={d.stock?.total_vehicles || 0}
          icon={<Package className="h-5 w-5" />} color="orange" />
        <Stat label="Total Sales (To Dealers)" value={d.my_sales?.total_sales || 0}
          sub={`Growth: ${d.my_sales?.revenue_growth || 0}%`}
          icon={<ShoppingCart className="h-5 w-5" />} color="blue"
          trend={(d.my_sales?.revenue_growth || 0) >= 0 ? 'up' : 'down'} />
        <Stat label="Revenue (From Dealers)" value={formatCurrency(d.my_sales?.total_revenue || 0)}
          icon={<IndianRupee className="h-5 w-5" />} color="green" trend="up" />
        <Stat label="GST Collected" value={formatCurrency(d.my_sales?.total_gst || 0)}
          icon={<IndianRupee className="h-5 w-5" />} color="purple" />
        <Stat label="Total Purchases" value={formatCurrency(d.my_purchases?.total_expense || 0)}
          sub={`${d.my_purchases?.total_purchases || 0} transfers`}
          icon={<ShoppingCart className="h-5 w-5" />} color="red" />
        <Stat label="My Expenses" value={formatCurrency(d.expenses?.total || 0)}
          sub="Recorded this period"
          icon={<IndianRupee className="h-5 w-5" />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Dealers */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle><i className="bi bi-trophy text-amber-500" /> Top Dealers in My Network</CardTitle>
          </CardHeader>
          <div>
            {d.dealers?.top?.length > 0 ? (
              <table className="w-full text-sm">
                <thead style={{ background: 'linear-gradient(to right,#f8fafc,#f1f5f9)', borderBottom: '1px solid #f1f5f9' }}>
                  <tr>
                    {['Rank', 'Dealer Name', 'Total Sales', 'Revenue Generated'].map(h => (
                      <th key={h} className={`px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest ${h === 'Revenue Generated' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.dealers.top.map((dealer, i) => (
                    <tr key={dealer.id} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td className="px-5 py-3 text-center w-16">
                        <span className="text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-xs font-bold text-slate-400">{i + 1}</span>}</span>
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-700">{dealer.business_name}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{dealer.total_sales} vehicles</td>
                      <td className="px-5 py-3 text-xs font-bold text-right text-emerald-600">{formatCurrency(dealer.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center">
                <Store className="mx-auto h-10 w-10 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">No dealer sales in this period</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
           {/* Dealer Supply Requests */}
           <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center w-full">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Pending Supply Requests</span>
                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{d.orders?.pending || 0}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               {d.orders?.pending_list?.map((o) => (
                  <div key={o.id} className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-[10px] font-mono font-bold text-amber-600 mb-1">{o.order_ref}</p>
                    <p className="text-xs font-semibold text-slate-700">{o.dealer}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{o.product} × <span className="font-bold text-slate-700">{o.qty}</span> units</p>
                  </div>
               ))}
               {!d.orders?.pending_list?.length && (
                <div className="flex flex-col items-center justify-center py-4 text-slate-400">
                  <CheckCircle className="h-6 w-6 mb-1 text-emerald-400" />
                  <p className="text-xs">All caught up!</p>
                </div>
               )}
            </CardContent>
          </Card>

          {/* Stock by Product */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center w-full">
                <span className="flex items-center gap-2"><Package className="h-4 w-4 text-orange-500" /> Warehouse Stock</span>
                <a href="/vehicles" className="text-xs font-semibold bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
                  Transfer Stock
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               {d.stock?.by_product?.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{p.product}</p>
                      <p className="text-[10px] font-mono text-slate-400">{p.sku}</p>
                    </div>
                    <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">{p.count}</span>
                  </div>
               ))}
               {!d.stock?.by_product?.length && <p className="text-xs text-slate-400 text-center py-3">Warehouse empty</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
