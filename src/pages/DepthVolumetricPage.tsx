/**
 * DepthVolumetricPage.tsx — 3D Volumetric Water Column & Depth View Workstation
 * Route: /depth-view and /depth-inspector
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Full 3D Volumetric Digital Twin:
 * • Top Center: "Calm Water Level Data Visualization." + Prominent "+" Portion Selector
 * • Central 3D Volumetric Water-Column Block floating over studio plane with OrbitControls
 * • Bottom-Left Stacked Scientific Colormaps (Temperature, Velocity Magnitude, Salinity)
 * • Right Control Panel: "Unified Oceanographic Data Analysis" with full animated 3D layer toggles:
 *   - 🌊 Subsurface Currents & Dynamic Streamlines
 *   - 🌡️ Stratified Thermocline & Interactive Slicing Probe
 *   - 🛰️ In-Situ Devices (Argo 2,000m Dive Tubes, Autonomous Glider Sawtooth Path, Moored CTD)
 *   - 🐟 Biological Living Ocean (Phytoplankton Bloom & PFZ Pelagic Fish Shoals)
 *   - 📐 Depth Axis Graduation Ruler (0m to 2,000m)
 *   - ⏱️ Flow Speed & Planetary Rotation
 * • Interactive In-Situ Device Inspection on Hover & Click with live telemetry cards
 */

import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {
  Plus,
  Play,
  Pause,
  ArrowLeft,
  Check,
  X,
  Thermometer,
  Waves,
  Droplets,
  Globe,
  Radio,
  Fish,
  Activity,
  Layers,
  Download,
  Info,
  ExternalLink,
  Compass,
} from 'lucide-react'
import type { OceanVariable } from '@/types/ocean'
import { CalmWaterVolumetricBlock, type InSituTelemetryData } from '@/components/ocean/CalmWaterVolumetricBlock'

interface PortionPreset {
  id: string
  name: string
  lat: number
  lon: number
  defaultVariable: OceanVariable
  depthRange: string
  description: string
}

const PORTION_PRESETS: PortionPreset[] = [
  {
    id: 'bob',
    name: 'Bay of Bengal (Central Basin)',
    lat: 14.5,
    lon: 87.5,
    defaultVariable: 'temperature',
    depthRange: '0 - 1500m',
    description: 'Monsoon freshwater barrier layer, cyclone heat potential, and steep thermocline stratification.',
  },
  {
    id: 'as',
    name: 'Arabian Sea (Somali Upwelling)',
    lat: 15.2,
    lon: 64.8,
    defaultVariable: 'current_velocity',
    depthRange: '0 - 2000m',
    description: 'High-salinity water mass, intense wind-driven upwelling, and sub-surface oxygen minimum zone.',
  },
  {
    id: 'eio',
    name: 'Equatorial Indian Ocean',
    lat: 0.0,
    lon: 80.0,
    defaultVariable: 'temperature',
    depthRange: '0 - 1800m',
    description: 'Indo-Pacific warm pool core, semi-annual Wyrtki jet velocity, and equatorial undercurrent.',
  },
  {
    id: 'lak',
    name: 'Lakshadweep / Maldives Ridge',
    lat: 10.0,
    lon: 72.5,
    defaultVariable: 'salinity',
    depthRange: '0 - 1200m',
    description: 'Coral atoll thermal stress zone, mini-warm pool eddy dynamics, and halocline barrier.',
  },
  {
    id: 'and',
    name: 'Andaman Sea Basin',
    lat: 10.5,
    lon: 94.2,
    defaultVariable: 'chlorophyll',
    depthRange: '0 - 1600m',
    description: 'High-amplitude internal solitary waves, deep pycnocline displacement, and nutrient up-thrust.',
  },
]

export function DepthVolumetricPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // URL / Initial state
  const minLatParam = searchParams.get('minLat')
  const maxLatParam = searchParams.get('maxLat')
  const minLonParam = searchParams.get('minLon')
  const maxLonParam = searchParams.get('maxLon')
  const maxDepthParam = searchParams.get('maxDepth')

  const initialRegion = searchParams.get('region') || (minLatParam ? '4-Sided Portion' : 'Bay of Bengal (Central Basin)')
  const initialVar = (searchParams.get('variable') as OceanVariable) || 'temperature'
  const initialLat = parseFloat(searchParams.get('lat') || (minLatParam && maxLatParam ? String((+minLatParam + +maxLatParam) / 2) : '14.5'))
  const initialLon = parseFloat(searchParams.get('lon') || (minLonParam && maxLonParam ? String((+minLonParam + +maxLonParam) / 2) : '87.5'))
  const initialMaxDepth = maxDepthParam ? parseInt(maxDepthParam, 10) : 2000

  // Portion State
  const [portionName, setPortionName] = useState(initialRegion)
  const [lat, setLat] = useState(initialLat)
  const [lon, setLon] = useState(initialLon)
  const [maxDepth, setMaxDepth] = useState(initialMaxDepth)
  const [isPortionModalOpen, setIsPortionModalOpen] = useState(false)

  // In-Situ Device Interactive Inspection State
  const [selectedDevice, setSelectedDevice] = useState<InSituTelemetryData | null>(null)

  // Right Panel: Unified Oceanographic Data Analysis Controls
  const [dataSource, setDataSource] = useState<string>(() => {
    if (initialVar === 'salinity') return 'Salinity (Halocline)'
    if (initialVar === 'current_velocity') return 'Velocity (Current Jet)'
    if (initialVar === 'chlorophyll') return 'Chlorophyll (Phytoplankton)'
    if (initialVar === 'sea_level') return 'Sea Level (SSHA Altimetry)'
    return 'Temperature (Calm State)'
  })

  // Sliders
  const [stepSize, setStepSize] = useState<number>(0.35)
  const [transparency, setTransparency] = useState<number>(0.85)
  const [zRotation, setZRotation] = useState<number>(65)

  // 3D Animated Feature Layer Toggles
  const [showCurrents, setShowCurrents] = useState<boolean>(true)
  const [showInSituDevices, setShowInSituDevices] = useState<boolean>(true)
  const [showBiology, setShowBiology] = useState<boolean>(true)
  const [showDepthSlice, setShowDepthSlice] = useState<boolean>(true)
  const [showDepthRuler, setShowDepthRuler] = useState<boolean>(true)
  const [boundingBox, setBoundingBox] = useState<boolean>(true)
  const [animationSpeed, setAnimationSpeed] = useState<number>(1)

  // 360 Rotation Animation (Disabled by default so depth view stays stationary)
  const [isAnimating, setIsAnimating] = useState<boolean>(false)

  // Active variable determined from Data Source
  const activeVariable: OceanVariable = useMemo(() => {
    if (dataSource.includes('Salinity')) return 'salinity'
    if (dataSource.includes('Velocity')) return 'current_velocity'
    if (dataSource.includes('Chlorophyll')) return 'chlorophyll'
    if (dataSource.includes('Sea Level')) return 'sea_level'
    return 'temperature'
  }, [dataSource])

  // Portion select handler
  const handleSelectPreset = (preset: PortionPreset) => {
    setPortionName(preset.name)
    setLat(preset.lat)
    setLon(preset.lon)
    if (preset.defaultVariable === 'temperature') setDataSource('Temperature (Calm State)')
    if (preset.defaultVariable === 'salinity') setDataSource('Salinity (Halocline)')
    if (preset.defaultVariable === 'current_velocity') setDataSource('Velocity (Current Jet)')
    if (preset.defaultVariable === 'chlorophyll') setDataSource('Chlorophyll (Phytoplankton)')
    setIsPortionModalOpen(false)
  }

  // Export sensor NetCDF / JSON mock file
  const handleExportTelemetry = (device: InSituTelemetryData) => {
    const dataStr = JSON.stringify(device, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${device.id}_in_situ_telemetry.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-[#141a24] via-[#0d121c] to-[#060910] text-slate-100 select-none overflow-hidden font-sans">
      {/* ── TOP HEADER & TITLE ── */}
      <header className="relative z-20 flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#09101d]/90 backdrop-blur-md flex-shrink-0 gap-3">
        {/* Left: Back to 3D Explorer */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/15 text-xs font-mono text-slate-200 hover:text-white transition-all cursor-pointer shadow-md"
          >
            <ArrowLeft size={13} />
            <span>3D Explorer</span>
          </button>
        </div>

        {/* Center: Reference Title + Active Portion */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-xs sm:text-sm font-bold text-slate-100 tracking-wide drop-shadow-md">
            Calm Water Level Data Visualization.
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-cyan-300 font-mono font-medium">
              Portion: <strong className="text-white">{portionName}</strong>
              {minLatParam && maxLatParam ? (
                <span className="ml-1 text-slate-300">
                  [{minLatParam}°N - {maxLatParam}°N, {minLonParam}°E - {maxLonParam}°E]
                </span>
              ) : (
                <span className="ml-1 text-slate-300">
                  ({lat.toFixed(1)}°N, {lon.toFixed(1)}°E)
                </span>
              )}
            </span>
            {/* The Prominent "+" Button */}
            <button
              onClick={() => setIsPortionModalOpen(true)}
              title="Click to Choose Any Ocean Portion or Drag on Globe"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-mono font-bold shadow-md transition-all cursor-pointer animate-pulse"
            >
              <Plus size={12} strokeWidth={3} />
              <span>Change Portion</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Depth Badge */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-mono text-[11px] font-bold">
            0 – {maxDepth}m
          </span>
        </div>
      </header>

      {/* ── CENTRAL 3D VOLUMETRIC VIEWPORT ─────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <Canvas
          camera={{ position: [5.6, 4.0, 5.6], fov: 42 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Studio Lights */}
          <ambientLight intensity={1.3} color="#e0f2fe" />
          <directionalLight position={[6, 8, 5]} intensity={1.9} castShadow />
          <directionalLight position={[-6, -4, -4]} intensity={0.7} color="#38bdf8" />
          <pointLight position={[0, 4, 0]} intensity={1.2} color="#ffffff" />
          <pointLight position={[0, -3, 0]} intensity={0.5} color="#0284c7" />

          {/* Fully Animated 3D Volumetric Water Column Block */}
          <CalmWaterVolumetricBlock
            variable={activeVariable}
            transparency={transparency}
            zRotation={zRotation}
            isAnimating={isAnimating}
            showBoundingBox={boundingBox}
            yClippingFraction={stepSize}
            portionName={portionName}
            lat={lat}
            lon={lon}
            maxDepth={maxDepth}
            showCurrents={showCurrents}
            showInSituDevices={showInSituDevices}
            showBiology={showBiology}
            showDepthSlice={showDepthSlice}
            showDepthRuler={showDepthRuler}
            animationSpeed={animationSpeed}
            selectedDeviceId={selectedDevice?.id}
            onSelectDevice={setSelectedDevice}
          />

          {/* Orbit Controls (autoRotate disabled so it never moves automatically) */}
          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            minDistance={2.8}
            maxDistance={15.0}
            maxPolarAngle={Math.PI / 2 + 0.2}
            autoRotate={false}
          />
        </Canvas>

        {/* ── FLOATING IN-SITU DEVICE TELEMETRY INSPECTOR HUD (When Selected / Clicked) ── */}
        {selectedDevice && (
          <div className="absolute top-4 left-4 z-20 w-84 sm:w-96 max-h-[calc(100%-32px)] overflow-y-auto bg-[#070e1b]/95 backdrop-blur-xl border border-cyan-400/50 rounded-2xl p-4 shadow-2xl space-y-3 font-mono text-xs animate-fade-in ring-1 ring-cyan-500/30 pointer-events-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/40 text-base shadow-inner">
                  {selectedDevice.type === 'argo' && '🛰️'}
                  {selectedDevice.type === 'glider' && '✈️'}
                  {selectedDevice.type === 'mooring' && '⚓'}
                  {selectedDevice.type === 'pfz_fish' && '🐟'}
                  {selectedDevice.type === 'phytoplankton' && '🌿'}
                </span>
                <div>
                  <h3 className="font-bold text-white text-xs leading-snug">{selectedDevice.title}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-cyan-300">{selectedDevice.agency}</span>
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-200 px-1.5 py-0.2 rounded border border-cyan-400/30">
                      {selectedDevice.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDevice(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                title="Close Telemetry Inspector"
              >
                <X size={14} />
              </button>
            </div>

            {/* Depth Level Indicator Bar */}
            <div className="bg-[#0f172a]/80 p-2.5 rounded-xl border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-bold flex items-center gap-1">
                  <Compass size={12} className="text-cyan-400" />
                  <span>Observation Depth:</span>
                </span>
                <span className="text-cyan-300 font-bold">{selectedDevice.depthMeters}m / {maxDepth}m</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/15 flex">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, (selectedDevice.depthMeters / maxDepth) * 100))}%` }}
                />
              </div>
            </div>

            {/* Live In-Situ Telemetry Matrix */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Live Sensor Telemetry Metrics:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {selectedDevice.metrics.map((m, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-2 rounded-lg">
                    <span className="text-[9.5px] text-slate-400 block truncate">{m.label}</span>
                    <span className={`text-[11px] font-bold block mt-0.5 truncate ${m.color || 'text-slate-100'}`}>
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnostics if available */}
            {selectedDevice.diagnostics && (
              <div className="bg-[#0b1322] border border-white/10 p-2.5 rounded-xl space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Battery State:</span>
                  <span className="text-emerald-400 font-bold">{selectedDevice.diagnostics.battery}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Telemetry Link:</span>
                  <span className="text-cyan-300 font-bold">{selectedDevice.diagnostics.telemetry}</span>
                </div>
                {selectedDevice.diagnostics.sensors && (
                  <div className="pt-1 border-t border-white/10">
                    <span className="text-slate-400 block mb-0.5">Active Sensor Payload:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedDevice.diagnostics.sensors.map((s, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 text-[9px] border border-white/10">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans bg-black/30 p-2 rounded-lg border border-white/5">
              {selectedDevice.description}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              <button
                onClick={() => handleExportTelemetry(selectedDevice)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold transition-all cursor-pointer"
                title="Export sensor data as JSON"
              >
                <Download size={12} />
                <span>Export Telemetry</span>
              </button>
              <button
                onClick={() => setSelectedDevice(null)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ── BOTTOM-LEFT COLORBAR LEGENDS ─────────── */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-3 bg-black/75 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shadow-2xl max-w-sm pointer-events-auto select-none">
          {/* 1. Temperature Legend */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <Thermometer size={13} className="text-red-400" />
                <span>Temperature (°C)</span>
              </div>
              <span className="text-[10px] text-slate-400">°C</span>
            </div>
            <div className="h-3 w-72 rounded-sm bg-gradient-to-r from-[#001040] via-[#00c0f0] via-[#00e050] via-[#fac018] to-[#e63946] border border-white/20 shadow-inner" />
            <div className="flex justify-between text-[9px] font-mono text-slate-400 px-0.5">
              <span>1.276</span>
              <span>7.354</span>
              <span>13.432</span>
              <span>19.51</span>
              <span>25.588</span>
              <span>31.668</span>
            </div>
          </div>

          {/* 2. Velocity Magnitude Legend */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <Waves size={13} className="text-cyan-400" />
                <span>Velocity Magnitude (m/s)</span>
              </div>
              <span className="text-[10px] text-slate-400">m/s</span>
            </div>
            <div className="h-3 w-72 rounded-sm bg-gradient-to-r from-[#051838] via-[#06b6d4] via-[#22c55e] via-[#eab308] to-[#ef4444] border border-white/20 shadow-inner" />
            <div className="flex justify-between text-[9px] font-mono text-slate-400 px-0.5">
              <span>0</span>
              <span>0.106</span>
              <span>0.212</span>
              <span>0.416</span>
              <span>0.424</span>
              <span>1.0</span>
            </div>
          </div>

          {/* 3. Salinity Legend */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <Droplets size={13} className="text-blue-300" />
                <span>Salinity (PSU)</span>
              </div>
              <span className="text-[10px] text-slate-400">PSU</span>
            </div>
            <div className="h-3 w-72 rounded-sm bg-gradient-to-r from-[#020b18] via-[#1e3a8a] via-[#38bdf8] to-[#ffffff] border border-white/20 shadow-inner" />
            <div className="flex justify-between text-[9px] font-mono text-slate-400 px-0.5">
              <span>32.0</span>
              <span>33.6</span>
              <span>34.8</span>
              <span>35.5</span>
              <span>36.2</span>
              <span>37.0</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: UNIFIED OCEANOGRAPHIC DATA ANALYSIS ───────────── */}
        <aside className="absolute top-3 right-3 z-10 w-76 max-h-[calc(100%-24px)] overflow-y-auto bg-[#0a0f18]/95 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-2xl space-y-3.5 font-mono text-xs pointer-events-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h2 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <Activity size={14} className="text-cyan-400" />
              <span>Oceanographic Analysis</span>
            </h2>
          </div>

          {/* Data Source */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 block uppercase font-bold">Data Source Parameter</label>
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
              className="w-full bg-[#131a26] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-cyan-400 outline-none"
            >
              <option value="Temperature (Calm State)">Temperature (Calm State)</option>
              <option value="Salinity (Halocline)">Salinity (Halocline)</option>
              <option value="Velocity (Current Jet)">Velocity (Current Jet)</option>
              <option value="Chlorophyll (Phytoplankton)">Chlorophyll (Phytoplankton)</option>
              <option value="Sea Level (SSHA Altimetry)">Sea Level (SSHA Altimetry)</option>
            </select>
          </div>

          {/* 3D Animated Layer Toggles */}
          <div className="border-t border-white/10 pt-2.5 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
              3D Animated Layers & Platforms
            </span>

            {/* Currents */}
            <label className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-200 cursor-pointer transition-colors">
              <span className="flex items-center gap-1.5">
                <Waves size={13} className="text-cyan-400" />
                <span>Current Streamlines</span>
              </span>
              <input
                type="checkbox"
                checked={showCurrents}
                onChange={(e) => setShowCurrents(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-400"
              />
            </label>

            {/* In-Situ Devices */}
            <label className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-200 cursor-pointer transition-colors">
              <span className="flex items-center gap-1.5">
                <Radio size={13} className="text-amber-400" />
                <span>Argo Floats & Gliders</span>
              </span>
              <input
                type="checkbox"
                checked={showInSituDevices}
                onChange={(e) => setShowInSituDevices(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-400"
              />
            </label>

            {/* Quick In-Situ Device Focus Shortcuts */}
            {showInSituDevices && (
              <div className="pl-3 py-1 space-y-1 text-[10px]">
                <div className="text-slate-400 font-bold mb-1">Hover or click in 3D or inspect below:</div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedDevice({
                      id: 'argo-2901452',
                      type: 'argo',
                      title: 'Argo Profiling Float #2901452',
                      subtitle: 'INCOIS / INOSHAC Indian Ocean Bio-Argo Fleet',
                      agency: 'INCOIS / MoES India',
                      depthMeters: 842,
                      status: 'Active Profiling (0-2000m)',
                      metrics: [
                        { label: 'Platform Model', value: 'APEX Apex-11 CTD-O2' },
                        { label: 'Current Depth', value: '842 m', color: 'text-cyan-300' },
                        { label: 'In-Situ Temp', value: '9.84 °C', color: 'text-amber-300' },
                        { label: 'Salinity', value: '34.91 PSU', color: 'text-cyan-400' },
                        { label: 'Dissolved O₂', value: '136.2 µmol/kg', color: 'text-emerald-400' },
                        { label: 'Pressure', value: '850.4 dbar' },
                        { label: 'Coordinates', value: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E` },
                        { label: 'Drift Park Depth', value: '1,000 m' },
                      ],
                      diagnostics: {
                        battery: '94% (Lithium Pack)',
                        telemetry: 'Iridium SBD 2-Way (Online)',
                        cycle: '#142 / 10-Day Cycle',
                        sensors: ['Sea-Bird SBE 41CP CTD', 'Aanderaa 4330 Optode', 'WET Labs ECO-FLBB'],
                      },
                      description: 'Autonomous robotic float performing continuous vertical CTD and dissolved oxygen profiling down to 2,000m depths in the Indian Ocean basin.',
                    })}
                    className="px-2 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold cursor-pointer transition-all"
                  >
                    🛰️ Argo #2901452
                  </button>
                  <button
                    onClick={() => setSelectedDevice({
                      id: 'glider-sg152',
                      type: 'glider',
                      title: 'Autonomous Ocean Glider SG-152 "Nautilus"',
                      subtitle: 'NIOT Ocean Glider Boundary Current Survey',
                      agency: 'NIOT / MoES India',
                      depthMeters: 420,
                      status: 'Sawtooth Gliding (0-1000m)',
                      metrics: [
                        { label: 'Glider Model', value: 'Slocum G3 Deep Glider' },
                        { label: 'Current Depth', value: '420 m (Descent Phase)', color: 'text-cyan-300' },
                        { label: 'Glide Velocity', value: '0.38 m/s (0.74 kts)', color: 'text-emerald-300' },
                        { label: 'Pitch Angle', value: '-18.5° (Sawtooth Dive)', color: 'text-amber-300' },
                        { label: 'In-Situ Temp', value: '16.2 °C', color: 'text-amber-400' },
                        { label: 'Salinity', value: '34.68 PSU', color: 'text-cyan-400' },
                        { label: 'Turbidity', value: '0.14 NTU' },
                        { label: 'Mission Section', value: 'Section 14B Boundary Transect' },
                      ],
                      diagnostics: {
                        battery: '78% (~48 days endurance)',
                        telemetry: 'Iridium / FreeWave Acoustic Link',
                        heading: '142° (South-East Transect)',
                        pitch: '-18.5°',
                        targetWaypoint: `${(lat + 0.2).toFixed(2)}°N, ${(lon - 0.3).toFixed(2)}°E`,
                        sensors: ['SBE 41-Glider CTD', 'Turner Cyclops CDOM', 'Aanderaa Oxygen'],
                      },
                      description: 'Buoyancy-driven underwater vehicle navigating high-resolution vertical sawtooth flight cycles to map boundary current shears and pycnocline eddies.',
                    })}
                    className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 font-bold cursor-pointer transition-all"
                  >
                    ✈️ Glider SG-152
                  </button>
                  <button
                    onClick={() => setSelectedDevice({
                      id: 'mooring-omni-bd08',
                      type: 'mooring',
                      title: 'Moored CTD Rosette Array (OMNI BD-08)',
                      subtitle: 'RAMA Tropical Indian Ocean Mooring Network',
                      agency: 'NIOT / INCOIS Ocean Observation System',
                      depthMeters: 2000,
                      status: 'Taut-Wire Moored (0-2000m)',
                      metrics: [
                        { label: 'Station ID', value: 'OMNI BD-08 (RAMA Deep)' },
                        { label: 'Mooring Depth', value: '2,000 m Full Water Column', color: 'text-cyan-300' },
                        { label: 'Upper Layer (50m)', value: '28.6°C | 33.4 PSU', color: 'text-amber-300' },
                        { label: 'Thermocline (200m)', value: '21.4°C | 34.8 PSU', color: 'text-emerald-400' },
                        { label: 'Intermediate (500m)', value: '11.5°C | 35.0 PSU' },
                        { label: 'Deep Abyss (2000m)', value: '3.8°C | 34.8 PSU' },
                        { label: 'ADCP Current', value: '0.48 m/s @ 115° Heading', color: 'text-cyan-400' },
                        { label: 'Coordinates', value: `${(lat - 0.25).toFixed(2)}°N, ${(lon - 0.2).toFixed(2)}°E` },
                      ],
                      diagnostics: {
                        battery: 'Solar / Deep Sea Alkaline Pack (Nominal)',
                        telemetry: 'INSAT & Iridium Real-Time Hourly Uplink',
                        sensors: ['Teledyne RDI 300kHz ADCP', 'Sea-Bird SBE 37-IM MicroCAT (x5)', 'MetPak Pro Surface Station'],
                      },
                      description: 'Full water-column oceanographic mooring anchored from surface to abyssal sea floor measuring high-frequency internal waves, monsoon currents, and thermocline heat content.',
                    })}
                    className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold cursor-pointer transition-all"
                  >
                    ⚓ Moored CTD BD-08
                  </button>
                </div>
              </div>
            )}

            {/* Photic Biology */}
            <label className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-200 cursor-pointer transition-colors">
              <span className="flex items-center gap-1.5">
                <Fish size={13} className="text-emerald-400" />
                <span>Phytoplankton & Fish</span>
              </span>
              <input
                type="checkbox"
                checked={showBiology}
                onChange={(e) => setShowBiology(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-400"
              />
            </label>

            {/* Depth Slice Probe */}
            <label className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-200 cursor-pointer transition-colors">
              <span className="flex items-center gap-1.5">
                <Layers size={13} className="text-blue-400" />
                <span>Depth Slicing Probe</span>
              </span>
              <input
                type="checkbox"
                checked={showDepthSlice}
                onChange={(e) => setShowDepthSlice(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-400"
              />
            </label>

            {/* Depth Ruler */}
            <label className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-200 cursor-pointer transition-colors">
              <span className="flex items-center gap-1.5">
                <span className="text-cyan-400 font-bold">📏</span>
                <span>Depth Ruler (0-2000m)</span>
              </span>
              <input
                type="checkbox"
                checked={showDepthRuler}
                onChange={(e) => setShowDepthRuler(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-400"
              />
            </label>
          </div>

          {/* Sliders */}
          <div className="border-t border-white/10 pt-2.5 space-y-3">
            {/* Step Size / Depth Probe Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-bold">Slice Probe Depth</span>
                <span className="text-cyan-300 font-bold">{Math.round(stepSize * maxDepth)}m</span>
              </div>
              <input
                type="range"
                min={0.02}
                max={0.98}
                step={0.02}
                value={stepSize}
                onChange={(e) => setStepSize(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Transparency Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Column Transparency</span>
                <span className="text-cyan-300">{transparency}</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={transparency}
                onChange={(e) => setTransparency(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Z-axis Rotation Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Stationary Angle</span>
                <span className="text-cyan-300">{zRotation}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                step={2}
                value={zRotation}
                onChange={(e) => setZRotation(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Flow Speed Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Current Flow Speed</span>
                <span className="text-cyan-300">{animationSpeed}x</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={3.0}
                step={0.2}
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Checkboxes & Optional Auto-Rotate Toggle */}
          <div className="border-t border-white/10 pt-2.5 flex items-center justify-between">
            <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={boundingBox}
                onChange={(e) => setBoundingBox(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-400"
              />
              <span>Wireframe Box</span>
            </label>

            <button
              onClick={() => setIsAnimating((a) => !a)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                isAnimating
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/15'
              }`}
              title={isAnimating ? 'Stop Continuous Auto-Rotation' : 'Enable 360° Auto-Rotation'}
            >
              {isAnimating ? <Pause size={13} /> : <Play size={13} />}
              <span>{isAnimating ? 'Auto-Rotating' : 'Auto-Rotate'}</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ── THE PROMINENT "+" OCEAN PORTION SELECTOR MODAL ────────────────── */}
      {isPortionModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-mono select-none">
          <div className="bg-[#0b1019] border border-cyan-500/50 rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 text-xs text-slate-100 ring-1 ring-white/10">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/40">
                  <Plus size={16} strokeWidth={3} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Select Ocean Portion for 3D Depth View</h3>
                  <p className="text-[11px] text-slate-400">
                    Choose any geographic region or enter custom coordinates with depth parameters
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPortionModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Direct Interactive 3D Globe Drag Launcher */}
            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-400/50 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white text-xs block flex items-center gap-1.5">
                  <Globe size={14} className="text-cyan-400" />
                  <span>Interactive 4-Sided Drag on Globe</span>
                </span>
                <span className="text-[10px] text-cyan-200">
                  Switch to the full 3D globe to drag and select any custom rectangular portion
                </span>
              </div>
              <button
                onClick={() => navigate('/dashboard?selectPortion=true')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Pick on Globe ↗</span>
              </button>
            </div>

            {/* Presets List */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Recommended Indian Ocean Portions:
              </span>
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {PORTION_PRESETS.map((p) => {
                  const isSelected = portionName === p.name
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPreset(p)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-400 text-cyan-100 shadow-md shadow-cyan-950/40'
                          : 'bg-white/5 border-white/10 hover:border-white/25 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-white mb-0.5 flex items-center gap-1.5">
                          <span>{p.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-cyan-300">
                            {p.depthRange}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{p.description}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {p.lat}°N, {p.lon}°E
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Custom Coordinates Extrusion */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Or Specify Custom Portion Coordinates:
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Latitude (°N/S)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="-35"
                    max="30"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#141b26] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="40"
                    max="110"
                    value={lon}
                    onChange={(e) => setLon(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#141b26] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setIsPortionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setPortionName(`Custom (${lat.toFixed(1)}°N, ${lon.toFixed(1)}°E)`)
                  setIsPortionModalOpen(false)
                }}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Render 3D Depth Block</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
