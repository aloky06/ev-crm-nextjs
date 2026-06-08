'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/axios'
import { getErrorMessage } from '@/lib/utils'
import { Lock, Zap, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const token = searchParams.get('token')
  const emailParam = searchParams.get('email')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPwConfirm, setShowPwConfirm] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [emailParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation
      })
      setIsSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Invalid Request</h2>
          <p className="text-slate-500 mb-6">Password reset token is missing from the URL.</p>
          <Link href="/auth/forgot-password" className="text-blue-600 font-semibold hover:underline">
            Request a new password reset link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex w-full bg-white overflow-hidden">
      
      {/* Left Panel - Branding & Aesthetics */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden" 
           style={{ background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)' }}>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]"
               style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse"
               style={{ background: '#3b82f6', animationDuration: '8s' }} />
        </div>

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
               style={{ background: 'linear-gradient(135deg, #2563eb, #10b981)' }}>
            <Zap size={24} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">EV CRM</span>
        </div>

        {/* Center Typography */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 tracking-tight">
            Set Your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
              New Password
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed font-light max-w-md">
            Choose a strong, unique password to protect your EV CRM account and keep your business data secure.
          </p>
        </div>

        <div className="relative z-10 text-sm text-slate-500 font-medium">
          &copy; 2026 EV CRM
        </div>
      </div>

      {/* Right Panel - Reset Password Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative bg-white">
        
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
               style={{ background: 'linear-gradient(135deg, #2563eb, #10b981)' }}>
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">EV CRM</span>
        </div>

        <div className="w-full max-w-[420px] fade-in-up">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Create New Password</h2>
            <p className="text-slate-500 font-medium">
              Please enter your new password below.
            </p>
          </div>

          {isSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center text-center animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-emerald-800 mb-2">Password Reset Successful</h3>
              <p className="text-sm text-emerald-600/80 font-medium mb-6">
                Your password has been changed successfully. You can now log in with your new password.
              </p>
              <Link href="/auth/login" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
                Continue to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <input type="hidden" value={email} />

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    required placeholder="••••••••" minLength={8}
                    className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Confirmation Field */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPwConfirm ? 'text' : 'password'}
                    value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)}
                    required placeholder="••••••••" minLength={8}
                    className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                  <button type="button" onClick={() => setShowPwConfirm(!showPwConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                    {showPwConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2.5 text-sm p-3.5 rounded-xl bg-red-50 text-red-600 border border-red-100 animate-in slide-in-from-top-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit" disabled={isLoading || !password || !passwordConfirmation}
                className="w-full relative group overflow-hidden text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 8px 20px rgba(37,99,235,0.25)' }}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  )
}
