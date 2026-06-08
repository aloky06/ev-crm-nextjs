'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { usePermissionStore } from '@/store/permissionStore'

import {
  CarFront, LayoutDashboard, Users, Building2, Store, UserCheck,
  Package, ShoppingCart, ClipboardList, Wrench,
  TrendingUp, FileText, Settings, LogOut, Zap, MapPin,
  BadgeIndianRupee, ChevronDown, X, Key, Briefcase, Truck,
  Clock, Calendar, Bell, IndianRupee, Database, Palette, Sliders,
  ChevronLeft, ChevronRight, Menu
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

// ─── Nav Item Type ────────────────────────────────────────────────────────────
interface NavItem {
  label: string
  href?: string
  icon: React.ReactNode
  children?: NavItem[]
  badge?: string
  color?: string
  // If true, only shown to admin
  adminOnly?: boolean
  // If set, at least ONE of these permissions must be present for non-admin
  permissions?: string[]
  // If set, hide from these roles
  excludeRoles?: string[]
}

// ─── Nav Definition ───────────────────────────────────────────────────────────
// Permission slugs must match exactly what is in the `permissions.name` column
const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={16} />,
    color: '#2563eb',
    // Dashboard is always visible to any authenticated user
  },
  {
    label: 'People',
    icon: <Users size={16} />,
    color: '#8b5cf6',
    children: [
      {
        label: 'BDE Users',
        href: '/bde-users',
        icon: <UserCheck size={15} />,
        adminOnly: true,            // Only admin manages BDE accounts
      },
      {
        label: 'Distributors',
        href: '/distributors',
        icon: <Building2 size={15} />,
        permissions: ['view_distributors'],
      },
      {
        label: 'Dealers',
        href: '/dealers',
        icon: <Store size={15} />,
        permissions: ['view_dealers'],
      },
      {
        label: 'Customers',
        href: '/customers',
        icon: <Users size={15} />,
        permissions: ['view_customers'],
      },
    ],
  },
  {
    label: 'Inventory',
    icon: <Package size={16} />,
    color: '#10b981',
    children: [
      {
        label: 'Products',
        href: '/products',
        icon: <Package size={15} />,
        permissions: ['view_products'],
      },
      {
          label: 'Vehicles',
          href: '/vehicles',
          icon: <CarFront size={15} />,
          permissions: ['view_vehicles'],
        },
        {
          label: 'Batteries',
          href: '/batteries',
          icon: <Zap size={15} />,
          permissions: ['view_batteries'],
        },
        {
          label: 'Chargers',
          href: '/chargers',
          icon: <Zap size={15} />,
          permissions: ['view_chargers'],
        },
        {
          label: 'Spare Parts',
          href: '/spare-parts',
          icon: <Wrench size={15} />,
          permissions: ['view_spare_parts'],
        },
      {
        label: 'Stock Transfers',
        href: '/stock-transfers',
        icon: <Truck size={15} />,
        permissions: ['view_stock_transfers'],
      },
    ],
  },
  {
    label: 'Vehicles / Inventory',
    href: '/vehicles',
    icon: <Package size={16} />,
    color: '#f59e0b',
  },
  {
    label: 'Expenses',
    href: '/expenses',
    icon: <IndianRupee size={16} />,
    color: '#ef4444',
  },
  {
    label: 'Service & Warranty',
    href: '/service',
    icon: <Wrench size={16} />,
    color: '#3b82f6',
  },
  {
    label: 'Sales',
    href: '/sales',
    icon: <ShoppingCart size={16} />,
    color: '#f59e0b',
    permissions: ['view_sales'],
  },
  {
    label: 'Service',
    icon: <Wrench size={16} />,
    color: '#10b981',
    children: [
      {
        label: 'Bookings',
        href: '/service',
        icon: <Wrench size={15} />,
        permissions: ['view_service_bookings'],
      },
    ],
  },
  {
    label: 'Finance',
    icon: <BadgeIndianRupee size={16} />,
    color: '#6366f1',
    children: [
      {
        label: 'Commissions',
        href: '/commissions',
        icon: <TrendingUp size={15} />,
        // Added proper permission restriction instead of just adminOnly: false
        permissions: ['view_commissions'],
      },
      {
        label: 'GST Reports',
        href: '/gst',
        icon: <FileText size={15} />,
        permissions: ['view_gst_reports'],
      },
    ],
  },
  {
    label: 'HRMS',
    icon: <Users size={16} />,
    color: '#f97316',
    excludeRoles: ['dealer', 'distributor'],
    children: [
      {
        label: 'Dashboard',
        href: '/hrms/dashboard',
        icon: <LayoutDashboard size={15} />,
      },
      {
        label: 'Directory',
        href: '/hrms/directory',
        icon: <Briefcase size={15} />,
        adminOnly: true,
      },
      {
        label: 'Attendance',
        href: '/hrms/attendance',
        icon: <Clock size={15} />,
      },
      {
        label: 'Leaves',
        href: '/hrms/leave',
        icon: <Calendar size={15} />,
      },
      {
        label: 'Payroll',
        href: '/hrms/payroll',
        icon: <BadgeIndianRupee size={15} />,
        adminOnly: true,
      },
      {
        label: 'My Payslips',
        href: '/hrms/payslips',
        icon: <FileText size={15} />,
      },
    ]
  },
  {
    label: 'Settings',
    icon: <Settings size={16} />,
    color: '#94a3b8',
    children: [
      {
        label: 'General Setting',
        href: '/admin/settings/general',
        icon: <Sliders size={15} />,
        adminOnly: true
      },
      {
        label: 'Theme Setting',
        href: '/admin/settings/theme',
        icon: <Palette size={15} />
      },
      {
        label: 'Backup Database',
        href: '/admin/settings/backup',
        icon: <Database size={15} />,
        adminOnly: true
      },
      {
        label: 'Permissions',
        href: '/admin/permissions',
        icon: <Key size={15} />,
        adminOnly: true
      }
    ]
  },
  {
    label: 'Notifications',
    href: '/admin/notifications',
    icon: <Bell size={16} />,
    color: '#eab308',
    adminOnly: true,
  },
]

// ─── Visibility Check ─────────────────────────────────────────────────────────
function isItemVisible(
  item: NavItem,
  isAdmin: boolean,
  userRole: string | undefined,
  hasPermission: (name: string) => boolean
): boolean {
  // Admin sees everything
  if (isAdmin) return true

  // Hide if the user's role is in the exclude list
  if (item.excludeRoles && userRole && item.excludeRoles.includes(userRole)) {
    return false
  }

  // If item is admin-only, hide it for non-admins
  if (item.adminOnly) return false

  // If no permission requirement, show it (e.g. Dashboard)
  if (!item.permissions || item.permissions.length === 0) return true

  // Show if user has at least one of the listed permissions
  return item.permissions.some((p) => hasPermission(p))
}

// Filter a nav item and its children recursively
function filterNavItem(
  item: NavItem,
  isAdmin: boolean,
  userRole: string | undefined,
  hasPermission: (name: string) => boolean
): NavItem | null {
  // First, check if the parent item itself is hidden (e.g. via excludeRoles)
  if (!isItemVisible(item, isAdmin, userRole, hasPermission)) {
    return null
  }

  // If it has children, filter them
  if (item.children) {
    const visibleChildren = item.children
      .filter((child) => isItemVisible(child, isAdmin, userRole, hasPermission))
    if (visibleChildren.length === 0 && !isAdmin) return null
    return { ...item, children: visibleChildren }
  }
  // Leaf item
  return item
}

// ─── NavGroup ─────────────────────────────────────────────────────────────────
function NavGroup({ item, depth = 0, onClose, isCollapsed }: { item: NavItem; depth?: number; onClose?: () => void; isCollapsed?: boolean }) {
  const pathname = usePathname()
  const isActive = item.href
    ? pathname === item.href || pathname.startsWith(item.href + '/')
    : false
  const hasChildren = !!item.children?.length
  const anyChildActive = item.children?.some(c =>
    c.href && (pathname === c.href || pathname.startsWith(c.href + '/'))
  )
  const [open, setOpen] = useState(!!anyChildActive)

  useEffect(() => { if (anyChildActive) setOpen(true) }, [anyChildActive])

  if (!hasChildren && item.href) {
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={`sidebar-nav-link ${isActive ? 'active' : ''} ${depth > 0 ? 'ml-4 text-xs py-1.5' : ''} ${isCollapsed ? 'justify-center px-0' : ''}`}
        title={isCollapsed ? item.label : undefined}
      >
        <span className="nav-icon flex-shrink-0">{item.icon}</span>
        {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!isCollapsed && item.badge && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wide"
            style={{ background: 'linear-gradient(135deg,#10b981,#2563eb)', color: '#fff' }}>
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={() => {
          if (!isCollapsed) setOpen(!open)
        }}
        className={`sidebar-nav-link w-full ${anyChildActive ? 'active' : ''} ${depth > 0 ? 'ml-4 text-xs py-1.5' : ''} ${isCollapsed ? 'justify-center px-0 cursor-default' : ''}`}
        style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
        title={isCollapsed ? item.label : undefined}
      >
        <span className="nav-icon flex-shrink-0"
          style={{ color: anyChildActive ? '#60a5fa' : undefined }}>
          {item.icon}
        </span>
        {!isCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
        {!isCollapsed && item.badge && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: 'linear-gradient(135deg,#10b981,#2563eb)', color: '#fff' }}>
            {item.badge}
          </span>
        )}
        {!isCollapsed && (
          <span className="nav-icon ml-auto flex-shrink-0 transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <ChevronDown size={12} />
          </span>
        )}
      </button>

      {open && !isCollapsed && item.children && (
        <div className="mt-0.5 space-y-0.5 mb-1"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', marginLeft: '19px', paddingLeft: '10px' }}>
          {item.children.map(child => (
            <NavGroup key={child.label} item={child} depth={depth + 1} onClose={onClose} isCollapsed={isCollapsed} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
const ROLE_BADGE: Record<string, { bg: string; label: string }> = {
  admin:       { bg: 'linear-gradient(135deg,#e11d48,#9f1239)', label: 'Admin' },
  distributor: { bg: 'linear-gradient(135deg,#d97706,#b45309)', label: 'Distributor' },
  dealer:      { bg: 'linear-gradient(135deg,#059669,#047857)', label: 'Dealer' },
  bde:         { bg: 'linear-gradient(135deg,#2563eb,#1d4ed8)', label: 'BDE' },
}

// ─── Custom Hook for User Theme ────────────────────────────────────────────────
function useActiveTheme(settingsData: any) {
  const user = useAuthStore(state => state.user)
  const [localTheme, setLocalTheme] = useState<any>(null)

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`ev_crm_user_theme_${user.id}`)
      if (saved) {
        try { setLocalTheme(JSON.parse(saved)) } catch(e){}
      }
    }
    const listener = () => {
      if (user?.id) {
        const saved = localStorage.getItem(`ev_crm_user_theme_${user.id}`)
        if (saved) {
          try { setLocalTheme(JSON.parse(saved)) } catch(e){}
        }
      }
    }
    window.addEventListener('theme_changed', listener)
    return () => window.removeEventListener('theme_changed', listener)
  }, [user?.id])

  return localTheme || settingsData?.settings?.active_theme
}

// ─── Sidebar Content ──────────────────────────────────────────────────────────
function SidebarContent({ onClose, isCollapsed }: { onClose?: () => void; isCollapsed?: boolean }) {
  const { user, logout } = useAuthStore()
  const { hasPermission, isLoading } = usePermissionStore()
  const isAdmin = user?.role === 'admin'
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const roleBadge = ROLE_BADGE[user?.role ?? ''] ?? { bg: 'linear-gradient(135deg,#475569,#334155)', label: user?.role ?? '' }

  const { data: settingsData } = useQuery({
    queryKey: ['settings', 'general'],
    queryFn: () => api.get('/settings/general').then(r => r.data),
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const companyName = settingsData?.settings?.company_name || 'EV CRM'
  const companyLogo = settingsData?.settings?.company_logo
  const activeTheme = useActiveTheme(settingsData)
  const isLight = activeTheme?.appearance === 'light'

  const textMain = isLight ? '#1e293b' : '#f1f5f9'
  const textMuted = isLight ? '#64748b' : 'rgba(100,116,139,0.9)'
  const borderLight = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'
  const bgHover = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'

  // Build visible nav items by filtering based on permissions
  const visibleNavItems = navItems
    .map((item) => filterNavItem(item, isAdmin, user?.role, hasPermission))
    .filter((item): item is NavItem => item !== null)

  return (
    <div className={`flex flex-col h-full ${isLight ? 'sidebar-light' : ''}`}>
      {/* Logo */}
      <div className={`px-4 pt-5 pb-4 flex items-center flex-shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}
        style={{ borderBottom: `1px solid ${borderLight}` }}>
        <div className="flex items-center gap-3">
          {companyLogo ? (
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm overflow-hidden p-0.5">
               <img src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${companyLogo}`} alt="Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
          ) : (
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#2563eb,#10b981)', boxShadow: '0 0 20px rgba(37,99,235,0.5)' }}>
              <Zap size={18} color="#fff" />
              <div className="absolute inset-0 rounded-xl"
                style={{ background: 'linear-gradient(135deg,#2563eb,#10b981)', opacity: 0.4, filter: 'blur(8px)', zIndex: -1 }} />
            </div>
          )}
          {!isCollapsed && (
            <div>
              <p className="text-sm font-bold tracking-tight truncate max-w-[150px]" style={{ color: textMain, letterSpacing: '-0.02em' }}>
                {companyName}
              </p>
              <p className="text-[10px] font-medium truncate" style={{ color: textMuted }}>
                Sales & Distribution
              </p>
            </div>
          )}
        </div>
        {!isCollapsed && onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all"
            style={{ color: textMuted }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = textMain}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = textMuted}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Role badge */}
      {!isCollapsed && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
            style={{ background: bgHover, border: `1px solid ${borderLight}` }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: roleBadge.bg, boxShadow: '0 0 6px rgba(255,255,255,0.3)' }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: textMuted }}>
              {roleBadge.label} Dashboard
            </span>
            {isLoading && (
              <span className="ml-auto text-[9px]" style={{ color: textMuted }}>
                loading…
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation label */}
      {!isCollapsed && (
        <div className="px-4 pt-3 pb-1.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: textMuted }}>
            Navigation
          </p>
        </div>
      )}

      <nav className={`flex-1 overflow-y-auto px-3 pb-3 space-y-0.5 scrollbar-dark ${isCollapsed ? 'pt-4' : ''}`}>
        {visibleNavItems.map(item => (
          <NavGroup key={item.label} item={item} onClose={onClose} isCollapsed={isCollapsed} />
        ))}
      </nav>

      {/* Version badge */}
      {!isCollapsed && (
        <div className="px-4 pb-2">
          <div className="rounded-xl px-3 py-2 flex items-center justify-between"
            style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)' }}>
            <span className="text-[10px] font-semibold" style={{ color: '#60a5fa' }}>EV CRM v2.0</span>
            <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: '#34d399' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ boxShadow: '0 0 6px #34d399' }} />
              Live
            </span>
          </div>
        </div>
      )}

      {/* User footer */}
      <div className="px-3 pb-3 pt-2 flex-shrink-0"
        style={{ borderTop: `1px solid ${borderLight}` }}>
        <div className={`flex items-center px-2 py-2 rounded-xl group ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}
          style={{ transition: 'background var(--transition-base)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = bgHover}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: roleBadge.bg, boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}
            title={isCollapsed ? user?.name : undefined}>
            {initials}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: textMain, letterSpacing: '-0.01em' }}>
                  {user?.name || 'Admin'}
                </p>
                <p className="text-[10px] capitalize" style={{ color: textMuted }}>
                  {user?.role || 'admin'}
                </p>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-lg transition-all flex-shrink-0"
                style={{ color: textMuted }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'
                  ;(e.currentTarget as HTMLElement).style.color = '#f87171'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = ''
                  ;(e.currentTarget as HTMLElement).style.color = textMuted
                }}
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export function Sidebar({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [isHovered, setIsHovered] = useState(false)

  const { data: settingsData } = useQuery({
    queryKey: ['settings', 'general'],
    queryFn: () => api.get('/settings/general').then(r => r.data),
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const activeTheme = useActiveTheme(settingsData)
  const background = activeTheme?.primary_color && activeTheme?.secondary_color
    ? `linear-gradient(180deg, ${activeTheme.primary_color} 0%, ${activeTheme.secondary_color} 100%)`
    : 'linear-gradient(180deg, #0d1117 0%, #0a0f1a 100%)'

  const expanded = !isCollapsed || isHovered
  const currentWidth = expanded ? '260px' : '80px'

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex-shrink-0 h-screen sticky top-0 hidden md:block transition-all duration-300 z-40 relative group"
      style={{ 
        width: currentWidth,
        background: background,
        borderRight: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
      }}
    >
      <div className="h-full overflow-hidden transition-all duration-300 w-full">
        <SidebarContent isCollapsed={!expanded} />
      </div>
    </aside>
  )
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: settingsData } = useQuery({
    queryKey: ['settings', 'general'],
    queryFn: () => api.get('/settings/general').then(r => r.data),
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const activeTheme = useActiveTheme(settingsData)
  const background = activeTheme?.primary_color && activeTheme?.secondary_color
    ? `linear-gradient(180deg, ${activeTheme.primary_color} 0%, ${activeTheme.secondary_color} 100%)`
    : 'linear-gradient(180deg, #0d1117 0%, #0a0f1a 100%)'

  return (
    <>
      <div className="sidebar-backdrop fade-in" onClick={onClose} />
      <div
        className="sidebar-overlay slide-in-left"
        style={{
          width: '260px',
          background: background,
          borderRight: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.4)',
        }}
      >
        <SidebarContent onClose={onClose} />
      </div>
    </>
  )
}

