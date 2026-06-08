'use client'
import React from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Bell, Check, Trash2 } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Badge'

export default function UserNotificationsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['allNotifications'],
    queryFn: () => api.get('/notifications').then(r => r.data)
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => refetch()
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post(`/notifications/read-all`),
    onSuccess: () => {
      toast.success('All notifications marked as read')
      refetch()
    }
  })

  const notifications = data?.notifications || []
  const unreadCount = data?.unread_count || 0

  return (
    <div className="fade-in-up pb-10">
      <PageHeader
        title="My Notifications"
        subtitle="View your recent alerts, updates, and messages"
        icon={<Bell className="h-5 w-5" />}
        actions={
          unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={() => markAllReadMutation.mutate()} loading={markAllReadMutation.isPending}>
              Mark all as read
            </Button>
          )
        }
      />

      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-10 flex justify-center"><Spinner /></div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Bell className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p>You have no notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n: any) => (
                <div key={n.id} className={`p-4 sm:p-5 transition-colors flex gap-4 ${n.read_at ? 'bg-white' : 'bg-blue-50/30'}`}>
                  <div className="mt-1 flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      n.data.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                      n.data.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                      n.data.type === 'error' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <Bell size={18} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className={`text-sm ${n.read_at ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                          {n.data.title}
                        </h4>
                        <p className={`text-sm mt-1 ${n.read_at ? 'text-slate-500' : 'text-slate-700'}`}>
                          {n.data.message}
                        </p>
                      </div>
                      <div className="text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    {!n.read_at && (
                      <div className="mt-3">
                        <button 
                          onClick={() => markReadMutation.mutate(n.id)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Check size={14} /> Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
