'use client'

import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Clock, Calendar, Coffee, FileText, Gift, Megaphone, CheckCircle2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Badge, Input, Select, Spinner } from '@/components/ui/Badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'

export default function HrmsDashboard() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [time, setTime] = useState(new Date())
  const [isPunchedIn, setIsPunchedIn] = useState(false)
  const [punchTime, setPunchTime] = useState<Date | null>(null)
  const [showHolidayModal, setShowHolidayModal] = useState(false)
  
  const [showPunchModal, setShowPunchModal] = useState(false)
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locating, setLocating] = useState(false)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [submittingPunch, setSubmittingPunch] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const openPunchModal = () => {
    setShowPunchModal(true)
    setLocating(true)
    setSelfieFile(null)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocating(false)
        },
        (err) => {
          toast.error("Could not fetch location. Please enable location services.")
          setLocating(false)
        }
      )
    } else {
      toast.error("Geolocation is not supported by your browser.")
      setLocating(false)
    }
  }

  const submitPunch = async () => {
    if (!selfieFile) {
      toast.error("Please capture a selfie to proceed.")
      return
    }
    if (!location) {
      toast.error("Location is required.")
      return
    }

    try {
      setSubmittingPunch(true)
      const formData = new FormData()
      formData.append('attendance_date', new Date().toISOString().split('T')[0])
      formData.append('status', 'present')
      formData.append('marked_by', 'self')
      formData.append('latitude', location.lat.toString())
      formData.append('longitude', location.lng.toString())
      formData.append('selfie', selfieFile)

      if (!isPunchedIn) {
        formData.append('check_in', new Date().toTimeString().substring(0, 5))
      } else {
        formData.append('check_in', punchTime ? punchTime.toTimeString().substring(0, 5) : '09:00')
        formData.append('check_out', new Date().toTimeString().substring(0, 5))
      }

      await api.post('/hrms/attendance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setIsPunchedIn(!isPunchedIn)
      if (!isPunchedIn) {
        setPunchTime(new Date())
        toast.success("Clock In Successful")
      } else {
        setPunchTime(null)
        toast.success("Clock Out Successful")
      }
      setShowPunchModal(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error submitting attendance")
    } finally {
      setSubmittingPunch(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const { data: holidaysData, isLoading: loadingHolidays } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => api.get('/hrms/holidays').then(r => r.data.holidays || []),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Record<string,string>>()

  const createHolidayMutation = useMutation({
    mutationFn: (d: Record<string,string>) => api.post('/hrms/holidays', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] })
      toast.success('Holiday added!')
      setShowHolidayModal(false)
      reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error adding holiday'),
  })

  return (
    <div className="space-y-6 fade-in-up pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Good Morning, {user?.name || 'User'}!</h1>
          <p className="text-slate-500 mt-1">Here is what's happening in your organization today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Web Clock Widget (Keka Style) */}
        <Card className="col-span-1 lg:col-span-1 border-t-4 border-t-blue-600 shadow-sm">
          <div className="p-6 flex flex-col items-center text-center">
            <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase mb-4">Web Clock</h3>
            <div className="text-4xl font-light text-slate-800 tracking-tight mb-2">
              {formatTime(time)}
            </div>
            <div className="text-sm text-slate-500 mb-8">
              {formatDate(time)}
            </div>
            
            <div className="w-48 h-48 rounded-full border-8 flex items-center justify-center mb-8 relative transition-all duration-500" 
                 style={{ borderColor: isPunchedIn ? '#10b981' : '#f1f5f9' }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isPunchedIn ? (
                  <>
                    <p className="text-sm text-slate-500 mb-1">Punched In At</p>
                    <p className="text-xl font-bold text-emerald-600">{punchTime ? formatTime(punchTime) : '--:--'}</p>
                    <p className="text-xs text-slate-400 mt-2">Working actively</p>
                  </>
                ) : (
                  <>
                    <Clock size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">Not Punched In</p>
                  </>
                )}
              </div>
            </div>

            <Button 
              size="lg" 
              className={`w-full py-6 text-lg font-bold rounded-2xl shadow-xl transition-all ${
                isPunchedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
              }`} 
              onClick={openPunchModal}
            >
              <i className={`bi ${isPunchedIn ? 'bi-box-arrow-right' : 'bi-fingerprint'} text-2xl mr-2`} />
              {isPunchedIn ? 'Web Clock Out' : 'Web Clock In'}
            </Button>
          </div>
        </Card>

        {/* Center & Right Column Widgets */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* Quick Stats / Leave Balances */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <Calendar size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Casual Leave</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">12<span className="text-sm text-slate-400 font-normal ml-1">days</span></p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-rose-500 mb-2">
                <Coffee size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Sick Leave</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">5<span className="text-sm text-slate-400 font-normal ml-1">days</span></p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-blue-500 mb-2">
                <FileText size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Privilege Leave</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">15<span className="text-sm text-slate-400 font-normal ml-1">days</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Announcements */}
            <Card className="shadow-sm border-slate-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Megaphone size={16} className="text-orange-500" />
                  Announcements
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Townhall Meeting</p>
                    <p className="text-xs text-slate-500 mt-0.5">Join us this Friday at 4 PM for the Q3 update.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">New Policy Update</p>
                    <p className="text-xs text-slate-500 mt-0.5">Please review the updated WFH policy guidelines.</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Upcoming Holidays & Events */}
            <Card className="shadow-sm border-slate-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Gift size={16} className="text-purple-500" />
                  Upcoming Holidays
                </h3>
                {user?.role === 'admin' && (
                  <button onClick={() => setShowHolidayModal(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Plus size={14} /> Add
                  </button>
                )}
              </div>
              <div className="p-4 space-y-4 max-h-[250px] overflow-y-auto">
                {loadingHolidays ? (
                  <div className="flex justify-center"><Spinner /></div>
                ) : !holidaysData || holidaysData.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No upcoming holidays</p>
                ) : (
                  holidaysData.map((holiday: any) => (
                    <div key={holiday.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{holiday.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(holiday.holiday_date)}</p>
                      </div>
                      <Badge label={holiday.type} status="active" />
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
          
        </div>
      </div>

      {/* Add Holiday Modal */}
      <Modal open={showHolidayModal} onClose={() => setShowHolidayModal(false)} title="Add Holiday" size="sm">
        <form onSubmit={handleSubmit(d => createHolidayMutation.mutate(d))} className="space-y-4">
          <Input label="Holiday Name" placeholder="e.g. Diwali" {...register('name', { required: true })} />
          <Input label="Date" type="date" {...register('holiday_date', { required: true })} />
          <Select 
            label="Type" 
            options={[
              { value: 'national', label: 'National' },
              { value: 'regional', label: 'Regional' },
              { value: 'optional', label: 'Optional' },
              { value: 'company', label: 'Company specific' }
            ]}
            {...register('type', { required: true })} 
          />
          <Select 
            label="Applies To" 
            options={[
              { value: 'all', label: 'Everyone' },
              { value: 'company', label: 'Company Only' },
              { value: 'dealer', label: 'Dealers' },
              { value: 'distributor', label: 'Distributors' }
            ]}
            {...register('entity_type')} 
          />
          <div className="pt-3 flex gap-3 justify-end border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowHolidayModal(false)}>Cancel</Button>
            <Button type="submit" loading={createHolidayMutation.isPending}>Add Holiday</Button>
          </div>
        </form>
      </Modal>

      {/* Geolocation & Selfie Punch Modal */}
      <Modal open={showPunchModal} onClose={() => setShowPunchModal(false)} title={isPunchedIn ? "Clock Out" : "Clock In"} size="sm">
        <div className="space-y-5">
          {/* Location Status */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${location ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
              <i className={`bi ${location ? 'bi-geo-alt-fill' : 'bi-geo-alt'} text-xl`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Location Status</p>
              {locating ? (
                <p className="text-xs text-blue-600 flex items-center gap-1"><Spinner /> Fetching GPS...</p>
              ) : location ? (
                <p className="text-xs text-emerald-600 font-medium">Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</p>
              ) : (
                <p className="text-xs text-red-500">Location required</p>
              )}
            </div>
          </div>

          {/* Selfie Capture */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Capture Selfie</label>
            <div className="relative">
              <input 
                type="file" 
                accept="image/*" 
                capture="user" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelfieFile(e.target.files[0])
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${selfieFile ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50'}`}>
                {selfieFile ? (
                  <>
                    <i className="bi bi-camera-fill text-3xl text-emerald-500 mb-2" />
                    <p className="text-sm font-medium text-emerald-700">Selfie Captured</p>
                    <p className="text-xs text-emerald-600 mt-1">{selfieFile.name}</p>
                  </>
                ) : (
                  <>
                    <i className="bi bi-camera text-3xl text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-600">Tap to Open Camera</p>
                    <p className="text-xs text-slate-400 mt-1">Live photo required for attendance</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowPunchModal(false)}>Cancel</Button>
            <Button onClick={submitPunch} loading={submittingPunch} disabled={!location || !selfieFile}>
              {isPunchedIn ? 'Submit Clock Out' : 'Submit Clock In'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
