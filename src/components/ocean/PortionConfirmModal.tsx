/**
 * PortionConfirmModal.tsx — Portion Confirmation & 3D Depth View Launcher
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */

import { useState } from 'react'
import {
  Layers,
  ExternalLink,
  RotateCcw,
  Sliders,
  Check,
  Compass,
  Thermometer,
  Waves,
  Droplets,
  X,
} from 'lucide-react'
import type { SelectedPortionBounds } from './PortionSelectionOverlay'
import type { OceanVariable } from '@/types/ocean'

interface PortionConfirmModalProps {
  bounds: SelectedPortionBounds
  initialVariable: OceanVariable
  onClose: () => void
  onRedraw: () => void
}

export function PortionConfirmModal({
  bounds,
  initialVariable = 'temperature',
  onClose,
  onRedraw,
}: PortionConfirmModalProps) {
  const [variable, setVariable] = useState<OceanVariable>(initialVariable)
  const [maxDepth, setMaxDepth] = useState<number>(1500)
  const [portionTitle, setPortionTitle] = useState<string>(() => {
    if (bounds.centerLon > 78 && bounds.centerLat > 5) return 'Bay of Bengal Portion'
    if (bounds.centerLon <= 78 && bounds.centerLat > 5) return 'Arabian Sea Portion'
    if (bounds.centerLat <= 5) return 'Equatorial Indian Ocean Portion'
    return 'Custom Ocean Portion'
  })

  const depthViewUrl = `/depth-view?minLat=${bounds.minLat}&maxLat=${bounds.maxLat}&minLon=${bounds.minLon}&maxLon=${bounds.maxLon}&lat=${bounds.centerLat}&lon=${bounds.centerLon}&variable=${variable}&maxDepth=${maxDepth}&region=${encodeURIComponent(portionTitle)}`

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-mono text-xs select-none">
      <div className="bg-[#050e1c] border border-cyan-400/60 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 text-slate-100 ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/50 shadow-inner">
              <Layers size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">4-Sided Ocean Portion Selected</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ready to extrude into 3D Volumetric Depth Workstation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Coordinates Summary */}
        <div className="p-4 rounded-xl bg-[#020712]/90 border border-white/15 space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Extrusion Geometry</span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40">
              {bounds.widthKm} km × {bounds.heightKm} km
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 pt-1">
            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-0.5">Latitude Span</span>
              <strong className="text-white text-xs">{bounds.minLat}°N to {bounds.maxLat}°N</strong>
            </div>
            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-0.5">Longitude Span</span>
              <strong className="text-white text-xs">{bounds.minLon}°E to {bounds.maxLon}°E</strong>
            </div>
          </div>
        </div>

        {/* Parameters */}
        <div className="space-y-4">
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-300 block mb-2 tracking-wide">
              Ocean Parameter to View in 3D
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'temperature' as OceanVariable, label: 'Temperature', icon: '🌡️', desc: '°C Mixed Layer & Thermocline' },
                { id: 'salinity' as OceanVariable, label: 'Salinity', icon: '🧂', desc: 'PSU Halocline & Barrier' },
                { id: 'current_velocity' as OceanVariable, label: 'Current Velocity', icon: '🌊', desc: 'm/s 3D Streamlines' },
                { id: 'chlorophyll' as OceanVariable, label: 'Chlorophyll-a', icon: '🌿', desc: 'mg/m³ Photic Bloom' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVariable(v.id)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                    variable === v.id
                      ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 font-bold ring-1 ring-cyan-400/50'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span>{v.icon}</span>
                    <span>{v.label}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-normal">{v.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="text-slate-300 font-bold">Volumetric Column Depth</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40">
                0m – {maxDepth}m
              </span>
            </div>
            <input
              type="range"
              min={200}
              max={2500}
              step={100}
              value={maxDepth}
              onChange={(e) => setMaxDepth(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1">
              <span>200m (Shallow)</span>
              <span>1000m (Thermocline)</span>
              <span>2500m (Abyssal)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
          <button
            onClick={onRedraw}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-slate-300 hover:text-white transition-all cursor-pointer font-semibold"
          >
            <RotateCcw size={14} />
            <span>Redraw Portion</span>
          </button>

          <a
            href={depthViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/40 transition-all cursor-pointer text-xs uppercase tracking-wide hover:scale-[1.02]"
          >
            <span>Open 3D Depth View ↗</span>
            <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </div>
  )
}
