/**
 * VariableControl.tsx — Professional Scientific Oceanographic Variable Selector
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Categorized by domain:
 * 1. Hydrography (Temperature, Salinity)
 * 2. Biogeochemistry (Chlorophyll-a)
 * 3. Currents & Circulation (U, V, Velocity magnitude)
 */

import { Thermometer, Droplets, Leaf, Compass, Activity } from 'lucide-react'
import type { OceanVariable } from '@/types/ocean'

interface VariableControlProps {
  selectedVariable: OceanVariable
  onChange: (v: OceanVariable) => void
}

interface VariableOption {
  id: OceanVariable
  label: string
  unit: string
  range: string
  icon: React.ReactNode
  color: string
}

const CATEGORIES: {
  title: string
  variables: VariableOption[]
}[] = [
  {
    title: 'Hydrography',
    variables: [
      {
        id: 'temperature',
        label: 'Sea Water Temperature',
        unit: '°C',
        range: '−2.0 – 34.0 °C',
        icon: <Thermometer size={13} />,
        color: '#f97316',
      },
      {
        id: 'salinity',
        label: 'Practical Salinity',
        unit: 'PSU',
        range: '30.0 – 40.0 PSU',
        icon: <Droplets size={13} />,
        color: '#06b6d4',
      },
    ],
  },
  {
    title: 'Biogeochemistry',
    variables: [
      {
        id: 'chlorophyll',
        label: 'Chlorophyll-a',
        unit: 'mg/m³',
        range: '0.0 – 5.0 mg/m³',
        icon: <Leaf size={13} />,
        color: '#10b981',
      },
    ],
  },
  {
    title: 'Currents & Circulation',
    variables: [
      {
        id: 'current_velocity',
        label: 'Velocity Magnitude (V)',
        unit: 'm/s',
        range: '0.0 – 2.5 m/s',
        icon: <Activity size={13} />,
        color: '#38bdf8',
      },
      {
        id: 'current_u',
        label: 'Zonal Current (U, East↑)',
        unit: 'm/s',
        range: '−2.0 – 2.0 m/s',
        icon: <Compass size={13} />,
        color: '#a855f7',
      },
      {
        id: 'current_v',
        label: 'Meridional Current (V, North↑)',
        unit: 'm/s',
        range: '−2.0 – 2.0 m/s',
        icon: <Compass size={13} />,
        color: '#818cf8',
      },
    ],
  },
  {
    title: 'Altimetry & Sea Level',
    variables: [
      {
        id: 'sea_level',
        label: 'Sea Surface Height Anomaly (SSHA)',
        unit: 'cm',
        range: '−30.0 – 30.0 cm',
        icon: <Compass size={13} />,
        color: '#0ea5e9',
      },
    ],
  },
]

export function VariableControl({ selectedVariable, onChange }: VariableControlProps) {
  return (
    <div className="space-y-3 font-sans text-xs">
      {CATEGORIES.map((cat) => (
        <div key={cat.title} className="space-y-1">
          <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-semibold px-2">
            {cat.title}
          </div>
          <div className="space-y-0.5">
            {cat.variables.map((opt) => {
              const isActive = selectedVariable === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => onChange(opt.id)}
                  className={[
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors border',
                    isActive
                      ? 'bg-cyan-950/50 border-cyan-500/40 text-white shadow-sm'
                      : 'bg-white/2 border-transparent text-slate-300 hover:bg-white/5 hover:text-white',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        color: opt.color,
                        background: `${opt.color}18`,
                      }}
                    >
                      {opt.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium truncate leading-tight">
                        {opt.label}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">
                        {opt.range}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: opt.color }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
