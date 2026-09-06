/**
 * AboutPage — Platform information & documentation
 * Route: /about
 * SIH 26067 | OceanIQ — INCOIS 3D Ocean Visualization Platform
 *
 * Fully self-contained — no external UI component library dependencies.
 * Matches the dark glassmorphism theme used throughout the app.
 */

import {
  Waves,
  BookOpen,
  Code2,
  GitBranch,
  Layers,
  Globe,
  BarChart3,
  ExternalLink,
  CheckCircle2,
  Circle,
  Clock,
  Cpu,
  Database,
  ShieldAlert,
  Sparkles,
  Satellite,
} from 'lucide-react'
import { APP_CONFIG, OCEAN_VARIABLES, OBSERVATION_TYPES } from '@/config'

// ── Static Data ─────────────────────────────────────────────────────────────

const TECH_STACK = [
  { name: 'React 19',          role: 'UI framework',      color: '#61dafb' },
  { name: 'TypeScript',        role: 'Type safety',       color: '#3178c6' },
  { name: 'Vite 6',           role: 'Build tooling',     color: '#646cff' },
  { name: 'Tailwind CSS v4',   role: 'Styling',           color: '#38bdf8' },
  { name: 'Three.js',          role: '3D rendering',      color: '#ffffff' },
  { name: 'React Three Fiber', role: '3D React bindings', color: '#ff6b6b' },
  { name: '@react-three/drei', role: 'R3F helpers',       color: '#ffd166' },
  { name: 'Recharts',          role: 'Data charts',       color: '#8884d8' },
  { name: 'React Router v7',   role: 'Client routing',   color: '#f44250' },
  { name: 'FastAPI (planned)', role: 'Backend API',       color: '#009688' },
  { name: 'xarray (planned)',  role: 'NetCDF handling',   color: '#ef6c00' },
  { name: 'Python 3.11+',      role: 'Backend language',  color: '#ffd43b' },
]

const ROADMAP = [
  {
    phase: '1', title: 'Foundation', status: 'complete',
    items: ['Project scaffold', 'Design system', 'Client routing', 'TypeScript types'],
  },
  {
    phase: '2', title: '3D Visualization', status: 'complete',
    items: ['WebGL globe (Three.js)', 'Depth slicing', 'Colormap rendering', 'Camera controls'],
  },
  {
    phase: '3', title: 'Sensor Integration', status: 'complete',
    items: ['Argo float markers', 'Glider 3D model', 'CTD overlays', 'Model vs Obs comparison'],
  },
  {
    phase: '4', title: 'AI & Analytics', status: 'complete',
    items: ['AI anomaly detection', 'NLP ocean assistant', 'Unified risk dashboard', 'Click-anywhere intelligence'],
  },
  {
    phase: '5', title: 'Real Data Backend', status: 'planned',
    items: ['FastAPI + xarray server', 'NetCDF ingestion', 'INCOIS OPeNDAP connection', 'Live Argo data feed'],
  },
  {
    phase: '6', title: 'Advanced Features', status: 'planned',
    items: ['Isosurface rendering', 'Transect cross-sections', 'Drift simulation', 'Export tools'],
  },
]

const FEATURES = [
  { icon: <Globe size={18} />,      label: '3D Interactive Globe',      desc: 'WebGL-powered Indian Ocean globe with full depth navigation' },
  { icon: <Layers size={18} />,     label: 'Multi-Depth Visualization', desc: '9 depth levels from 0m to 2000m with animated transitions' },
  { icon: <Satellite size={18} />,  label: 'Satellite + Model Modes',   desc: 'Toggle between basemap styles and model heatmap overlays' },
  { icon: <Database size={18} />,   label: 'Sensor Platform Overlay',   desc: 'Live Argo floats, ocean gliders, and CTD stations on the globe' },
  { icon: <BarChart3 size={18} />,  label: 'Depth Profile Charts',      desc: 'Click any sensor to render its vertical T/S profile chart' },
  { icon: <ShieldAlert size={18} />,label: 'AI Anomaly Detection',       desc: 'Automated marine heatwave, salinity spike, and current jet alerts' },
  { icon: <Sparkles size={18} />,   label: 'NLP Ocean Assistant',       desc: 'Natural-language querying — "Show Arabian Sea at 500m"' },
  { icon: <Cpu size={18} />,        label: 'Model vs Observation',      desc: 'Automatic Model–In-Situ residual calculation with accuracy badge' },
]

// ── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/3 border border-white/10 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/8 bg-white/2">
        <span className="text-cyan-400">{icon}</span>
        <h2 className="text-sm font-bold text-slate-200 tracking-wide">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    complete: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    next:     'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    planned:  'bg-white/5 text-slate-500 border-white/10',
  }
  return (
    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${map[status] ?? map.planned}`}>
      {status}
    </span>
  )
}

function PhaseIcon({ status }: { status: string }) {
  if (status === 'complete') return <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
  if (status === 'next')     return <Circle size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
  return <Clock size={16} className="text-slate-600 flex-shrink-0 mt-0.5" />
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function AboutPage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#010610] text-slate-100 font-sans">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="text-center pt-2 pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Waves size={28} className="text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{APP_CONFIG.name}</h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed mb-4">
            {APP_CONFIG.description}
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">{APP_CONFIG.buildId}</span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10 font-mono">v{APP_CONFIG.version}</span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">Prototype</span>
          </div>
        </div>

        {/* ── Disclaimer ───────────────────────────────────────── */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-slate-400 leading-relaxed">
          <strong className="text-amber-400">⚠ Disclaimer: </strong>
          This platform is a scientific research prototype developed for INCOIS (Indian National Centre for Ocean Information Services) under MoES.
          It is <em>not</em> an official government portal.
          All data shown is simulated for research and demonstration purposes.
        </div>

        {/* ── Two-column grid ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: 2/3 width */}
          <div className="lg:col-span-2 space-y-6">

            {/* Problem Statement */}
            <Section title="Platform Objective" icon={<BookOpen size={16} />}>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">
                Develop a web-based interactive 3D visualization platform that integrates numerical ocean
                model outputs and in-situ observations for INCOIS (Indian National Centre for Ocean
                Information Services), under the Ministry of Earth Sciences (MoES).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {['Volumetric 3D rendering (WebGL)', 'Multi-depth navigation (0–2000m)', 'Argo / Glider / CTD overlay', 'Model vs In-Situ comparison', 'NetCDF data ingestion', 'Time-step animation', 'Scientific colorbar with editor', 'Web-native — no install required'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </Section>

            {/* Platform Features */}
            <Section title="Platform Features" icon={<Cpu size={16} />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURES.map((f) => (
                  <div key={f.label} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/3 border border-white/8 hover:border-cyan-500/20 hover:bg-cyan-500/5 transition-all">
                    <span className="text-cyan-400 mt-0.5 flex-shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-200 mb-0.5">{f.label}</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Development Roadmap */}
            <Section title="Development Roadmap" icon={<GitBranch size={16} />}>
              <div className="space-y-3">
                {ROADMAP.map((phase, i) => (
                  <div key={phase.phase} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <PhaseIcon status={phase.status} />
                      {i < ROADMAP.length - 1 && (
                        <div className={`w-px flex-1 mt-1 ${phase.status === 'complete' ? 'bg-emerald-500/30' : 'bg-white/10'}`} />
                      )}
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-200">Phase {phase.phase}: {phase.title}</span>
                        <StatusBadge status={phase.status} />
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {phase.items.map(item => (
                          <span key={item} className="text-[10px] text-slate-500">· {item}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Tech Stack */}
            <Section title="Technology Stack" icon={<Code2 size={16} />}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TECH_STACK.map((t) => (
                  <div key={t.name} className="rounded-lg border border-white/8 bg-white/3 p-2.5 hover:border-white/15 transition-colors">
                    <p className="text-xs font-semibold mb-0.5" style={{ color: t.color }}>{t.name}</p>
                    <p className="text-[10px] text-slate-600">{t.role}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Right: 1/3 width */}
          <div className="space-y-6">

            {/* Ocean Variables */}
            <Section title="Ocean Variables" icon={<Layers size={16} />}>
              <div className="space-y-2.5">
                {OCEAN_VARIABLES.map((v) => (
                  <div key={v.id} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{v.label}</p>
                      <p className="text-[10px] text-slate-600 leading-snug mt-0.5">{v.description}</p>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 whitespace-nowrap flex-shrink-0">
                      {v.unit}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Observation Types */}
            <Section title="Instrument Platforms" icon={<Globe size={16} />}>
              <div className="space-y-2.5">
                {OBSERVATION_TYPES.map((o) => (
                  <div key={o.id} className="flex items-start gap-2.5">
                    <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />
                    <div>
                      <p className="text-xs font-medium text-slate-200">{o.label}</p>
                      <p className="text-[10px] text-slate-600 leading-snug mt-0.5">{o.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Data Sources */}
            <Section title="Data Sources" icon={<Database size={16} />}>
              <div className="space-y-2">
                {[
                  { name: 'INCOIS ROMS/MOM6', desc: 'Operational ocean model NetCDF outputs', status: 'Planned' },
                  { name: 'Argo Global Program', desc: 'Real-time profiling float data', status: 'Demo' },
                  { name: 'INCOIS Glider Network', desc: 'Underwater glider observations', status: 'Demo' },
                  { name: 'CORIOLIS / Copernicus', desc: 'Delayed-mode quality data', status: 'Planned' },
                ].map((d) => (
                  <div key={d.name} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-slate-300">{d.name}</p>
                      <p className="text-[10px] text-slate-600">{d.desc}</p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border whitespace-nowrap flex-shrink-0 ${
                      d.status === 'Demo'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-white/5 text-slate-600 border-white/10'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Links */}
            <Section title="Resources" icon={<ExternalLink size={16} />}>
              <div className="space-y-2">
                {[
                  { label: 'INCOIS Official Website', href: 'https://incois.gov.in', color: 'text-cyan-400' },
                  { label: 'Argo Float Program', href: 'https://argo.ucsd.edu', color: 'text-cyan-400' },
                  { label: 'CF Conventions', href: 'https://cfconventions.org', color: 'text-cyan-400' },
                  { label: 'INCOIS SAMUDRA Portal', href: 'https://samudra.incois.gov.in', color: 'text-cyan-400' },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-xs text-slate-400 hover:text-cyan-300 transition-colors group py-1 border-b border-white/5 last:border-0"
                  >
                    <span>{link.label}</span>
                    <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
                  </a>
                ))}
              </div>
            </Section>

          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 border-t border-white/8">
          <p className="text-[11px] text-slate-600 font-mono">
            OceanIQ · {APP_CONFIG.name} · v{APP_CONFIG.version} · Scientific Prototype
          </p>
        </div>

      </div>
    </div>
  )
}
