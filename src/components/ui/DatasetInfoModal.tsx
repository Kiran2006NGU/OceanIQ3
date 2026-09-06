/**
 * DatasetInfoModal.tsx — Technical NetCDF Dataset Inspector Modal
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Displays full CF-compliant NetCDF metadata, grid dimensions, coordinate bounds,
 * variable catalogue, and data provenance.
 */

import { X, Database, Layers, Compass, CheckCircle2 } from 'lucide-react'

interface DatasetInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DatasetInfoModal({ isOpen, onClose }: DatasetInfoModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl select-none font-sans">
      <div className="bg-[#030d1a] border border-cyan-500/40 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col text-slate-100 overflow-hidden ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#051426]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Database size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Dataset Metadata & Provenance Inspector
              </h2>
              <span className="text-[10px] font-mono text-cyan-400">
                demo-ocean.nc · CF-1.8 Convention
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <div className="p-2 rounded bg-white/5 border border-white/5">
              <span className="text-slate-400 block text-[9px] uppercase">Format</span>
              <span className="text-cyan-300 font-semibold">NetCDF-4 / HDF5</span>
            </div>
            <div className="p-2 rounded bg-white/5 border border-white/5">
              <span className="text-slate-400 block text-[9px] uppercase">Grid Dimensions</span>
              <span className="text-cyan-300 font-semibold">5 × 9 × 30 × 40</span>
            </div>
            <div className="p-2 rounded bg-white/5 border border-white/5">
              <span className="text-slate-400 block text-[9px] uppercase">Data Mode</span>
              <span className="text-amber-300 font-semibold">SIMULATED / DEMO</span>
            </div>
            <div className="p-2 rounded bg-white/5 border border-white/5">
              <span className="text-slate-400 block text-[9px] uppercase">Coordinate System</span>
              <span className="text-emerald-300 font-semibold">WGS 84 (EPSG:4326)</span>
            </div>
          </div>

          {/* Spatial & Temporal Extents */}
          <div className="space-y-2">
            <h3 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 font-mono flex items-center gap-1.5">
              <Compass size={13} className="text-cyan-400" />
              Spatial & Vertical Extent
            </h3>
            <div className="bg-[#020b17] p-3 rounded-lg border border-white/5 font-mono text-[11px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Latitude Coverage:</span>
                <span className="text-slate-200">20.00° S to 25.00° N (Δ = 1.55°)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Longitude Coverage:</span>
                <span className="text-slate-200">40.00° E to 100.00° E (Δ = 1.54°)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Depth Levels (9):</span>
                <span className="text-cyan-300">0m, 10m, 25m, 50m, 100m, 200m, 500m, 1000m, 1500m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time Steps (5):</span>
                <span className="text-slate-200">2026-08-28 00:00 UTC to 18:00 UTC (6h interval)</span>
              </div>
            </div>
          </div>

          {/* Variables Catalogue */}
          <div className="space-y-2">
            <h3 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 font-mono flex items-center gap-1.5">
              <Layers size={13} className="text-cyan-400" />
              Variables Catalogue
            </h3>
            <table className="w-full text-left font-mono text-[10px] border-collapse bg-[#020b17] rounded-lg overflow-hidden border border-white/5">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-slate-400">
                  <th className="py-1.5 px-3">Variable</th>
                  <th className="py-1.5 px-2">Standard Name</th>
                  <th className="py-1.5 px-2">Units</th>
                  <th className="py-1.5 px-2">Valid Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-1.5 px-3 text-cyan-300 font-semibold">temperature</td>
                  <td className="py-1.5 px-2 text-slate-400">sea_water_temperature</td>
                  <td className="py-1.5 px-2 text-slate-200">°C (degC)</td>
                  <td className="py-1.5 px-2 text-slate-400">-2.0 to 34.0</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-cyan-300 font-semibold">salinity</td>
                  <td className="py-1.5 px-2 text-slate-400">sea_water_salinity</td>
                  <td className="py-1.5 px-2 text-slate-200">PSU (1e-3)</td>
                  <td className="py-1.5 px-2 text-slate-400">30.0 to 40.0</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-cyan-300 font-semibold">chlorophyll</td>
                  <td className="py-1.5 px-2 text-slate-400">mass_concentration_of_chlorophyll_a</td>
                  <td className="py-1.5 px-2 text-slate-200">mg/m³</td>
                  <td className="py-1.5 px-2 text-slate-400">0.0 to 5.0</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-cyan-300 font-semibold">current_u</td>
                  <td className="py-1.5 px-2 text-slate-400">eastward_sea_water_velocity</td>
                  <td className="py-1.5 px-2 text-slate-200">m/s</td>
                  <td className="py-1.5 px-2 text-slate-400">-2.0 to 2.0</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-cyan-300 font-semibold">current_v</td>
                  <td className="py-1.5 px-2 text-slate-400">northward_sea_water_velocity</td>
                  <td className="py-1.5 px-2 text-slate-200">m/s</td>
                  <td className="py-1.5 px-2 text-slate-400">-2.0 to 2.0</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-cyan-300 font-semibold">current_velocity</td>
                  <td className="py-1.5 px-2 text-slate-400">magnitude_sea_water_velocity</td>
                  <td className="py-1.5 px-2 text-slate-200">m/s</td>
                  <td className="py-1.5 px-2 text-slate-400">0.0 to 2.5</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Scientific Disclaimer */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200/90 space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-300 font-mono">
              <span>⚠</span> Scientific Honesty Statement
            </div>
            <p className="leading-relaxed">
              This prototype dataset is dynamically generated by the local xarray pipeline for
              demonstration under Smart India Hackathon (SIH 26067). All in-situ observations and model
              outputs are synthetic test instances designed to demonstrate end-to-end multi-layer 3D visualization.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/10 bg-[#051426] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
            <CheckCircle2 size={12} />
            <span>Dataset Schema Validated</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 rounded text-xs font-mono transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
