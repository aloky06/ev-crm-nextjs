'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'

export default function ThemeSettingsPage() {
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore(state => state.user?.role) === 'admin'
  const user = useAuthStore(state => state.user)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [localThemeId, setLocalThemeId] = useState<number | null>(null)

  React.useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`ev_crm_user_theme_${user.id}`)
      if (saved) {
        try { setLocalThemeId(JSON.parse(saved).id) } catch(e) {}
      }
    }
  }, [user?.id])
  
  const [formData, setFormData] = useState({
    name: '',
    appearance: 'light',
    primary_color: '#3b82f6',
    secondary_color: '#0f172a',
    font: 'Inter',
    active_for: 'all',
    is_active: true
  })

  const { data, isLoading } = useQuery({
    queryKey: ['themes'],
    queryFn: () => api.get('/settings/themes').then(r => r.data)
  })

  const saveMutation = useMutation({
    mutationFn: (data: any) => editingId 
      ? api.put(`/settings/themes/${editingId}`, data)
      : api.post('/settings/themes', data),
    onSuccess: () => {
      toast.success(`Theme ${editingId ? 'updated' : 'created'} successfully!`)
      queryClient.invalidateQueries({ queryKey: ['themes'] })
      setIsModalOpen(false)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save theme')
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/settings/themes/${id}`),
    onSuccess: () => {
      toast.success('Theme deleted')
      queryClient.invalidateQueries({ queryKey: ['themes'] })
    }
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async (theme: any) => {
      if (user?.id) {
        localStorage.setItem(`ev_crm_user_theme_${user.id}`, JSON.stringify(theme))
        setLocalThemeId(theme.id)
        window.dispatchEvent(new Event('theme_changed'))
      }
      return theme
    },
    onSuccess: () => {
      toast.success('Theme applied to your account!')
    }
  })

  const handleEdit = (theme: any) => {
    setFormData({
      name: theme.name,
      appearance: theme.appearance,
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color || '#0f172a',
      font: theme.font,
      active_for: theme.active_for,
      is_active: theme.is_active
    })
    setEditingId(theme.id)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setFormData({ name: '', appearance: 'light', primary_color: '#3b82f6', secondary_color: '#0f172a', font: 'Inter', active_for: 'all', is_active: true })
    setEditingId(null)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(formData)
  }

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading themes...</div>

  const themes = data?.themes || []

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Theme Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage platform appearances and color schemes.</p>
        </div>
        {isAdmin && (
          <button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors">
            <Plus size={18} /> Add Theme
          </button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Appearance</th>
                  <th className="px-6 py-4">Primary Color</th>
                  <th className="px-6 py-4">Font</th>
                  <th className="px-6 py-4">Active For</th>
                  <th className="px-6 py-4">Status</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {themes.map((theme: any) => (
                  <tr key={theme.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-700">{theme.name}</td>
                    <td className="px-6 py-4 capitalize">{theme.appearance}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: theme.primary_color }}></div>
                          <span className="font-mono text-[10px] text-slate-500">{theme.primary_color}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: theme.secondary_color || '#0a0f1a' }}></div>
                          <span className="font-mono text-[10px] text-slate-500">{theme.secondary_color || '#0a0f1a'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{theme.font}</td>
                    <td className="px-6 py-4 capitalize">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-semibold">
                        {theme.active_for}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const isThemeActive = localThemeId ? theme.id === localThemeId : theme.is_active;
                        return (
                          <button 
                            onClick={() => toggleActiveMutation.mutate(theme)}
                            disabled={toggleActiveMutation.isPending}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${isThemeActive ? 'bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'}`}
                          >
                            {isThemeActive ? 'Active' : 'Apply Theme'}
                          </button>
                        );
                      })()}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEdit(theme)} className="text-blue-500 hover:text-blue-700 p-1.5 mx-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => { if(confirm('Are you sure you want to delete this theme?')) deleteMutation.mutate(theme.id) }} className="text-red-500 hover:text-red-700 p-1.5 mx-1 bg-red-50 hover:bg-red-100 rounded transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {themes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No themes configured.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden scale-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Theme' : 'Add Theme'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Theme Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="e.g. Festival Dark Theme" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Appearance</label>
                  <select value={formData.appearance} onChange={e => setFormData({...formData, appearance: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Active For</label>
                  <select value={formData.active_for} onChange={e => setFormData({...formData, active_for: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="all">All Roles</option>
                    <option value="admin">Admin Only</option>
                    <option value="dealer">Dealers Only</option>
                    <option value="distributor">Distributors Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Primary Color (Top)</label>
                  <div className="flex gap-2">
                    <input type="color" value={formData.primary_color} onChange={e => setFormData({...formData, primary_color: e.target.value})} className="w-10 h-10 rounded border border-slate-200 p-1 cursor-pointer" />
                    <input type="text" value={formData.primary_color} onChange={e => setFormData({...formData, primary_color: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Secondary Color (Bottom)</label>
                  <div className="flex gap-2">
                    <input type="color" value={formData.secondary_color} onChange={e => setFormData({...formData, secondary_color: e.target.value})} className="w-10 h-10 rounded border border-slate-200 p-1 cursor-pointer" />
                    <input type="text" value={formData.secondary_color} onChange={e => setFormData({...formData, secondary_color: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Font Family</label>
                <select value={formData.font} onChange={e => setFormData({...formData, font: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Poppins">Poppins</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-700">Set as Active Theme</label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saveMutation.isPending} className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  {saveMutation.isPending ? 'Saving...' : 'Save Theme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
