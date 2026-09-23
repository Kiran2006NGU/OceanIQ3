/**
 * CompassRose.tsx — 4-Point Scientific Compass Rose & Reset North HUD
 * Inspired by reference design: 01_ocean_vision_3d_dashboard.png
 */

import React from 'react'
import { Navigation } from 'lucide-react'

interface CompassRoseProps {
  onResetNorth: () => void
  heading?: number // in degrees, default 0
}

export const CompassRose: React.FC<CompassRoseProps> = ({ onResetNorth, heading = 0 }) => {
  return (
    <button
      onClick={onResetNorth}
      title="Reset View to True North (N)"
      className="group relative flex flex-col items-center justify-center w-12 h-12 rounded-full bg-[#030d1a]/85 backdrop-blur-md border border-cyan-500/30 hover:border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.15)] hover:shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all cursor-pointer select-none"
    >
      {/* Outer Dial Ring */}
      <div
        className="relative w-9 h-9 flex items-center justify-center transition-transform duration-500"
        style={{ transform: `rotate(${-heading}deg)` }}
      >
        {/* Cardinal Markers */}
        <span className="absolute -top-1 text-[8px] font-mono font-bold text-cyan-400 tracking-wider">
          N
        </span>
        <span className="absolute -bottom-1 text-[7px] font-mono text-slate-500">
          S
        </span>
        <span className="absolute -right-1 text-[7px] font-mono text-slate-500">
          E
        </span>
        <span className="absolute -left-1 text-[7px] font-mono text-slate-500">
          W
        </span>

        {/* Dynamic Dual Needle */}
        <div className="relative w-4 h-4 flex items-center justify-center">
          <Navigation
            size={16}
            className="text-cyan-400 fill-cyan-400/80 group-hover:scale-110 transition-transform drop-shadow-[0_0_4px_#00f0ff]"
          />
        </div>
      </div>
      <span className="absolute -bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-mono font-bold text-cyan-300 bg-black/90 px-1 rounded border border-cyan-500/30 pointer-events-none whitespace-nowrap">
        RESET NORTH
      </span>
    </button>
  )
}
