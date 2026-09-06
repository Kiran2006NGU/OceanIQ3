/**
 * GraphBuilder.tsx — Interactive Ocean Data Graph Creation Wizard
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Allows users to:
 * 1. Pick X-axis and Y-axis parameters from ocean variables
 * 2. Choose chart type: Line, Bar, Area, Scatter
 * 3. Preview live chart with Recharts
 * 4. Export chart as PNG or data as Excel/CSV
 */

import { useState, useCallback, useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  BarChart2, TrendingUp, Download, X, RefreshCw,
  ChevronDown, Layers,
} from 'lucide-react'
import type { MockObservation } from '@/services/data/mockOceanData'
import { exportArrayToExcel } from '@/utils/excelExport'

type ChartType = 'line' | 'bar' | 'area' | 'scatter'
type XAxisParam = 'depth' | 'time_index' | 'latitude' | 'longitude'
type YAxisParam = 'temperature' | 'salinity' | 'chlorophyll' | 'current_velocity'

interface GraphBuilderProps {
  observations: MockObservation[]
  onClose: () => void
}

const X_PARAMS: { id: XAxisParam; label: string; unit: string }[] = [
  { id: 'depth', label: 'Depth', unit: 'm' },
  { id: 'latitude', label: 'Latitude', unit: '°N' },
  { id: 'longitude', label: 'Longitude', unit: '°E' },
  { id: 'time_index', label: 'Observation Index', unit: '' },
]

const Y_PARAMS: { id: YAxisParam; label: string; unit: string; color: string }[] = [
  { id: 'temperature', label: 'Temperature', unit: '°C', color: '#ef4444' },
  { id: 'salinity', label: 'Salinity', unit: 'PSU', color: '#3b82f6' },
  { id: 'chlorophyll', label: 'Chlorophyll-a', unit: 'mg/m³', color: '#22c55e' },
  { id: 'current_velocity', label: 'Current Speed', unit: 'm/s', color: '#f59e0b' },
]

const CHART_TYPES: { id: ChartType; label: string; icon: string }[] = [
  { id: 'line', label: 'Line', icon: '📈' },
  { id: 'area', label: 'Area', icon: '🌊' },
  { id: 'bar', label: 'Bar', icon: '📊' },
  { id: 'scatter', label: 'Scatter', icon: '✦' },
]

function getObsValue(obs: MockObservation, param: XAxisParam | YAxisParam): number {
  switch (param) {
    case 'depth': return obs.currentDepth ?? 0
    case 'latitude': return obs.latitude
    case 'longitude': return obs.longitude
    case 'time_index': return 0
    case 'temperature': return obs.temperature ?? 0
    case 'salinity': return obs.salinity ?? 0
    case 'chlorophyll': return obs.chlorophyll ?? 0
    case 'current_velocity': return ((obs as unknown as Record<string, unknown>)['currentSpeed'] as number) ?? 0
    default: return 0
  }
}

const CHART_BG = 'transparent'
const AXIS_COLOR = '#64748b'
const GRID_COLOR = 'rgba(255,255,255,0.06)'

export function GraphBuilder({ observations, onClose }: GraphBuilderProps) {
  const [chartType, setChartType] = useState<ChartType>('line')
  const [xParam, setXParam] = useState<XAxisParam>('depth')
  const [yParam, setYParam] = useState<YAxisParam>('temperature')
  const [maxPoints, setMaxPoints] = useState(50)
  const chartRef = useRef<HTMLDivElement>(null)

  const xDef = X_PARAMS.find((p) => p.id === xParam)!
  const yDef = Y_PARAMS.find((p) => p.id === yParam)!

  // Build chart data
  const chartData = observations
    .slice(0, maxPoints)
    .map((obs, i) => ({
      x: xParam === 'time_index' ? i : getObsValue(obs, xParam),
      y: getObsValue(obs, yParam),
      id: obs.id,
      name: obs.name,
    }))
    .sort((a, b) => a.x - b.x)

  const handleExportExcel = useCallback(() => {
    exportArrayToExcel(
      chartData.map((d) => ({
        [xDef.label + (xDef.unit ? ` (${xDef.unit})` : '')]: d.x,
        [yDef.label + (yDef.unit ? ` (${yDef.unit})` : '')]: d.y,
        'Platform': d.id,
      })),
      `OceanIQ_Graph_${yParam}_vs_${xParam}.xlsx`,
      `${yDef.label} vs ${xDef.label}`,
    )
  }, [chartData, xDef, yDef, xParam, yParam])

  const handleExportPNG = useCallback(() => {
    alert('PNG export: right-click the chart area and select "Save Image" to download as PNG.')
  }, [])

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 8, right: 24, left: 8, bottom: 8 },
    }

    const xAxisEl = (
      <XAxis
        dataKey="x"
        type="number"
        domain={['auto', 'auto']}
        tickFormatter={(v: number) => v.toFixed(1)}
        label={{ value: `${xDef.label}${xDef.unit ? ` (${xDef.unit})` : ''}`, position: 'insideBottom', offset: -4, fill: AXIS_COLOR, fontSize: 11 }}
        tick={{ fill: AXIS_COLOR, fontSize: 10 }}
        stroke={AXIS_COLOR}
      />
    )
    const yAxisEl = (
      <YAxis
        dataKey="y"
        domain={['auto', 'auto']}
        tickFormatter={(v: number) => v.toFixed(2)}
        label={{ value: `${yDef.label}${yDef.unit ? ` (${yDef.unit})` : ''}`, angle: -90, position: 'insideLeft', offset: 12, fill: AXIS_COLOR, fontSize: 11 }}
        tick={{ fill: AXIS_COLOR, fontSize: 10 }}
        stroke={AXIS_COLOR}
        width={72}
      />
    )
    const grid = <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
    const tip = (
      <Tooltip
        contentStyle={{ background: '#0e1726', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 11, fontFamily: 'Calibri' }}
      />
    )

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          {grid}{xAxisEl}{yAxisEl}{tip}
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="y" name={yDef.label} stroke={yDef.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      )
    }
    if (chartType === 'area') {
      return (
        <AreaChart {...commonProps}>
          {grid}{xAxisEl}{yAxisEl}{tip}
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="y" name={yDef.label} stroke={yDef.color} fill={`${yDef.color}30`} strokeWidth={2} dot={false} />
        </AreaChart>
      )
    }
    if (chartType === 'bar') {
      return (
        <BarChart {...commonProps}>
          {grid}{xAxisEl}{yAxisEl}{tip}
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="y" name={yDef.label} fill={yDef.color} radius={[2, 2, 0, 0]} />
        </BarChart>
      )
    }
    // scatter
    return (
      <ScatterChart {...commonProps}>
        {grid}{xAxisEl}{yAxisEl}{tip}
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Scatter data={chartData.map((d) => ({ x: d.x, y: d.y }))} name={yDef.label} fill={yDef.color} />
      </ScatterChart>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-[#0e1726] border border-white/15 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden font-mono">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#030d1a] flex-shrink-0">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-cyan-400" />
            <span className="text-sm font-bold text-white">Graph Builder</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
              {chartData.length} data points
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left: Controls */}
          <div className="w-56 flex-shrink-0 border-r border-white/10 p-4 space-y-5 overflow-y-auto bg-[#030d1a]/60">

            {/* Chart Type */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Chart Type</p>
              <div className="grid grid-cols-2 gap-1.5">
                {CHART_TYPES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setChartType(c.id)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      chartType === c.id
                        ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                        : 'bg-white/3 border-white/8 text-slate-400 hover:bg-white/8'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* X Axis */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">X Axis</p>
              <div className="space-y-1">
                {X_PARAMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setXParam(p.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] border transition-all cursor-pointer ${
                      xParam === p.id
                        ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 font-bold'
                        : 'bg-white/3 border-white/8 text-slate-400 hover:bg-white/8'
                    }`}
                  >
                    {p.label} {p.unit && <span className="text-slate-500">({p.unit})</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Y Axis */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Y Axis</p>
              <div className="space-y-1">
                {Y_PARAMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setYParam(p.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] border transition-all cursor-pointer flex items-center gap-2 ${
                      yParam === p.id
                        ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 font-bold'
                        : 'bg-white/3 border-white/8 text-slate-400 hover:bg-white/8'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Points */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                Max Points: <span className="text-cyan-300">{maxPoints}</span>
              </p>
              <input
                type="range"
                min={10}
                max={Math.min(observations.length, 200)}
                value={maxPoints}
                onChange={(e) => setMaxPoints(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                <span>10</span>
                <span>{Math.min(observations.length, 200)}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-1 text-[10px]">
              <p className="text-slate-400 font-bold uppercase mb-1.5 flex items-center gap-1">
                <TrendingUp size={11} /> Stats
              </p>
              {chartData.length > 0 && (() => {
                const vals = chartData.map((d) => d.y)
                const mean = vals.reduce((s, v) => s + v, 0) / vals.length
                return (
                  <>
                    <div className="flex justify-between"><span className="text-slate-400">Min</span><span className="text-cyan-200">{Math.min(...vals).toFixed(3)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Max</span><span className="text-cyan-200">{Math.max(...vals).toFixed(3)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Mean</span><span className="text-cyan-200">{mean.toFixed(3)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">N</span><span className="text-cyan-200">{vals.length}</span></div>
                  </>
                )
              })()}
            </div>
          </div>

          {/* Right: Chart */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chart title */}
            <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-slate-300 font-bold">
                {yDef.label} ({yDef.unit}) vs {xDef.label} ({xDef.unit})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold transition-all cursor-pointer"
                  title="Export chart data to Excel"
                >
                  <Download size={12} />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => setChartType((t) => CHART_TYPES[(CHART_TYPES.findIndex((c) => c.id === t) + 1) % CHART_TYPES.length].id as ChartType)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-[11px] transition-all cursor-pointer"
                  title="Cycle chart type"
                >
                  <RefreshCw size={11} />
                </button>
              </div>
            </div>

            {/* Chart area */}
            <div ref={chartRef} className="flex-1 p-4 min-h-0" style={{ background: CHART_BG }}>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                  <div className="text-center">
                    <Layers size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No data available for selected parameters</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              )}
            </div>

            {/* Footer info */}
            <div className="px-4 py-2 border-t border-white/5 text-[10px] text-slate-500 flex items-center gap-3 flex-shrink-0">
              <ChevronDown size={10} />
              <span>Source: OceanIQ Platform — INCOIS / SIH 26067</span>
              <span className="ml-auto">{new Date().toLocaleDateString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
