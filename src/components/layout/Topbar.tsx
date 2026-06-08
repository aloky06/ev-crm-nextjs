'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Bell, ChevronRight, Check, Hand } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'

interface TopbarProps {
  onToggleSidebar: () => void
}

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/customers':    'Customers',
  '/dealers':      'Dealers',
  '/distributors': 'Distributors',
  '/bde-users':    'BDE Users',
  '/products':     'Products',
  '/vehicles':     'Vehicles',
  '/sales':        'Sales',
  '/service':      'Service',
  '/commissions':  'Commissions',
  '/gst':          'GST Reports',
  '/settings':     'Settings',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const label = ROUTE_LABELS[pathname] || 'EV CRM'
  const firstName = user?.name?.split(' ')[0] || 'Admin'

  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const { data: notifData, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30000, // Poll every 30s
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => refetch()
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post(`/notifications/read-all`),
    onSuccess: () => refetch()
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const notifications = notifData?.notifications || []
  const unreadCount = notifData?.unread_count || 0

  return (
    <header className="topbar relative z-50">
      {/* Menu button */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-xl transition-all flex-shrink-0 text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-800"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-xs text-slate-400 hidden sm:block">EV CRM</span>
        <ChevronRight size={12} className="text-slate-300 hidden sm:block flex-shrink-0" />
        <span className="text-sm font-semibold text-slate-800 truncate">{label}</span>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="hidden lg:flex flex-col items-end">
          <p className="text-[11px] text-slate-400 leading-tight">{getGreeting()}</p>
          <p className="text-xs font-semibold text-slate-700 leading-tight flex items-center">{firstName} <Hand className="inline-block w-3.5 h-3.5 ml-1 text-yellow-500" /></p>
        </div>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl transition-all text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-800"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white bg-red-500 shadow-sm shadow-red-500/50">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden fade-in-up">
              <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-slate-50/50">
                <span className="font-semibold text-sm text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={() => markAllReadMutation.mutate()} className="text-[11px] font-medium text-blue-600 hover:text-blue-800">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">No notifications</div>
                ) : (
                  notifications.map((n: any) => (
                    <div key={n.id} className={`p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${n.read_at ? 'opacity-60' : 'bg-blue-50/20'}`}>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{n.data.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.data.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                        {!n.read_at && (
                          <button onClick={() => markReadMutation.mutate(n.id)} className="p-1 text-slate-400 hover:text-emerald-500 flex-shrink-0" title="Mark as read">
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-slate-100 p-2 bg-slate-50 text-center">
                <a href="/notifications" className="text-[11px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider block py-1">
                  View all notifications
                </a>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl cursor-pointer transition-all bg-slate-100 border border-slate-200 hover:bg-slate-200">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 bg-gradient-to-br from-blue-600 to-purple-600">
            {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
          </div>
          <span className="text-xs font-semibold text-slate-700 hidden sm:block max-w-[100px] truncate">
            {user?.name || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  )
}
