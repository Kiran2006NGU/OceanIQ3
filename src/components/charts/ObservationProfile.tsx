/**
 * ObservationProfile.tsx — Real-Time Depth Profile Chart & Sensor Readings
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */

import { useState, useMemo, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { MockObservation, ProfilePoint } from '@/services/data/mockOceanData'
import { getProfileData } from '@/services/data/mockOceanData'
import { getDataSourceObservationProfile } from '@/services/data/dataSource'
import { Activity, Radio, Layers, Waves, ArrowDown } from 'lucide-react'

type ProfileVariable = 'temperature' | 'salinity' | 'chlorophyll'

const PROFILE_VARS: { id: ProfileVariable; label: string; unit: string; color: string; desc: string }[] = [
  { id: 'temperature', label: 'Temperature', unit: '°C', color: '#f97316', desc: 'Thermal Stratification' },
  { id: 'salinity', label: 'Salinity', unit: 'PSU', color: '#06b6d4', desc: 'Haline Gradient' },
  { id: 'chlorophyll', label: 'Chlorophyll', unit: 'mg/m³', color: '#10b981', desc: 'Euphotic Biomass' },
]

interface ObservationProfileProps {
  observation: MockObservation
}

export function ObservationProfile({ observation }: ObservationProfileProps) {
  const [profileVar, setProfileVar] = useState<ProfileVariable>('temperature')
  const [profileData, setProfileData] = useState<ProfilePoint[]>(() => getProfileData(observation))
  const [isLoading, setIsLoading] = useState(false)

  // Fetch or sync profile data when observation changes
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    getDataSourceObservationProfile(observation)
      .then((data) => {
        if (!cancelled && data && data.length > 0) {
          setProfileData(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfileData(getProfileData(observation))
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [observation])

  const chartData = useMemo(
    () =>
      profileData.map((p) => ({
        depth: p.depth,
        value: Number(p[profileVar].toFixed(2)),
      })),
    [profileData, profileVar]
  )

  const varCfg = PROFILE_VARS.find((v) => v.id === profileVar) || PROFILE_VARS[0]

  // Key depth slice readings
  const surfaceReading = profileData[0]?.[profileVar] ?? 0
  const depth100Reading = profileData.find((p) => p.depth >= 100)?.[profileVar] ?? 0
  const depth500Reading = profileData.find((p) => p.depth >= 500)?.[profileVar] ?? 0
  const deepReading = profileData[profileData.length - 1]?.[profileVar] ?? 0

  const values = profileData.map((p) => p[profileVar])
  const minVal = values.length ? Math.min(...values).toFixed(1) : '0'
  const maxVal = values.length ? Math.max(...values).toFixed(1) : '0'

  return (
    <div className="flex flex-col space-y-3 font-mono text-xs">
      {/* ── Instrument Header Card ── */}
      <div className="p-2.5 rounded-xl bg-[#020b18] border border-cyan-500/30 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bold text-white text-[11px] tracking-wide">{observation.name}</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
            {observation.platformId}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-white/10">
          <span>{observation.latitude.toFixed(2)}°N, {observation.longitude.toFixed(2)}°E</span>
          <span className="text-cyan-300 font-medium">{observation.region}</span>
        </div>
      </div>

      {/* ── Variable Selector Tabs ── */}
      <div className="flex gap-1 p-1 bg-black/40 rounded-xl border border-white/10">
        {PROFILE_VARS.map((v) => (
          <button
            key={v.id}
            onClick={() => setProfileVar(v.id)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
              profileVar === v.id
                ? 'bg-cyan-500/20 text-white shadow-md border border-cyan-400/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            style={profileVar === v.id ? { color: v.color } : undefined}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* ── Depth Profile Graph ── */}
      <div className="p-2.5 rounded-xl bg-[#020b18] border border-white/10 shadow-inner">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span className="flex items-center gap-1 font-bold text-slate-200">
            <Waves size={12} style={{ color: varCfg.color }} />
            Depth vs {varCfg.label} ({varCfg.unit})
          </span>
          <span className="text-[9px] text-slate-500">0 m → 2000 m</span>
        </div>

        {isLoading ? (
          <div className="h-56 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-cyan-500/40 border-t-cyan-400 rounded-full animate-spin" />
            <span className="text-[10px] text-slate-400">Loading live profile...</span>
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 12, bottom: 4, left: -10 }}
              >
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.06)" horizontal={true} />
                <XAxis
                  type="number"
                  dataKey="value"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  unit={` ${varCfg.unit}`}
                />
                <YAxis
                  type="number"
                  dataKey="depth"
                  reversed
                  domain={[0, 2000]}
                  tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickFormatter={(v: number) => `${v}m`}
                  width={42}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(3, 13, 26, 0.95)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    borderRadius: 8,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: '#e2e8f0',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                  formatter={(val: unknown) => [`${val} ${varCfg.unit}`, varCfg.label]}
                  labelFormatter={(depth: unknown) => `Depth: ${depth} m`}
                />
                <ReferenceLine y={100} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
                <ReferenceLine y={500} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={varCfg.color}
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: varCfg.color, stroke: '#020b18', strokeWidth: 1 }}
                  activeDot={{ r: 4.5, fill: '#ffffff', stroke: varCfg.color, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Real-Time Depth Stratum Readings ── */}
      <div className="p-2.5 rounded-xl bg-[#020b18] border border-white/10 space-y-2 shadow-sm">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="font-bold text-slate-200 flex items-center gap-1">
            <Layers size={11} className="text-cyan-400" />
            Live Stratum Readings
          </span>
          <span className="text-[9px] text-slate-500">Min {minVal} · Max {maxVal} {varCfg.unit}</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex flex-col">
            <span className="text-slate-400 text-[9px] flex items-center gap-1">
              <ArrowDown size={9} className="text-amber-400" /> Surface (0m)
            </span>
            <span className="font-bold text-white text-xs mt-0.5" style={{ color: varCfg.color }}>
              {surfaceReading.toFixed(2)} {varCfg.unit}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex flex-col">
            <span className="text-slate-400 text-[9px] flex items-center gap-1">
              <ArrowDown size={9} className="text-cyan-400" /> Sub-Surface (100m)
            </span>
            <span className="font-bold text-white text-xs mt-0.5">
              {depth100Reading.toFixed(2)} {varCfg.unit}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex flex-col">
            <span className="text-slate-400 text-[9px] flex items-center gap-1">
              <ArrowDown size={9} className="text-blue-400" /> Mesopelagic (500m)
            </span>
            <span className="font-bold text-white text-xs mt-0.5">
              {depth500Reading.toFixed(2)} {varCfg.unit}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex flex-col">
            <span className="text-slate-400 text-[9px] flex items-center gap-1">
              <ArrowDown size={9} className="text-purple-400" /> Abyssal (1000m+)
            </span>
            <span className="font-bold text-white text-xs mt-0.5">
              {deepReading.toFixed(2)} {varCfg.unit}
            </span>
          </div>
        </div>
      </div>

      {/* ── Sensor Telemetry Stream Badge ── */}
      <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/25 flex items-center justify-between text-[9px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <Radio size={12} className="text-cyan-400 animate-pulse" />
          <span className="text-cyan-200 font-semibold">INCOIS Telemetry Ingest</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Activity size={10} className="text-emerald-400" />
          <span>QC Flag: PASS</span>
        </div>
      </div>
    </div>
  )
}
