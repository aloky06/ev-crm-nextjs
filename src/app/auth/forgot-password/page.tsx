'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'
import { getErrorMessage } from '@/lib/utils'
import { Mail, Zap, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      await api.post('/auth/forgot-password', { email })
      setIsSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
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
            Regain Access <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
              to Your Account
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed font-light max-w-md">
            Enter your email address to receive a secure link to reset your password and continue managing your business.
          </p>
        </div>

        <div className="relative z-10 text-sm text-slate-500 font-medium">
          &copy; 2026 EV CRM
        </div>
      </div>

      {/* Right Panel - Forgot Password Form */}
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
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-8">
            <ArrowLeft size={16} /> Back to Login
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Forgot Password</h2>
            <p className="text-slate-500 font-medium">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          {isSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center text-center animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-emerald-800 mb-2">Check your email</h3>
              <p className="text-sm text-emerald-600/80 font-medium mb-6">
                We've sent password reset instructions to <br/>
                <span className="font-bold text-emerald-700">{email}</span>
              </p>
              <Link href="/auth/login" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 underline">
                Return to log in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required autoFocus
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
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
                type="submit" disabled={isLoading || !email}
                className="w-full relative group overflow-hidden text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 8px 20px rgba(37,99,235,0.25)' }}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isLoading ? 'Sending Instructions...' : 'Reset Password'}
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
