/**
 * LayerControls — Organized layer toggles for all visualization layers
 * SIH 26067 | Ocean Intelligence Platform
 *
 * Sections:
 * 1. Ocean Model (core data layers)
 * 2. In-Situ Platforms (Argo, Glider, CTD)
 * 3. Animated Overlays (currents, streamlines, value labels)
 * 4. Biology (phytoplankton, zooplankton, PFZ fish)
 * 5. Special (isosurface, sea level, depth slice)
 */

import { Globe, Radio, Activity, Navigation, Layers, Fish, Waves, Zap, Eye } from 'lucide-react'
import type { VisibleLayers } from '@/hooks/useDashboardState'

interface LayerControlsProps {
  visibleLayers: VisibleLayers
  onToggle: (layer: keyof VisibleLayers) => void
  onBatchSet?: (partial: Partial<VisibleLayers>) => void
}

interface LayerOption {
  key: keyof VisibleLayers
  label: string
  sublabel: string
  icon: React.ReactNode
  color: string
}

const CORE_LAYERS: LayerOption[] = [
  { key: 'oceanModel',      label: 'Ocean Model',      sublabel: 'SST / Salinity field',  icon: <Globe size={12} />,      color: '#00b4d8' },
  { key: 'depthSlice',      label: 'Depth Slice',      sublabel: 'Horizontal cross-section', icon: <Layers size={12} />,   color: '#38bdf8' },
  { key: 'isosurface',      label: '3D Isosurface',    sublabel: 'Isotherm / Isohaline', icon: <Layers size={12} />,      color: '#c084fc' },
  { key: 'seaLevel',        label: 'Sea Level (SSH)',  sublabel: 'Anomaly overlay (cm)',   icon: <Waves size={12} />,      color: '#60a5fa' },
]

const PLATFORM_LAYERS: LayerOption[] = [
  { key: 'argo',            label: 'Argo Floats',      sublabel: 'Profiling floats',       icon: <Radio size={12} />,      color: '#22d3ee' },
  { key: 'glider',          label: 'Gliders',          sublabel: 'Autonomous gliders',     icon: <Activity size={12} />,   color: '#22d3a0' },
  { key: 'ctd',             label: 'CTD Stations',     sublabel: 'Ship-borne casts',        icon: <Radio size={12} />,      color: '#f59e0b' },
]

const ANIMATED_LAYERS: LayerOption[] = [
  { key: 'currentVectors',    label: 'Current Vectors',    sublabel: 'U/V arrow glyphs',      icon: <Navigation size={12} />, color: '#a78bfa' },
  { key: 'currentStreamlines',label: 'Current Streamlines',sublabel: 'Particle animation',    icon: <Zap size={12} />,        color: '#818cf8' },
  { key: 'valueLabels',       label: 'Value Labels',       sublabel: 'Floating numbers',      icon: <Eye size={12} />,        color: '#34d399' },
]

const BIOLOGY_LAYERS: LayerOption[] = [
  { key: 'phytoplankton',   label: 'Phytoplankton',    sublabel: 'Bloom animation',        icon: <Fish size={12} />,       color: '#4ade80' },
  { key: 'zooplankton',     label: 'Zooplankton',      sublabel: 'Density hotspots',       icon: <Fish size={12} />,       color: '#86efac' },
  { key: 'pfzFish',         label: 'PFZ Fish Zones',   sublabel: 'Fishing zone overlay',   icon: <Fish size={12} />,       color: '#fbbf24' },
]

function LayerSection({ title, layers, visibleLayers, onToggle }: {
  title: string
  layers: LayerOption[]
  visibleLayers: VisibleLayers
  onToggle: (layer: keyof VisibleLayers) => void
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold px-2 pt-3 pb-1.5 border-t border-white/5 first:border-t-0">
        {title}
      </div>
      <div className="px-1 space-y-0.5">
        {layers.map((opt) => {
          const isOn = visibleLayers[opt.key]
          return (
            <button
              key={opt.key}
              onClick={() => onToggle(opt.key)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all group cursor-pointer"
            >
              {/* Custom checkbox */}
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                  isOn ? 'border-transparent' : 'border-slate-600 bg-transparent'
                }`}
                style={isOn ? { background: `${opt.color}44`, borderColor: opt.color } : undefined}
              >
                {isOn && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 4L3 6L7 2" stroke={opt.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {/* Icon */}
              <span className="flex-shrink-0 transition-colors" style={{ color: isOn ? opt.color : '#4a6c8a' }}>
                {opt.icon}
              </span>

              {/* Labels */}
              <div className="min-w-0 text-left">
                <div className={`text-xs leading-tight transition-colors ${isOn ? 'text-slate-200' : 'text-slate-500'}`}>
                  {opt.label}
                </div>
                <div className="text-[10px] text-slate-600">{opt.sublabel}</div>
              </div>

              {/* Active indicator dot */}
              {isOn && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function LayerControls({ visibleLayers, onToggle, onBatchSet }: LayerControlsProps) {
  const activeCount = Object.values(visibleLayers).filter(Boolean).length

  const handleCleanView = () => {
    if (onBatchSet) {
      onBatchSet({
        oceanModel: true,
        argo: false,
        glider: false,
        ctd: false,
        currentVectors: false,
        depthSlice: false,
        isosurface: false,
        valueLabels: false,
        currentStreamlines: false,
        seaLevel: false,
        phytoplankton: false,
        zooplankton: false,
        pfzFish: false,
      })
    }
  }

  const handleSensorsOnly = () => {
    if (onBatchSet) {
      onBatchSet({
        oceanModel: true,
        argo: true,
        glider: true,
        ctd: true,
        currentVectors: false,
        depthSlice: true,
        currentStreamlines: false,
        valueLabels: false,
      })
    }
  }

  const handleCurrentsView = () => {
    if (onBatchSet) {
      onBatchSet({
        oceanModel: true,
        currentVectors: true,
        currentStreamlines: true,
        argo: false,
        glider: false,
        ctd: false,
        valueLabels: false,
      })
    }
  }

  const handleBiologyView = () => {
    if (onBatchSet) {
      onBatchSet({
        oceanModel: true,
        phytoplankton: true,
        zooplankton: true,
        pfzFish: true,
        argo: false,
        glider: false,
        ctd: false,
        currentVectors: false,
        currentStreamlines: false,
        valueLabels: false,
      })
    }
  }

  return (
    <div className="space-y-3">
      {/* Active count badge & Quick Presets Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Visualization Layers</span>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/20">
          {activeCount} active
        </span>
      </div>

      {/* Quick 1-Click Presets */}
      {onBatchSet && (
        <div className="p-2 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
          <div className="text-[9px] uppercase font-mono font-semibold text-slate-400 flex items-center justify-between">
            <span>Quick Presets</span>
            <span className="text-[8px] text-cyan-400">1-Click Filter</span>
          </div>
          <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
            <button
              onClick={handleCleanView}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-left flex items-center gap-1 transition-all cursor-pointer"
              title="Clean ocean model only — zero clutter"
            >
              <span>🌊</span>
              <span>Clean Globe</span>
            </button>
            <button
              onClick={handleSensorsOnly}
              className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-left flex items-center gap-1 transition-all cursor-pointer"
              title="Argo floats, autonomous gliders, CTD stations"
            >
              <span>📡</span>
              <span>In-Situ Nets</span>
            </button>
            <button
              onClick={handleCurrentsView}
              className="px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-left flex items-center gap-1 transition-all cursor-pointer"
              title="Vector arrows and dynamic current particles"
            >
              <span>🌀</span>
              <span>Flow Currents</span>
            </button>
            <button
              onClick={handleBiologyView}
              className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-left flex items-center gap-1 transition-all cursor-pointer"
              title="Phytoplankton, Zooplankton, and PFZ fishing zones"
            >
              <span>🐟</span>
              <span>Ecosystem</span>
            </button>
          </div>
        </div>
      )}

      <LayerSection title="Ocean Model" layers={CORE_LAYERS} visibleLayers={visibleLayers} onToggle={onToggle} />
      <LayerSection title="In-Situ Platforms" layers={PLATFORM_LAYERS} visibleLayers={visibleLayers} onToggle={onToggle} />
      <LayerSection title="Animated Overlays" layers={ANIMATED_LAYERS} visibleLayers={visibleLayers} onToggle={onToggle} />
      <LayerSection title="🐟 Marine Biology" layers={BIOLOGY_LAYERS} visibleLayers={visibleLayers} onToggle={onToggle} />
    </div>
  )
}
