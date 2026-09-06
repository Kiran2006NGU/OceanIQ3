/**
 * LandingPage.tsx — Page 1: Mission Control & Operational Overview
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */

import { Link } from 'react-router-dom'
import {
  Globe,
  Radio,
  Scale,
  Database,
  Activity,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Waves,
  Layers,
  Flame,
  LifeBuoy,
  Fish,
  Compass,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { APP_CONFIG } from '@/config'

const LIVE_METRICS = [
  { label: 'Active Forecast Cycle', value: '12:00 UTC', sub: 'INCOIS High-Res Model', icon: <Globe className="text-cyan-400" size={18} /> },
  { label: 'In-Situ Instruments', value: '4,382', sub: 'Argo · Glider · CTD · BGC', icon: <Radio className="text-emerald-400" size={18} /> },
  { label: 'Water Column Depth', value: '0 – 2000m', sub: 'Continuous Slicing & 3D', icon: <Layers className="text-purple-400" size={18} /> },
  { label: 'Indian EEZ Coverage', value: '2.01M km²', sub: 'Arabian Sea · BoB · Andaman', icon: <Compass className="text-amber-400" size={18} /> },
]

const SCENARIOS = [
  {
    id: 'heatwave',
    title: 'Marine Heatwave & Bleaching',
    desc: 'Monitor sea surface temperature anomalies > +1.5°C across coral reef biomes in Lakshadweep and Andaman.',
    tag: 'Disaster Prevention',
    link: '/operations?scenario=heatwave',
    color: 'from-red-500/20 to-amber-500/20 border-red-500/40 text-red-300',
    icon: <Flame size={20} className="text-red-400" />,
  },
  {
    id: 'sar',
    title: 'Search & Rescue (SAR) Drift',
    desc: 'Forecast 3D surface current vector trajectories and wind-driven drift for maritime emergency response.',
    tag: 'Maritime Safety',
    link: '/operations?scenario=sar',
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300',
    icon: <LifeBuoy size={20} className="text-cyan-400" />,
  },
  {
    id: 'pfz',
    title: 'Potential Fishing Zones (PFZ)',
    desc: 'Co-locate thermal fronts, upwelling divergence, and Chlorophyll-a biomass for coastal artisanal advisories.',
    tag: 'Blue Economy',
    link: '/operations?scenario=pfz',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300',
    icon: <Fish size={20} className="text-emerald-400" />,
  },
  {
    id: 'validation',
    title: 'Model-Observation Validation',
    desc: 'Calculate point-to-point numerical model residuals against real-time Argo & Glider CTD profiles.',
    tag: 'Quality Control',
    link: '/compare',
    color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-300',
    icon: <Scale size={20} className="text-purple-400" />,
  },
]

const QUICK_MODULES = [
  {
    title: '3D Ocean Explorer',
    desc: 'Interactive 3D Earth, scalar fields (T/S/Chl-a), 3D current vector glyphs, depth slices, and isosurface extraction.',
    icon: <Globe className="text-cyan-400" size={24} />,
    path: '/dashboard',
    cta: 'Launch Workstation',
    primary: true,
  },
  {
    title: 'Observation Explorer',
    desc: 'Filter, inspect, and visualize in-situ platforms (Argo floats, underwater gliders, CTD casts, and BGC sensors).',
    icon: <Radio className="text-emerald-400" size={24} />,
    path: '/observations',
    cta: 'Browse Telemetry',
  },
  {
    title: 'Model Validation Suite',
    desc: 'Quantify model accuracy with nearest-grid matching, signed bias (M - O), and vertical paired residual profiles.',
    icon: <Scale className="text-purple-400" size={24} />,
    path: '/compare',
    cta: 'Validate Model',
  },
  {
    title: 'Data Hub & Ingestion',
    desc: 'Multi-format data catalog, NetCDF CF-metadata inspector, and automated CSV/ASCII observation upload parsers.',
    icon: <Database className="text-amber-400" size={24} />,
    path: '/data',
    cta: 'Manage Datasets',
  },
  {
    title: 'Scientific Analysis Lab',
    desc: 'Generate 2-point vertical ocean transect cross-sections, T-S water mass density curves, and Hovmöller diagrams.',
    icon: <Activity className="text-pink-400" size={24} />,
    path: '/analysis',
    cta: 'Start Diagnostics',
  },
  {
    title: 'Science & Public Outreach',
    desc: 'Interactive 3D educational explainers on Argo profiling cycles, monsoonal current reversals, and salinity dynamics.',
    icon: <Sparkles className="text-indigo-400" size={24} />,
    path: '/science',
    cta: 'Explore Science',
  },
]

export function LandingPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#010610] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* ── 1. MISSION CONTROL HERO ─────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/10 px-4 py-16 sm:px-6 lg:px-8">
        {/* Ambient background glow */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 50% 20%, rgba(0, 180, 216, 0.18) 0%, rgba(13, 27, 42, 0) 70%)',
          }}
        />

        <div className="mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-semibold mb-6 shadow-sm shadow-cyan-900/40">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            INCOIS · Digital Twin of the Indian Ocean
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 mb-5">
            Understand the Ocean in 3D
          </h1>

          <p className="mx-auto max-w-3xl text-base text-slate-300 sm:text-lg leading-relaxed mb-8">
            A high-performance scientific visualization workstation integrating 3D numerical ocean models with in-situ Argo, Glider, and CTD observations across India’s Exclusive Economic Zone.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm shadow-lg shadow-cyan-900/50 transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles size={16} />
              <span>Launch 3D Explorer</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/observations"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#030d1a]/90 hover:bg-white/10 border border-white/15 text-slate-200 text-sm font-semibold transition-all"
            >
              <Radio size={16} className="text-emerald-400" />
              <span>Explore In-Situ Telemetry</span>
            </Link>

            <Link
              to="/compare"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#030d1a]/90 hover:bg-white/10 border border-white/15 text-slate-200 text-sm font-semibold transition-all"
            >
              <Scale size={16} className="text-purple-400" />
              <span>Model vs Observation</span>
            </Link>
          </div>

          {/* Live System Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            {LIVE_METRICS.map((m) => (
              <div
                key={m.label}
                className="p-3.5 rounded-xl bg-[#030d1a]/85 border border-white/10 backdrop-blur-md shadow-md"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    {m.label}
                  </span>
                  {m.icon}
                </div>
                <div className="text-lg font-black font-mono text-white tracking-tight">{m.value}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. OPERATIONAL DECISION PRESETS ──────────────────────────────── */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 border-b border-white/10 bg-[#020914]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 mb-1">
                <ShieldAlert size={14} />
                <span>Decision Support Presets</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Disaster Management & Operational Scenarios
              </h2>
            </div>
            <Link
              to="/operations"
              className="mt-3 md:mt-0 inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 hover:text-cyan-200"
            >
              <span>View All Operational Scenarios</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SCENARIOS.map((s) => (
              <Link
                key={s.id}
                to={s.link}
                className={`p-4 rounded-xl bg-gradient-to-b ${s.color} border backdrop-blur-md flex flex-col justify-between group hover:scale-[1.02] transition-all shadow-lg`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    {s.icon}
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/10 border border-white/15 font-semibold text-slate-200">
                      {s.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-cyan-200 transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono font-semibold">
                  <span>Load Preset</span>
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. PLATFORM CORE MODULES ────────────────────────────────────── */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              Integrated Ocean Intelligence Suite
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-mono">
              6 Dedicated Workspaces Engineered for MoES / INCOIS Oceanographic Workflows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {QUICK_MODULES.map((m) => (
              <div
                key={m.title}
                className="p-5 rounded-2xl bg-[#030d1a]/80 border border-white/10 hover:border-cyan-400/40 transition-all flex flex-col justify-between shadow-xl group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                      {m.icon}
                    </div>
                    {m.primary && (
                      <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                        Primary Workstation
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{m.desc}</p>
                </div>

                <Link
                  to={m.path}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                    m.primary
                      ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-md shadow-cyan-950/50'
                      : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-cyan-400/30'
                  }`}
                >
                  <span>{m.cta}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 px-4 py-8 bg-[#020813] text-xs font-mono text-slate-500">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-bold">{APP_CONFIG.name}</span>
            <span>· {APP_CONFIG.buildId}</span>
          </div>
          <div>Ocean Intelligence Platform · Ministry of Earth Sciences (MoES) / INCOIS</div>
        </div>
      </footer>
    </div>
  )
}
