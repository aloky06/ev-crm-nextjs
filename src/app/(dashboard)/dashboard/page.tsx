'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { LayoutDashboard } from 'lucide-react'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import DealerDashboard from '@/components/dashboard/DealerDashboard'
import DistributorDashboard from '@/components/dashboard/DistributorDashboard'
import BdeDashboard from '@/components/dashboard/BdeDashboard'

const PERIODS = ['today', 'week', 'month', 'year']

export default function DashboardPage() {
  const [period, setPeriod] = useState('month')
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (user?.role === 'customer') {
      router.push('/hrms/dashboard')
    }
  }, [user, router])

  if (!user) return null

  // If customer, we redirect them, so don't render this page.
  if (user.role === 'customer') return null

  return (
    <div className="fade-in-up">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user.name}`}
        icon={<LayoutDashboard className="h-5 w-5" />}
        actions={
          <div className="flex gap-0.5 p-1 rounded-xl border border-slate-200 bg-white shadow-sm">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1.5 text-xs rounded-lg font-semibold capitalize transition-all duration-150"
                style={period === p ? {
                  background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
                } : { color: '#64748b' }}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      {user.role === 'admin' && <AdminDashboard period={period} />}
      {user.role === 'dealer' && <DealerDashboard period={period} />}
      {user.role === 'distributor' && <DistributorDashboard period={period} />}
      {user.role === 'bde' && <BdeDashboard period={period} />}
    </div>
  )
}
