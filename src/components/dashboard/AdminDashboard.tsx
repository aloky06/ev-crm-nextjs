'use client'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Stat } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import {
  ShoppingCart, TrendingUp, Package, Wrench, AlertTriangle,
  Clock, IndianRupee, Building2, Store, Users, UserCheck,
} from 'lucide-react'

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface AdminData {
  sales: { total_sales: number; total_revenue: number; revenue_growth_pct: number; total_gst_collected: number; total_outstanding: number; by_payment_mode: { payment_mode: string; total: number }[] }
  company_sales: { total_sales: number; total_revenue: number; total_taxable: number; total_gst: number; revenue_growth: number }
  inventory: { at_company: number; at_distributor: number; at_dealer: number; sold: number; returned: number; low_stock_count: number; low_stock_items: { id: number; name: string; stock_quantity: number; min_stock_alert: number }[] }
  orders: { pending: number; approved: number; dispatched: number; pending_orders: { id: number; dealer: { business_name: string }; product: { name: string }; quantity_requested: number }[] }
  commissions: { total_earned: number; total_pending: number; total_paid: number; bdes_with_dues: number }
  service: { scheduled: number; completed: number; upcoming_this_week: { id: number; entitlement: { customer: { name: string } }; service_date: string }[] }
  gst: { month: string; total_gst: number; cgst: number; sgst: number; filing_status: string }
  top_dealers: { id: number; business_name: string; total_sales: number; total_revenue: number }[]
  recent_sales: { invoice_number: string; customer: string; dealer: string; amount: number; date: string }[]
  network: { total_distributors: number; active_distributors: number; total_dealers: number; active_dealers: number; total_bdes: number; active_bdes: number; total_customers: number }
  expenses: { total: number }
}

export default function AdminDashboard({ period }: { period: string }) {
  const { data, isLoading } = useQuery<{ success: boolean } & AdminData>({
    queryKey: ['dashboard', 'admin', period],
    queryFn: () => api.get(`/dashboard?period=${period}`).then(r => r.data),
  })

  if (isLoading || !data) return null
  const d = data
  const paymentModeData = d.sales?.by_payment_mode?.map(m => ({
    name: m.payment_mode.toUpperCase(), value: parseFloat(String(m.total))
  })) || []

  return (
    <div className="space-y-5 fade-in-up">
      {/* Network Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Distributors', value: d.network?.active_distributors, sub: `${d.network?.total_distributors} total`, icon: <Building2 size={16}/>, color: '#8b5cf6' },
          { label: 'Dealers', value: d.network?.active_dealers, sub: `${d.network?.total_dealers} total`, icon: <Store size={16}/>, color: '#10b981' },
          { label: 'BDE Field Team', value: d.network?.active_bdes, sub: `${d.network?.total_bdes} total`, icon: <UserCheck size={16}/>, color: '#2563eb' },
          { label: 'Customers', value: d.network?.total_customers, icon: <Users size={16}/>, color: '#f59e0b' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${item.color}18`, color: item.color }}>
              {item.icon}
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: '#0f172a' }}>{item.value ?? 0}</p>
              <p className="text-[11px] font-semibold" style={{ color: '#64748b' }}>{item.label}</p>
              {item.sub && <p className="text-[10px]" style={{ color: '#94a3b8' }}>{item.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat label="Company Sales (B2B)" value={d.company_sales?.total_sales || 0}
          sub={`Growth: ${d.company_sales?.revenue_growth || 0}%`}
          icon={<ShoppingCart className="h-5 w-5" />} color="blue"
          trend={(d.company_sales?.revenue_growth || 0) >= 0 ? 'up' : 'down'} />
        <Stat label="Company Revenue" value={formatCurrency(d.company_sales?.total_revenue || 0)}
          sub={`GST: ${formatCurrency(d.company_sales?.total_gst || 0)}`}
          icon={<IndianRupee className="h-5 w-5" />} color="green" trend="up" />
        <Stat label="Company Expenses" value={formatCurrency(d.expenses?.total || 0)}
          sub="Recorded this period"
          icon={<IndianRupee className="h-5 w-5" />} color="red" />
        <Stat label="Network Retail Sales" value={d.sales?.total_sales || 0}
          sub={`Revenue: ${formatCurrency(d.sales?.total_revenue || 0)}`}
          icon={<ShoppingCart className="h-5 w-5" />} color="purple" />
        <Stat label="Vehicles in Stock"
          value={(d.inventory?.at_dealer || 0) + (d.inventory?.at_company || 0)}
          sub={`${d.inventory?.sold || 0} sold total`}
          icon={<Package className="h-5 w-5" />} color="orange" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle><i className="bi bi-pie-chart-fill text-blue-500" /> Revenue by Payment Mode</CardTitle>
            <Badge label={`${paymentModeData.length} modes`} />
          </CardHeader>
          <CardContent>
            {paymentModeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={paymentModeData} cx="50%" cy="50%" outerRadius={90} innerRadius={52}
                    paddingAngle={3} dataKey="value" nameKey="name">
                    {paymentModeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Amount']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex flex-col items-center justify-center gap-2">
                <i className="bi bi-bar-chart text-4xl text-slate-200" />
                <p className="text-sm text-slate-400">No sales data for this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center w-full">
              <span className="flex items-center gap-2"><i className="bi bi-boxes text-orange-500" /> Inventory Flow</span>
              <a href="/vehicles" className="text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
                Transfer Stock
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'At Company',     val: d.inventory?.at_company,    color: '#2563eb' },
              { label: 'At Distributor', val: d.inventory?.at_distributor, color: '#8b5cf6' },
              { label: 'At Dealer',      val: d.inventory?.at_dealer,      color: '#f59e0b' },
              { label: 'Sold',           val: d.inventory?.sold,           color: '#10b981' },
              { label: 'Returned',       val: d.inventory?.returned,       color: '#ef4444' },
            ].map(item => {
              const total = (d.inventory?.at_company || 0) + (d.inventory?.at_distributor || 0) +
                (d.inventory?.at_dealer || 0) + (d.inventory?.sold || 0) + (d.inventory?.returned || 0)
              const pct = total > 0 ? Math.round(((item.val || 0) / total) * 100) : 0
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{item.val || 0}</span>
                      <span className="text-[10px] text-slate-400">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Sales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle><i className="bi bi-receipt text-blue-500" /> Recent Sales</CardTitle>
            {d.recent_sales?.length > 0 && <Badge label={`${d.recent_sales.length} records`} />}
          </CardHeader>
          <div>
            {d.recent_sales?.length > 0 ? (
              <table className="w-full text-sm">
                <thead style={{ background: 'linear-gradient(to right,#f8fafc,#f1f5f9)', borderBottom: '1px solid #f1f5f9' }}>
                  <tr>
                    {['Invoice', 'Customer', 'Dealer', 'Amount'].map(h => (
                      <th key={h} className={`px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest ${h === 'Amount' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.recent_sales.map(s => (
                    <tr key={s.invoice_number} className="hover:bg-blue-50 transition-colors" style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td className="px-5 py-3">
                        <span className="text-xs font-mono font-semibold text-blue-600 px-2 py-0.5 rounded-lg bg-blue-50">{s.invoice_number}</span>
                      </td>
                      <td className="px-5 py-3 text-xs font-medium text-slate-700">{s.customer}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{s.dealer}</td>
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
          {/* Pending Orders */}
          <Card>
            <CardHeader>
              <CardTitle><Clock className="h-4 w-4 text-amber-500" /> Pending Orders</CardTitle>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{d.orders?.pending || 0}</span>
            </CardHeader>
            <CardContent className="space-y-2">
              {d.orders?.pending_orders?.slice(0, 4).map(o => (
                <div key={o.id} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-amber-50">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-50">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{o.dealer?.business_name}</p>
                    <p className="text-[11px] text-slate-400">{o.product?.name} × {o.quantity_requested}</p>
                  </div>
                </div>
              ))}
              {!d.orders?.pending_orders?.length && (
                <p className="text-xs text-slate-400 text-center py-3">No pending orders</p>
              )}
            </CardContent>
          </Card>

          {/* Top Dealers */}
          <Card>
            <CardHeader><CardTitle><i className="bi bi-trophy text-amber-500" /> Top Dealers</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {d.top_dealers?.map((dealer, i) => (
                <div key={dealer.id} className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-[10px] font-bold text-slate-500">{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{dealer.business_name}</p>
                    <p className="text-[11px] text-slate-400">{dealer.total_sales} sales</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">{formatCurrency(dealer.total_revenue)}</span>
                </div>
              ))}
              {!d.top_dealers?.length && <p className="text-xs text-slate-400 text-center py-3">No data yet</p>}
            </CardContent>
          </Card>

          {/* Low stock */}
          {d.inventory?.low_stock_count > 0 && (
            <Card style={{ border: '1px solid #fde68a' }}>
              <CardHeader>
                <CardTitle className="text-amber-600"><AlertTriangle className="h-4 w-4" /> Low Stock Alert</CardTitle>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{d.inventory.low_stock_count}</span>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {d.inventory.low_stock_items.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-amber-50">
                    <span className="text-slate-700 truncate flex-1">{p.name}</span>
                    <span className="font-bold text-red-600 ml-2 px-2 py-0.5 rounded-md bg-red-50">{p.stock_quantity}/{p.min_stock_alert}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Service */}
          <Card>
            <CardHeader>
              <CardTitle><Wrench className="h-4 w-4 text-blue-500" /> Services This Week</CardTitle>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{d.service?.upcoming_this_week?.length || 0}</span>
            </CardHeader>
            <CardContent className="space-y-2">
              {d.service?.upcoming_this_week?.slice(0, 4).map(b => (
                <div key={b.id} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-blue-50">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50">
                    <Wrench className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{b.entitlement?.customer?.name}</p>
                    <p className="text-[11px] text-slate-400">{b.service_date}</p>
                  </div>
                </div>
              ))}
              {!d.service?.upcoming_this_week?.length && (
                <p className="text-xs text-slate-400 text-center py-3">No upcoming services</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
