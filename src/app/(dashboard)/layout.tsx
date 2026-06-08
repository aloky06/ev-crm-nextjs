'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { usePermissionStore } from '@/store/permissionStore'
import { Sidebar, MobileSidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { ChatWidget } from '@/components/chat/ChatWidget'
import { Spinner } from '@/components/ui/Badge'
import { Zap } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated, user, token } = useAuthStore()
  const { fetchRolePermissions, isLoaded } = usePermissionStore()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)

  useEffect(() => {
    if (_hasHydrated && !token) {
      router.replace('/auth/login')
    }
  }, [_hasHydrated, token, router])

  // When page is refreshed, auth is rehydrated from localStorage but
  // permission store is in-memory only — re-fetch permissions for non-admin.
  useEffect(() => {
    if (_hasHydrated && isAuthenticated() && user && user.role !== 'admin' && !isLoaded) {
      fetchRolePermissions(user.role)
    }
  }, [_hasHydrated, isAuthenticated, user, isLoaded, fetchRolePermissions])

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#f0f4f8,#e8edf5)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#2563eb,#10b981)', boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}>
            <Zap className="h-6 w-6 text-white" />
          </div>
          <Spinner className="h-6 w-6" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#f0f4f8,#e8edf5)' }}>
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f0f4f8' }}>
      <Sidebar isCollapsed={desktopCollapsed} />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onToggleSidebar={() => {
          if (window.innerWidth < 768) setMobileOpen(true)
          else setDesktopCollapsed(!desktopCollapsed)
        }} />
        <main className="flex-1 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
          <div className="p-4 sm:p-6 lg:p-7 max-w-screen-2xl mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
      <ChatWidget />
    </div>
  )
}
