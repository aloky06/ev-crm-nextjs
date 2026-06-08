'use client'
import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Bell, Send } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function AdminNotificationsPage() {
  const [audience, setAudience] = useState('all')
  const [type, setType] = useState('info')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const sendMutation = useMutation({
    mutationFn: (d: any) => api.post('/admin/notifications/send', d),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Notification sent successfully!')
      setTitle('')
      setMessage('')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error sending notification')
    }
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message) {
      toast.error("Please provide both title and message.")
      return
    }

    sendMutation.mutate({ title, message, audience, type })
  }

  return (
    <div className="fade-in-up pb-10">
      <PageHeader
        title="Broadcast Notification"
        subtitle="Send system notifications and alerts directly to users' dashboards"
        icon={<Bell className="h-5 w-5" />}
      />

      <div className="max-w-2xl mx-auto">
        <Card className="p-6 border-slate-200 shadow-sm">
          <form onSubmit={handleSend} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Target Audience</label>
                <select 
                  value={audience} 
                  onChange={e => setAudience(e.target.value)}
                  className="w-full text-sm border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">All Users</option>
                  <option value="dealers">Dealers Only</option>
                  <option value="distributors">Distributors Only</option>
                  <option value="bdes">BDEs Only</option>
                  <option value="employees">Company Employees Only</option>
                </select>
                <p className="text-xs text-slate-500">Who should receive this alert?</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Alert Type</label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value)}
                  className="w-full text-sm border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="info">Info (Blue)</option>
                  <option value="success">Success (Green)</option>
                  <option value="warning">Warning (Yellow)</option>
                  <option value="error">Critical Error (Red)</option>
                </select>
                <p className="text-xs text-slate-500">Visual priority indicator.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Notification Title</label>
              <input 
                type="text" 
                required
                value={title} 
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., System Maintenance Scheduled"
                className="w-full text-sm border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Detailed Message</label>
              <textarea 
                required
                value={message} 
                onChange={e => setMessage(e.target.value)}
                placeholder="Provide clear instructions or details..."
                className="w-full text-sm border-slate-200 rounded-xl px-3 py-2 min-h-[120px] focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button type="submit" loading={sendMutation.isPending} leftIcon={<Send size={16} />}>
                Broadcast Notification
              </Button>
            </div>
          </form>
        </Card>

        {/* Live Preview */}
        <div className="mt-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Live Preview</h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 max-w-sm mx-auto opacity-90">
            <div className="flex gap-3">
              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                type === 'info' ? 'bg-blue-500' : 
                type === 'success' ? 'bg-emerald-500' : 
                type === 'warning' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              <div>
                <p className="text-sm font-bold text-slate-800">{title || 'Notification Title'}</p>
                <p className="text-xs text-slate-500 mt-1 break-words">{message || 'Your detailed message will appear here. It supports multiple lines and will be visible in the user dropdown.'}</p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Just now</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
