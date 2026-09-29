/**
 * ModelComparisonDashboard.tsx — Competitive & Comparative Multi-Model View
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Provides side-by-side comparison of:
 * 1. Multiple operational ocean models (HYCOM, ROMS, MOM6, CMEMS GLORYS)
 * 2. In-situ observations (Argo, Glider, CTD, BGC)
 * 3. Taylor diagram metrics (correlation, RMSE, standard deviation ratio)
 * 4. Radar skill score chart
 * 5. Vertical profile comparison
 */

import { useState, useMemo } from 'react'
import {
  Scale,
  BarChart2,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ArrowUpDown,
  Waves,
  Activity,
  Zap,
  Star,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

type OceanModel = {
  id: string
  name: string
  shortName: string
  agency: string
  resolution: string
  variables: string[]
  color: string
  metrics: {
    rmse_temp: number
    bias_temp: number
    corr_temp: number
    rmse_sal: number
    bias_sal: number
    corr_sal: number
    skill_score: number
    update_frequency: string
    forecast_horizon: string
    depth_levels: number
  }
}

const OCEAN_MODELS: OceanModel[] = [
  {
    id: 'incois-hycom',
    name: 'INCOIS HYCOM Regional',
    shortName: 'HYCOM-R',
    agency: 'INCOIS / MoES',
    resolution: '1/12° (~9km)',
    variables: ['Temperature', 'Salinity', 'Currents', 'SSH', 'MLD'],
    color: '#22d3ee',
    metrics: {
      rmse_temp: 0.52, bias_temp: +0.18, corr_temp: 0.96,
      rmse_sal: 0.31, bias_sal: -0.08, corr_sal: 0.94,
      skill_score: 0.87,
      update_frequency: '6-hourly',
      forecast_horizon: '7 days',
      depth_levels: 41,
    },
  },
  {
    id: 'cmems-glorys',
    name: 'CMEMS GLORYS12',
    shortName: 'GLORYS12',
    agency: 'Copernicus Marine / MERCATOR',
    resolution: '1/12° (~8km)',
    variables: ['Temperature', 'Salinity', 'U/V Currents', 'SSH', 'Sea Ice'],
    color: '#818cf8',
    metrics: {
      rmse_temp: 0.61, bias_temp: +0.09, corr_temp: 0.94,
      rmse_sal: 0.38, bias_sal: +0.12, corr_sal: 0.91,
      skill_score: 0.82,
      update_frequency: 'Daily',
      forecast_horizon: '5 days',
      depth_levels: 50,
    },
  },
  {
    id: 'mom6',
    name: 'NOAA/GFDL MOM6',
    shortName: 'MOM6',
    agency: 'NOAA / GFDL',
    resolution: '1/4° (~25km)',
    variables: ['Temperature', 'Salinity', 'Velocity', 'SSH'],
    color: '#34d399',
    metrics: {
      rmse_temp: 0.78, bias_temp: +0.31, corr_temp: 0.91,
      rmse_sal: 0.45, bias_sal: -0.22, corr_sal: 0.88,
      skill_score: 0.74,
      update_frequency: 'Daily',
      forecast_horizon: '10 days',
      depth_levels: 75,
    },
  },
  {
    id: 'incois-roms',
    name: 'INCOIS ROMS Coastal',
    shortName: 'ROMS-C',
    agency: 'INCOIS / MoES',
    resolution: '3km (coastal)',
    variables: ['Temperature', 'Salinity', 'Tidal Currents', 'Sediment Flux'],
    color: '#fb923c',
    metrics: {
      rmse_temp: 0.44, bias_temp: -0.06, corr_temp: 0.97,
      rmse_sal: 0.28, bias_sal: +0.04, corr_sal: 0.95,
      skill_score: 0.90,
      update_frequency: '3-hourly',
      forecast_horizon: '3 days',
      depth_levels: 32,
    },
  },
]

// Observation platform reference values
const OBS_REFERENCE = {
  argo: { name: 'Argo Float Network', count: 4382, accuracy_temp: '0.002°C', accuracy_sal: '0.01 PSU', depth: '2000m' },
  glider: { name: 'Ocean Glider (SLOCUM/SeaGlider)', count: 12, accuracy_temp: '0.001°C', accuracy_sal: '0.005 PSU', depth: '1000m' },
  ctd: { name: 'Ship CTD Rosette', count: 47, accuracy_temp: '0.001°C', accuracy_sal: '0.003 PSU', depth: '5000m' },
  bgc: { name: 'BGC-Argo', count: 843, accuracy_temp: '0.002°C', accuracy_sal: '0.01 PSU', depth: '2000m' },
}

// ── Mini bar chart ─────────────────────────────────────────────────────────────
function MetricBar({
  label, value, maxValue, unit, color, lowerIsBetter = false
}: {
  label: string
  value: number
  maxValue: number
  unit: string
  color: string
  lowerIsBetter?: boolean
}) {
  const pct = Math.min(100, (value / maxValue) * 100)
  const isBest = lowerIsBetter ? value <= maxValue * 0.5 : pct >= 75

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[9px] font-mono">
        <span className="text-slate-400">{label}</span>
        <span className={`font-bold ${isBest ? 'text-emerald-400' : 'text-slate-300'}`}>
          {value.toFixed(2)} {unit}
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${lowerIsBetter ? 100 - pct : pct}%`,
            background: color,
          }}
        />
      </div>
    </div>
  )
}

// ── Model card ────────────────────────────────────────────────────────────────
function ModelCard({
  model,
  rank,
  isSelected,
  onSelect,
  variable,
}: {
  model: OceanModel
  rank: number
  isSelected: boolean
  onSelect: () => void
  variable: 'temperature' | 'salinity'
}) {
  const [expanded, setExpanded] = useState(false)
  const m = model.metrics
  const rmse = variable === 'temperature' ? m.rmse_temp : m.rmse_sal
  const bias = variable === 'temperature' ? m.bias_temp : m.bias_sal
  const corr = variable === 'temperature' ? m.corr_temp : m.corr_sal
  const unit = variable === 'temperature' ? '°C' : 'PSU'

  const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`

  return (
    <div
      className={`rounded-xl border transition-all overflow-hidden ${
        isSelected
          ? 'border-cyan-400/60 bg-cyan-950/20 shadow-lg shadow-cyan-950/30'
          : 'border-white/10 bg-white/3 hover:border-white/20'
      }`}
    >
      {/* Card Header */}
      <div
        onClick={onSelect}
        className="p-3 cursor-pointer select-none flex items-start justify-between gap-2"
      >
        <div className="flex items-start gap-2.5">
          {/* Rank badge */}
          <div className="text-base mt-0.5 leading-none">{rankIcon}</div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: model.color }}
              />
              <span className="text-[11px] font-bold text-white leading-tight">{model.shortName}</span>
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-0.5 leading-relaxed">{model.agency}</div>
            <div className="text-[9px] font-mono text-slate-500">Δx = {model.resolution}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {/* Skill score */}
          <div
            className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold"
            style={{ background: model.color + '25', color: model.color, border: `1px solid ${model.color}55` }}
          >
            {(m.skill_score * 100).toFixed(0)}% Skill
          </div>
          <button
            onClick={e => { e.stopPropagation(); setExpanded(ex => !ex) }}
            className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Metrics section */}
      <div className="px-3 pb-3 space-y-1.5">
        <MetricBar label="RMSE" value={rmse} maxValue={1.5} unit={unit} color={model.color} lowerIsBetter />
        <MetricBar label="Correlation r" value={corr} maxValue={1.0} unit="" color={model.color} />
        {/* Bias pill */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-slate-400">Bias</span>
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
            Math.abs(bias) < 0.1 ? 'text-emerald-400 bg-emerald-950/30' : 'text-amber-400 bg-amber-950/30'
          }`}>
            {bias > 0 ? '+' : ''}{bias.toFixed(2)} {unit}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-2">
          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
            <div className="p-1.5 rounded bg-black/30 border border-white/5">
              <div className="text-slate-400 mb-0.5">Update Cycle</div>
              <div className="text-white font-bold">{m.update_frequency}</div>
            </div>
            <div className="p-1.5 rounded bg-black/30 border border-white/5">
              <div className="text-slate-400 mb-0.5">Horizon</div>
              <div className="text-white font-bold">{m.forecast_horizon}</div>
            </div>
            <div className="p-1.5 rounded bg-black/30 border border-white/5">
              <div className="text-slate-400 mb-0.5">Depth Levels</div>
              <div className="text-white font-bold">{m.depth_levels}</div>
            </div>
            <div className="p-1.5 rounded bg-black/30 border border-white/5">
              <div className="text-slate-400 mb-0.5">Resolution</div>
              <div className="text-white font-bold">{model.resolution}</div>
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Variables</div>
            <div className="flex flex-wrap gap-1">
              {model.variables.map(v => (
                <span key={v} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-mono">
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Vertical Profile Comparison Chart ────────────────────────────────────────
function ProfileComparisonChart({ variable }: { variable: 'temperature' | 'salinity' }) {
  const depths = [0, 10, 25, 50, 100, 200, 500, 1000, 2000]
  const unit = variable === 'temperature' ? '°C' : 'PSU'

  // Synthetic profile data for Indian Ocean (Bay of Bengal, Aug 2026)
  const argo = variable === 'temperature'
    ? [29.5, 29.2, 28.8, 27.9, 26.1, 21.4, 13.2, 7.1, 4.2]
    : [32.8, 32.9, 33.2, 33.8, 34.6, 35.1, 35.3, 35.5, 35.6]

  const hycom = variable === 'temperature'
    ? [29.7, 29.4, 29.0, 28.2, 26.4, 21.7, 13.5, 7.4, 4.3]
    : [32.7, 32.8, 33.1, 33.9, 34.7, 35.2, 35.4, 35.6, 35.7]

  const glorys = variable === 'temperature'
    ? [29.8, 29.5, 29.1, 28.0, 26.0, 21.3, 13.1, 7.0, 4.1]
    : [32.9, 33.0, 33.3, 34.0, 34.7, 35.0, 35.2, 35.4, 35.5]

  const maxVal = variable === 'temperature' ? 32 : 36.5
  const minVal = variable === 'temperature' ? 4 : 32

  return (
    <div className="space-y-2">
      <div className="text-[9px] font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
        <Activity size={11} className="text-cyan-400" />
        Vertical Profile Comparison — Bay of Bengal
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-[9px] font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-emerald-400 rounded-full" />
          <span className="text-slate-300">Argo Float (Obs)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-cyan-400 rounded-full" />
          <span className="text-slate-300">HYCOM-R</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-purple-400 rounded-full" />
          <span className="text-slate-300">GLORYS12</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-52 bg-black/30 rounded-xl border border-white/8 overflow-hidden p-3">
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(frac => (
            <line key={frac} x1={30} y1={frac * 170} x2={310} y2={frac * 170}
              stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
          ))}

          {/* Y axis depth labels */}
          {depths.map((d, i) => {
            const y = (i / (depths.length - 1)) * 170
            return (
              <text key={d} x={25} y={y + 4} textAnchor="end" fontSize={8} fill="rgba(148,163,184,0.7)">{d}m</text>
            )
          })}

          {/* X axis value labels */}
          {[minVal, (minVal + maxVal) / 2, maxVal].map((v, i) => {
            const x = 30 + (i / 2) * 280
            return (
              <text key={v} x={x} y={180} textAnchor="middle" fontSize={8} fill="rgba(148,163,184,0.7)">{v.toFixed(0)}</text>
            )
          })}

          {/* Argo profile */}
          <polyline
            points={argo.map((val, i) => {
              const x = 30 + ((val - minVal) / (maxVal - minVal)) * 280
              const y = (i / (depths.length - 1)) * 170
              return `${x},${y}`
            }).join(' ')}
            fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
          {argo.map((val, i) => {
            const x = 30 + ((val - minVal) / (maxVal - minVal)) * 280
            const y = (i / (depths.length - 1)) * 170
            return <circle key={i} cx={x} cy={y} r={2.5} fill="#34d399" />
          })}

          {/* HYCOM profile */}
          <polyline
            points={hycom.map((val, i) => {
              const x = 30 + ((val - minVal) / (maxVal - minVal)) * 280
              const y = (i / (depths.length - 1)) * 170
              return `${x},${y}`
            }).join(' ')}
            fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="4,2" strokeLinecap="round"
          />

          {/* GLORYS profile */}
          <polyline
            points={glorys.map((val, i) => {
              const x = 30 + ((val - minVal) / (maxVal - minVal)) * 280
              const y = (i / (depths.length - 1)) * 170
              return `${x},${y}`
            }).join(' ')}
            fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="2,3" strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="text-[9px] font-mono text-slate-500 text-center">
        {unit} · Aug 2026 · 14.5°N, 87.5°E (Bay of Bengal Central Basin)
      </div>
    </div>
  )
}

// ── Radar skill chart (simplified polygon) ────────────────────────────────────
function SkillRadarChart({ models }: { models: OceanModel[] }) {
  const metrics = [
    { label: 'Temp. RMSE', key: 'rmse_temp', invert: true, max: 1.5 },
    { label: 'Correlation', key: 'corr_temp', invert: false, max: 1.0 },
    { label: 'Sal. RMSE', key: 'rmse_sal', invert: true, max: 0.8 },
    { label: 'Skill Score', key: 'skill_score', invert: false, max: 1.0 },
    { label: 'Hor. Res.', key: '_res', invert: false, max: 1.0 },
  ]

  const centerX = 110
  const centerY = 110
  const radius = 85
  const n = metrics.length

  function getPoint(metricIdx: number, value: number): [number, number] {
    const angle = (metricIdx / n) * 2 * Math.PI - Math.PI / 2
    return [
      centerX + radius * value * Math.cos(angle),
      centerY + radius * value * Math.sin(angle),
    ]
  }

  function getModelScore(model: OceanModel, metric: typeof metrics[0]): number {
    const m = model.metrics as any
    if (metric.key === '_res') {
      const resMap: Record<string, number> = { 'incois-hycom': 0.90, 'cmems-glorys': 0.92, 'mom6': 0.55, 'incois-roms': 1.0 }
      return resMap[model.id] ?? 0.7
    }
    const raw = m[metric.key] as number
    const normalized = raw / metric.max
    return metric.invert ? Math.max(0, 1 - normalized) : Math.min(1, normalized)
  }

  return (
    <div className="space-y-2">
      <div className="text-[9px] font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
        <Star size={11} className="text-amber-400" />
        Comparative Skill Assessment
      </div>
      <div className="bg-black/30 rounded-xl border border-white/8 p-3">
        <svg viewBox="0 0 220 220" className="w-full max-h-52 mx-auto">
          {/* Radar rings */}
          {[0.25, 0.5, 0.75, 1.0].map(r => (
            <polygon
              key={r}
              points={metrics.map((_, i) => {
                const [x, y] = getPoint(i, r)
                return `${x},${y}`
              }).join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
          ))}
          {/* Radial lines */}
          {metrics.map((_, i) => {
            const [x, y] = getPoint(i, 1)
            return <line key={i} x1={centerX} y1={centerY} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          })}
          {/* Labels */}
          {metrics.map((m, i) => {
            const [x, y] = getPoint(i, 1.22)
            return (
              <text key={m.label} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                fontSize={7.5} fill="rgba(148,163,184,0.9)">{m.label}</text>
            )
          })}

          {/* Model polygons */}
          {models.slice(0, 3).map(model => (
            <polygon
              key={model.id}
              points={metrics.map((metric, i) => {
                const score = getModelScore(model, metric)
                const [x, y] = getPoint(i, score)
                return `${x},${y}`
              }).join(' ')}
              fill={model.color + '15'}
              stroke={model.color}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          ))}
        </svg>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {models.slice(0, 3).map(model => (
            <div key={model.id} className="flex items-center gap-1 text-[9px] font-mono">
              <div className="w-3 h-0.5 rounded-full" style={{ background: model.color }} />
              <span className="text-slate-300">{model.shortName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ModelComparisonDashboard() {
  const [selectedVariable, setSelectedVariable] = useState<'temperature' | 'salinity'>('temperature')
  const [selectedModels, setSelectedModels] = useState<string[]>(['incois-hycom', 'incois-roms'])
  const [sortBy, setSortBy] = useState<'skill_score' | 'rmse' | 'corr'>('skill_score')

  const sortedModels = useMemo(() => {
    return [...OCEAN_MODELS].sort((a, b) => {
      if (sortBy === 'skill_score') return b.metrics.skill_score - a.metrics.skill_score
      if (sortBy === 'rmse') {
        const ra = selectedVariable === 'temperature' ? a.metrics.rmse_temp : a.metrics.rmse_sal
        const rb = selectedVariable === 'temperature' ? b.metrics.rmse_temp : b.metrics.rmse_sal
        return ra - rb
      }
      const ca = selectedVariable === 'temperature' ? a.metrics.corr_temp : a.metrics.corr_sal
      const cb = selectedVariable === 'temperature' ? b.metrics.corr_temp : b.metrics.corr_sal
      return cb - ca
    })
  }, [sortBy, selectedVariable])

  const toggleModel = (id: string) => {
    setSelectedModels(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(m => m !== id) : prev) : [...prev, id]
    )
  }

  const bestModel = sortedModels[0]

  return (
    <div className="flex flex-col gap-4 h-full font-sans text-xs overflow-y-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-purple-400" />
          <span className="font-bold text-white">Model Comparison</span>
          <span className="text-[9px] font-mono text-slate-400">{OCEAN_MODELS.length} Models</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-slate-400">Sort:</span>
          {(['skill_score', 'rmse', 'corr'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition-all ${
                sortBy === s ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40' : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
              }`}
            >
              {s === 'skill_score' ? 'Skill' : s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Variable Selector ── */}
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => setSelectedVariable('temperature')}
          className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all ${
            selectedVariable === 'temperature'
              ? 'bg-gradient-to-r from-red-500/20 to-amber-500/20 border border-amber-400/40 text-amber-200'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          🌡️ Temperature
        </button>
        <button
          onClick={() => setSelectedVariable('salinity')}
          className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all ${
            selectedVariable === 'salinity'
              ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/40 text-purple-200'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          🧂 Salinity
        </button>
      </div>

      {/* ── Best Model Banner ── */}
      <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-400/30 flex items-center gap-2.5 flex-shrink-0">
        <Award size={16} className="text-amber-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-amber-200">Best Performing Model</div>
          <div className="text-[9px] font-mono text-amber-300/80 truncate">
            {bestModel.name} — {(bestModel.metrics.skill_score * 100).toFixed(0)}% Willmott Skill Score
          </div>
        </div>
        <div
          className="w-2 h-8 rounded-full flex-shrink-0"
          style={{ background: bestModel.color }}
        />
      </div>

      {/* ── Model Cards ── */}
      <div className="space-y-2 flex-shrink-0">
        {sortedModels.map((model, i) => (
          <ModelCard
            key={model.id}
            model={model}
            rank={i + 1}
            isSelected={selectedModels.includes(model.id)}
            onSelect={() => toggleModel(model.id)}
            variable={selectedVariable}
          />
        ))}
      </div>

      {/* ── Vertical Profile Comparison ── */}
      <div className="border-t border-white/10 pt-3">
        <ProfileComparisonChart variable={selectedVariable} />
      </div>

      {/* ── Skill Radar Chart ── */}
      <div className="border-t border-white/10 pt-3">
        <SkillRadarChart models={OCEAN_MODELS} />
      </div>

      {/* ── In-Situ Observation Reference ── */}
      <div className="border-t border-white/10 pt-3 pb-4">
        <div className="text-[9px] font-mono uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
          <Waves size={11} className="text-cyan-400" />
          In-Situ Reference Platforms
        </div>
        <div className="space-y-1.5">
          {Object.values(OBS_REFERENCE).map(obs => (
            <div
              key={obs.name}
              className="p-2 rounded-lg bg-white/3 border border-white/8 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-white truncate">{obs.name}</div>
                <div className="text-[9px] font-mono text-slate-400">
                  {obs.count.toLocaleString()} platforms · ±{obs.accuracy_temp} · Max {obs.depth}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <CheckCircle size={12} className="text-emerald-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
