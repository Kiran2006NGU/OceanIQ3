/**
 * LoginPage.tsx — OceanIQ Platform Access & User Registration
 * OceanIQ — Indian Ocean 3D Intelligence Platform | INCOIS / MoES
 */

import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Waves, Globe, Shield, ChevronDown, ArrowRight, Radio, Layers, Activity } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { UserDesignation } from '@/context/AuthContext'

const DESIGNATIONS: UserDesignation[] = [
  'Research Scientist',
  'Ocean Data Analyst',
  'Disaster Management Officer',
  'Maritime Safety Officer',
  'Environmental Consultant',
  'Coastal Engineer',
  'Student / Researcher',
  'Policy Advisor',
  'Fisheries Officer',
  'Other',
]

const STATS = [
  { label: 'Active Instruments', value: '4,382', icon: <Radio size={14} className="text-cyan-400" /> },
  { label: 'Ocean Variables', value: '6', icon: <Layers size={14} className="text-purple-400" /> },
  { label: 'Depth Coverage', value: '2000m', icon: <Waves size={14} className="text-blue-400" /> },
  { label: 'EEZ Coverage', value: '2.01M km²', icon: <Globe size={14} className="text-emerald-400" /> },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [designation, setDesignation] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim() || name.trim().length < 2) errs.name = 'Please enter your full name (min 2 chars)'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Please enter a valid email address'
    if (!designation) errs.designation = 'Please select your designation'
    return errs
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setIsSubmitting(true)

    // Simulate brief loading for UX polish
    await new Promise((r) => setTimeout(r, 800))

    login({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      designation,
      loginTime: new Date().toISOString(),
    })

    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#010610] text-slate-100 font-sans flex flex-col overflow-hidden relative">
      {/* Animated background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,180,216,0.22) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(99,102,241,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Floating grid lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,180,216,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,216,0.6) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Top nav brand */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-400/30">
            <Waves size={20} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white font-mono">OceanIQ</div>
            <div className="text-[10px] text-slate-500 font-mono">INCOIS · Indian Ocean Intelligence Platform</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
          <Shield size={12} className="text-emerald-400" />
          <span>Secure Access</span>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className={`w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

          {/* Left panel — branding */}
          <div className="hidden lg:flex flex-col gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-semibold mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                LIVE PLATFORM · INCOIS MoES
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
                Understand the<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  Ocean in 3D
                </span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                A scientific-grade ocean intelligence workstation integrating 3D numerical models with in-situ Argo, Glider, CTD, and BGC observations across India's Exclusive Economic Zone.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="p-3.5 rounded-xl bg-[#030d1a]/80 border border-white/8 backdrop-blur-md"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {s.icon}
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{s.label}</span>
                  </div>
                  <div className="text-lg font-black font-mono text-white">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Feature bullets */}
            <div className="space-y-2">
              {[
                { icon: <Globe size={14} className="text-cyan-400" />, text: 'Interactive 3D Earth with scalar field visualization' },
                { icon: <Layers size={14} className="text-purple-400" />, text: 'Water column depth slicing from 0 to 2000m' },
                { icon: <Activity size={14} className="text-pink-400" />, text: 'Real-time telemetry from Argo & Glider platforms' },
                { icon: <Shield size={14} className="text-amber-400" />, text: 'Marine hazard detection & SAR drift forecasting' },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-2.5 text-xs text-slate-400">
                  {f.icon}
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel — login form */}
          <div>
            <div className="p-8 rounded-2xl bg-[#030d1a]/90 border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/60">
              <div className="mb-7">
                <h2 className="text-xl font-bold text-white mb-1">Platform Access</h2>
                <p className="text-xs text-slate-400">
                  Enter your details to access the OceanIQ Intelligence Platform
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                {/* Full Name */}
                <div>
                  <label htmlFor="login-name" className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="login-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })) }}
                    placeholder="e.g. Dr. Priya Nair"
                    className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white placeholder-slate-600 outline-none transition-all focus:ring-2 focus:ring-cyan-500/50 ${
                      errors.name ? 'border-red-500/60 focus:border-red-400' : 'border-white/10 focus:border-cyan-400/60'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-[11px] text-red-400">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })) }}
                    placeholder="e.g. priya.nair@incois.gov.in"
                    className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white placeholder-slate-600 outline-none transition-all focus:ring-2 focus:ring-cyan-500/50 ${
                      errors.email ? 'border-red-500/60 focus:border-red-400' : 'border-white/10 focus:border-cyan-400/60'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-[11px] text-red-400">{errors.email}</p>}
                </div>

                {/* Designation */}
                <div>
                  <label htmlFor="login-designation" className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Designation / Role <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="login-designation"
                      value={designation}
                      onChange={(e) => { setDesignation(e.target.value); setErrors((p) => ({ ...p, designation: '' })) }}
                      className={`w-full appearance-none px-4 py-2.5 rounded-xl bg-white/5 border text-sm outline-none transition-all focus:ring-2 focus:ring-cyan-500/50 cursor-pointer ${
                        !designation ? 'text-slate-600' : 'text-white'
                      } ${
                        errors.designation ? 'border-red-500/60 focus:border-red-400' : 'border-white/10 focus:border-cyan-400/60'
                      }`}
                      style={{ backgroundImage: 'none' }}
                    >
                      <option value="" disabled className="bg-[#030d1a] text-slate-500">Select your role…</option>
                      {DESIGNATIONS.map((d) => (
                        <option key={d} value={d} className="bg-[#030d1a] text-white">{d}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                  {errors.designation && <p className="mt-1 text-[11px] text-red-400">{errors.designation}</p>}
                </div>

                {/* Submit */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm transition-all shadow-lg shadow-cyan-900/40 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                      <span>Authenticating…</span>
                    </>
                  ) : (
                    <>
                      <Globe size={15} />
                      <span>Access Platform</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              {/* Footer note */}
              <div className="mt-6 pt-5 border-t border-white/8">
                <p className="text-[11px] text-slate-600 text-center leading-relaxed">
                  Your information is stored locally and used only to personalize your experience on this platform.
                  This is not a government portal — data shown is for research & demonstration purposes.
                </p>
                <div className="flex items-center justify-center gap-3 mt-3">
                  <span className="text-[10px] font-mono text-slate-600">Indian National Centre for Ocean Information Services</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <footer className="relative z-10 border-t border-white/8 px-6 py-3 flex items-center justify-between text-[10px] font-mono text-slate-600">
        <span>OceanIQ · Ocean Intelligence Platform · INCOIS / MoES</span>
        <span>v0.1.0 · Scientific Prototype</span>
      </footer>
    </div>
  )
}
