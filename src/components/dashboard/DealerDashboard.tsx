'use client'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Stat } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import {
  ShoppingCart, TrendingUp, Package, Wrench, AlertTriangle,
  Clock, IndianRupee, MapPin, Building, User, CheckCircle
} from 'lucide-react'

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface DealerData {
  profile: {
    id: number; business_name: string; district: string; state: string; credit_limit: number;
    opening_balance: number; can_order_direct: boolean; bde_name: string; distributor_name: string;
    is_active: boolean; onboarded_date: string;
  }
  mlm: { district_has_distributor: boolean; order_route: string; distributor_name: string }
  stock: { total_vehicles: number; by_product: { product: string; sku: string; count: number }[] }
  sales: { total_sales: number; total_revenue: number; outstanding: number; avg_value: number; total_gst: number; revenue_growth: number; recent: any[] }
  my_purchases: { total_purchases: number; total_expense: number }
  orders: { pending: number; approved: number; dispatched: number; received: number; via_distributor: number; direct_company: number; recent: any[] }
  customers: { total: number }
  service: { scheduled: number; completed: number; cancelled: number; upcoming: any[] }
  gst: { month: string; total_gst: number; net_liability: number; filing_status: string }
  expenses: { total: number }
}

export default function DealerDashboard({ period }: { period: string }) {
  const { data, isLoading } = useQuery<{ success: boolean } & DealerData>({
    queryKey: ['dashboard', 'dealer', period],
    queryFn: () => api.get(`/dashboard?period=${period}`).then(r => r.data),
  })

  if (isLoading || !data) return null
  const d = data

  return (
    <div className="space-y-5 fade-in-up">
      {/* Profile & MLM Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{d.profile?.business_name}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-400"/> {d.profile?.district}, {d.profile?.state}</span>
                <span className="flex items-center gap-1"><User size={14} className="text-slate-400"/> BDE: {d.profile?.bde_name || 'N/A'}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Order Routing</p>
              {d.mlm?.order_route === 'via_distributor' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-sm font-semibold border border-amber-200">
                  <Building size={16} /> Via Distributor ({d.mlm?.distributor_name})
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 text-sm font-semibold border border-blue-200">
                  <CheckCircle size={16} /> Direct from Company
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex flex-col justify-center h-full">
             <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Available Credit Limit</p>
             <p className="text-3xl font-bold text-emerald-600">{formatCurrency(d.profile?.credit_limit || 0)}</p>
             <p className="text-xs text-slate-500 mt-1">Outstanding: <span className="text-red-500 font-semibold">{formatCurrency(d.sales?.outstanding || 0)}</span></p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat label="Vehicles in Stock"
          value={d.stock?.total_vehicles || 0}
          icon={<Package className="h-5 w-5" />} color="orange" />
        <Stat label="Total Sales" value={d.sales?.total_sales || 0}
          sub={`Growth: ${d.sales?.revenue_growth || 0}%`}
          icon={<ShoppingCart className="h-5 w-5" />} color="blue"
          trend={(d.sales?.revenue_growth || 0) >= 0 ? 'up' : 'down'} />
        <Stat label="Revenue" value={formatCurrency(d.sales?.total_revenue || 0)}
          icon={<IndianRupee className="h-5 w-5" />} color="green" trend="up" />
        <Stat label="GST" value={formatCurrency(d.sales?.total_gst || 0)}
          icon={<IndianRupee className="h-5 w-5" />} color="purple" />
        <Stat label="Total Purchases" value={formatCurrency(d.my_purchases?.total_expense || 0)}
          sub={`${d.my_purchases?.total_purchases || 0} transfers`}
          icon={<ShoppingCart className="h-5 w-5" />} color="red" />
        <Stat label="My Expenses" value={formatCurrency(d.expenses?.total || 0)}
          sub="Recorded this period"
          icon={<IndianRupee className="h-5 w-5" />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Sales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle><i className="bi bi-receipt text-blue-500" /> Recent Sales</CardTitle>
          </CardHeader>
          <div>
            {d.sales?.recent?.length > 0 ? (
              <table className="w-full text-sm">
                <thead style={{ background: 'linear-gradient(to right,#f8fafc,#f1f5f9)', borderBottom: '1px solid #f1f5f9' }}>
                  <tr>
                    {['Invoice', 'Customer', 'Product', 'Amount'].map(h => (
                      <th key={h} className={`px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest ${h === 'Amount' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.sales.recent.map(s => (
                    <tr key={s.invoice} className="hover:bg-blue-50 transition-colors" style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td className="px-5 py-3">
                        <span className="text-xs font-mono font-semibold text-blue-600 px-2 py-0.5 rounded-lg bg-blue-50">{s.invoice}</span>
                        <div className="text-[10px] text-slate-400 mt-1">{s.date}</div>
                      </td>
                      <td className="px-5 py-3 text-xs font-medium text-slate-700">
                        {s.customer}
                        <div className="text-[10px] text-slate-400">{s.mobile}</div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        {s.product}
                        <div className="text-[10px] font-mono text-slate-400">{s.chassis}</div>
                      </td>
                      <td className="px-5 py-3 text-xs font-bold text-right text-emerald-600">{formatCurrency(s.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center">
                <i className="bi bi-receipt text-4xl text-slate-200" />
                <p className="text-sm text-slate-400 mt-2">No recent sales</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          {/* Stock by Product */}
          <Card>
            <CardHeader><CardTitle><Package className="h-4 w-4 text-orange-500" /> Stock by Model</CardTitle></CardHeader>
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
               {!d.stock?.by_product?.length && <p className="text-xs text-slate-400 text-center py-3">No stock available</p>}
            </CardContent>
          </Card>

           {/* Orders */}
           <Card>
            <CardHeader><CardTitle><Clock className="h-4 w-4 text-amber-500" /> My Recent Orders</CardTitle></CardHeader>
            <CardContent className="space-y-3">
               {d.orders?.recent?.map((o) => (
                  <div key={o.id} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-500">{o.order_ref}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                        o.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        o.status === 'dispatched' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>{o.status}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">{o.product} × {o.qty}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Routed: {o.order_source === 'via_distributor' ? `Via ${o.distributor}` : 'Direct'}</p>
                  </div>
               ))}
               {!d.orders?.recent?.length && <p className="text-xs text-slate-400 text-center py-3">No recent orders</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
