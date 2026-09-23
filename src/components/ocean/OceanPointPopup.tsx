/**
 * OceanPointPopup — Sprint 2.4: Click-Anywhere Ocean Intelligence
 * Shows lat/lon, surface value, nearest Argo float, and anomaly status
 * when the user clicks anywhere on the ocean globe.
 * SIH 26067 | OceanIQ Platform
 */

import { useMemo } from 'react'
import { X, Compass, Radio, ZoomIn } from 'lucide-react'
import type { OceanVariable } from '@/types/ocean'
import { VARIABLE_COLOR_CONFIGS, valueToCSSColor } from '@/utils/oceanColorScale'
import { getOceanValue, type MockObservation } from '@/services/data/mockOceanData'

interface OceanPointPopupProps {
  lat: number
  lon: number
  depth: number
  variable: OceanVariable
  timeIndex: number
  observations: MockObservation[]
  screenX: number
  screenY: number
  onClose: () => void
  onOpenDepthInspector: () => void
  onSelectObservation: (id: string) => void
  onOpenPlaceEcosystem?: () => void
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function OceanPointPopup({
  lat, lon, depth, variable, timeIndex,
  observations, screenX, screenY,
  onClose, onOpenDepthInspector, onSelectObservation,
  onOpenPlaceEcosystem,
}: OceanPointPopupProps) {
  const cfg = VARIABLE_COLOR_CONFIGS[variable]

  const value = useMemo(
    () => getOceanValue(lat, lon, depth, variable, timeIndex),
    [variable, lat, lon, depth, timeIndex]
  )

  const nearestObs = useMemo(() => {
    if (!observations.length) return null
    let best = observations[0]
    let bestDist = haversineKm(lat, lon, best.latitude, best.longitude)
    for (const o of observations.slice(1)) {
      const d = haversineKm(lat, lon, o.latitude, o.longitude)
      if (d < bestDist) { best = o; bestDist = d }
    }
    return { obs: best, distKm: Math.round(bestDist) }
  }, [lat, lon, observations])

  const valueColor = useMemo(
    () => value !== null ? valueToCSSColor(value, variable) : '#64748b',
    [value, variable]
  )

  // Smart popup positioning — stay within viewport
  const left = Math.min(screenX + 12, window.innerWidth - 280)
  const top  = Math.min(screenY - 12, window.innerHeight - 300)

  const anomalyStatus = useMemo(() => {
    if (value === null) return null
    const mid = (cfg.max + cfg.min) / 2
    const range = cfg.max - cfg.min
    const deviation = Math.abs(value - mid) / range
    if (deviation > 0.42) return { label: 'Anomalous', color: 'text-red-400', bg: 'bg-red-500/15' }
    if (deviation > 0.28) return { label: 'Elevated', color: 'text-amber-400', bg: 'bg-amber-500/15' }
    return { label: 'Normal', color: 'text-emerald-400', bg: 'bg-emerald-500/15' }
  }, [value, cfg])

  return (
    <div
      className="fixed z-50 w-64 rounded-xl bg-[#030d1a]/97 backdrop-blur-md border border-white/15 shadow-2xl overflow-hidden pointer-events-auto animate-fade-in"
      style={{ left, top }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 bg-[#020810]">
        <div className="flex items-center gap-2">
          <Compass size={13} className="text-cyan-400" />
          <span className="text-[11px] font-mono font-bold text-slate-200">Ocean Intelligence</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={13} />
        </button>
      </div>

      <div className="p-3 space-y-3">

        {/* Coordinates */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-slate-500">📍</span>
          <span className="text-cyan-300">{lat.toFixed(3)}°{lat >= 0 ? 'N' : 'S'}</span>
          <span className="text-slate-600">·</span>
          <span className="text-cyan-300">{lon.toFixed(3)}°{lon >= 0 ? 'E' : 'W'}</span>
          <span className="text-slate-600 ml-auto">{depth}m depth</span>
        </div>

        {/* Variable Value */}
        <div className="rounded-lg p-2.5 bg-[#020b16] border border-white/8">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-slate-400">{cfg.label}</span>
            {anomalyStatus && (
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${anomalyStatus.bg} ${anomalyStatus.color}`}>
                {anomalyStatus.label}
              </span>
            )}
          </div>
          {value !== null ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono" style={{ color: valueColor }}>
                {Math.abs(value) < 10 ? value.toFixed(2) : value.toFixed(1)}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{cfg.unit}</span>
            </div>
          ) : (
            <span className="text-slate-500 text-[11px] font-mono">No data at this location</span>
          )}

          {/* Mini value bar */}
          {value !== null && (
            <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-white/5">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(2, Math.min(100, ((value - cfg.min) / (cfg.max - cfg.min)) * 100))}%`,
                  background: valueColor
                }}
              />
            </div>
          )}
        </div>

        {/* Nearest Sensor */}
        {nearestObs && (
          <div className="rounded-lg p-2.5 bg-[#020b16] border border-white/8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Radio size={11} className="text-cyan-400" />
                <span className="text-[10px] font-mono text-slate-400">Nearest Sensor</span>
              </div>
              <span className="text-[9px] font-mono text-slate-600">{nearestObs.distKm} km away</span>
            </div>
            <button
              onClick={() => { onSelectObservation(nearestObs.obs.id); onClose() }}
              className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono font-semibold text-cyan-300 hover:text-cyan-200 transition-colors group"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                nearestObs.obs.type === 'argo' ? 'bg-cyan-400' :
                nearestObs.obs.type === 'glider' ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              {nearestObs.obs.id}
              <span className="text-slate-600 text-[9px] normal-case">({nearestObs.obs.type})</span>
              <span className="ml-auto text-[9px] text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">View profile →</span>
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-1.5">
          {onOpenPlaceEcosystem && (
            <button
              onClick={() => {
                onOpenPlaceEcosystem()
                onClose()
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black text-[11px] font-mono font-bold shadow-lg transition-all cursor-pointer"
            >
              <span>🐠</span>
              <span>Place Ecosystem Isolation View</span>
            </button>
          )}

          <a
            href={`/depth-view?lat=${lat}&lon=${lon}&variable=${variable}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-[10px] font-mono font-bold transition-all cursor-pointer"
          >
            <span className="text-xs font-black">+</span>
            <span>3D Volumetric Depth View ↗</span>
          </a>
          <div className="flex gap-1.5">
            <button
              onClick={() => { onOpenDepthInspector(); onClose() }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[10px] font-mono transition-all cursor-pointer"
            >
              <ZoomIn size={12} />
              Quick Telemetry
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-[10px] font-mono transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
