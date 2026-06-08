'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { getErrorMessage } from '@/lib/utils'
import { Eye, EyeOff, Zap, ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()
  const [email, setEmail] = useState('dealer.agra@evcrm.test')
  const [password, setPassword] = useState('Test@1234')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const demoAccounts = [
    { role: 'Admin',  email: 'admin@evcrm.test',      pw: 'Admin@1234',  icon: 'bi-shield-fill-check', color: '#2563eb', bg: '#eff6ff' },
    { role: 'BDE L0', email: 'bde.l0@evcrm.test',     pw: 'Bde@1234',    icon: 'bi-person-badge-fill', color: '#7c3aed', bg: '#f5f3ff' },
    { role: 'Dealer', email: 'dealer.lko1@evcrm.test', pw: 'Dealer@1234', icon: 'bi-shop',              color: '#059669', bg: '#ecfdf5' },
  ]

  return (
    <div className="min-h-screen flex w-full bg-white overflow-hidden">
      
      {/* Left Panel - Branding & Aesthetics */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden" 
           style={{ background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)' }}>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
               style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          {/* Glowing Orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse"
               style={{ background: '#3b82f6', animationDuration: '8s' }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse"
               style={{ background: '#10b981', animationDuration: '12s' }} />
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-semibold mb-6 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Online & Secure
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 tracking-tight">
            Powering the <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Future of Mobility
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed font-light max-w-md">
            The all-in-one platform for electric vehicle distributors, dealers, and sales executives to manage their entire workflow.
          </p>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 flex items-center gap-6 text-sm text-slate-500 font-medium">
          <span>&copy; 2026 EV CRM</span>
          <div className="w-1 h-1 rounded-full bg-slate-700" />
          <span>Enterprise Grade</span>
          <div className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-blue-400"/> Data Encrypted</span>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative bg-white">
        
        {/* Mobile Logo (Visible only on small screens) */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
               style={{ background: 'linear-gradient(135deg, #2563eb, #10b981)' }}>
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">EV CRM</span>
        </div>

        <div className="w-full max-w-[420px] fade-in-up">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Welcome back</h2>
            <p className="text-slate-500 font-medium">Please enter your details to sign in.</p>
          </div>

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

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <a href="/auth/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Forgot password?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  required placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
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
              type="submit" disabled={isLoading}
              className="w-full relative group overflow-hidden text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 8px 20px rgba(37,99,235,0.25)' }}
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              
              {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Login */}
          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-400 font-medium tracking-wide uppercase">Quick Demo Login</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {demoAccounts.map(a => (
                <button key={a.role} type="button"
                  onClick={() => { setEmail(a.email); setPassword(a.pw) }}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: a.bg, color: a.color }}>
                    <i className={`bi ${a.icon} text-sm`} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{a.role}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
      
      {/* Global Style for shimmer animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  )
}
