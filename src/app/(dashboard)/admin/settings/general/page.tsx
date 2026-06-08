'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { Save, Image as ImageIcon } from 'lucide-react'

export default function GeneralSettingsPage() {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    company_name: '',
    gstin: '',
    timezone: 'UTC',
    currency: 'INR',
    currency_position: 'prefix'
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [iconFile, setIconFile] = useState<File | null>(null)
  
  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'general'],
    queryFn: () => api.get('/settings/general').then(r => r.data)
  })

  useEffect(() => {
    if (data?.settings) {
      setFormData({
        company_name: data.settings.company_name || '',
        gstin: data.settings.gstin || '',
        timezone: data.settings.timezone || 'UTC',
        currency: data.settings.currency || 'INR',
        currency_position: data.settings.currency_position || 'prefix',
      })
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: (submitData: FormData) => api.post('/settings/general', submitData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('General settings updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['settings', 'general'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update settings')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = new FormData()
    submitData.append('company_name', formData.company_name)
    submitData.append('gstin', formData.gstin)
    submitData.append('timezone', formData.timezone)
    submitData.append('currency', formData.currency)
    submitData.append('currency_position', formData.currency_position)
    
    if (logoFile) submitData.append('logo_file', logoFile)
    if (iconFile) submitData.append('icon_file', iconFile)

    mutation.mutate(submitData)
  }

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>

  return (
    <div className="max-w-4xl space-y-6 fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">General Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your company identity and localized settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column - Text Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Company Title</label>
                  <input 
                    type="text" 
                    required
                    value={formData.company_name}
                    onChange={e => setFormData({...formData, company_name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">VAT/GST Registration Number</label>
                  <input 
                    type="text" 
                    value={formData.gstin}
                    onChange={e => setFormData({...formData, gstin: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Time Zone</label>
                  <select 
                    value={formData.timezone}
                    onChange={e => setFormData({...formData, timezone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="UTC">UTC</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Currency</label>
                    <select 
                      value={formData.currency}
                      onChange={e => setFormData({...formData, currency: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Currency Position</label>
                    <select 
                      value={formData.currency_position}
                      onChange={e => setFormData({...formData, currency_position: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="prefix">Prefix (₹100)</option>
                      <option value="suffix">Suffix (100₹)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column - Media */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Company Logo</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-slate-50">
                    {data?.settings?.company_logo && !logoFile && (
                      <div className="mb-3 flex justify-center">
                        <img src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${data.settings.company_logo}`} alt="Logo" className="h-16 object-contain" />
                      </div>
                    )}
                    <ImageIcon className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => e.target.files && setLogoFile(e.target.files[0])}
                      className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 w-full cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Company Icon (Favicon)</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-slate-50">
                    {data?.settings?.company_icon && !iconFile && (
                      <div className="mb-3 flex justify-center">
                        <img src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${data.settings.company_icon}`} alt="Icon" className="h-8 w-8 object-contain" />
                      </div>
                    )}
                    <ImageIcon className="mx-auto h-6 w-6 text-slate-400 mb-2" />
                    <input 
                      type="file" 
                      accept="image/*,.ico"
                      onChange={e => e.target.files && setIconFile(e.target.files[0])}
                      className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 w-full cursor-pointer"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={mutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30"
              >
                <Save size={18} /> {mutation.isPending ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
