/**
 * DashboardPage.tsx — Streamlined 3D Ocean Intelligence Explorer
 * Route: /dashboard
 * SIH 26067 | OceanIQ — INCOIS 3D Ocean Data Platform
 *
 * Impeccably Organized & De-cluttered Architecture:
 * • Sleek, Single-Row Glass HUD Command Bar (Zero Wrapping, Segmented Variable Switcher)
 * • Quick Depth Popover with Preset Depths & Ocean Stratification Guide
 * • Consolidated Tools Menu (3D Slice, Volumetric Depth View, Ingest Data, CF Metadata)
 * • Unified Scientific Intelligence Drawer (Replaces Dual-Sidebar Chaos with Overlay Tabs)
 * • Automatic Inspection Tab activation on Sensor / Point Click
 * • Pristine Globe Viewing with Default 'Indian Ocean' Basin Focus (No visual clutter)
 * • Perfectly Spaced Bottom HUD (Time Scrubber + Colorbar with Safe Margins from AI Copilot)
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ThreeEvent } from '@react-three/fiber'
import {
  Layers,
  Globe,
  Satellite,
  Compass,
  Home,
  Sliders,
  Maximize2,
  Minimize2,
  Tv,
  Plus,
  Database,
  Info,
  Cloud,
  Bell,
  Scale,
  Anchor,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Activity,
  Sparkles,
  RotateCcw,
  Check,
} from 'lucide-react'

import { useDashboardState } from '@/hooks/useDashboardState'
import { AlertManagementPanel, type OceanAlert } from '@/components/ai/AlertManagementPanel'
import { UnifiedRiskPanel, type CoastalLocation } from '@/components/ocean/UnifiedRiskPanel'
import { WeatherMonitor } from '@/components/ocean/WeatherMonitor'
import { OceanScene } from '@/components/ocean/OceanScene'
import { LayerControls } from '@/components/controls/LayerControls'
import { DepthControl } from '@/components/controls/DepthControl'
import { TimeControl } from '@/components/controls/TimeControl'
import { OceanColorbar } from '@/components/ocean/OceanColorbar'
import { OceanInfoPanel } from '@/components/ocean/OceanInfoPanel'
import { OceanHoverTooltip } from '@/components/ocean/OceanHoverTooltip'
import { OceanPointPopup } from '@/components/ocean/OceanPointPopup'
import { ObservationProfile } from '@/components/charts/ObservationProfile'
import { ModelObservationComparison } from '@/components/charts/ModelObservationComparison'
import { DatasetInfoModal } from '@/components/ui/DatasetInfoModal'
import { PortionConfirmModal } from '@/components/ocean/PortionConfirmModal'
import type { SelectedPortionBounds } from '@/components/ocean/PortionSelectionOverlay'
import { REGION_CAMERA_TARGETS, type CameraNavTarget } from '@/components/ocean/CameraController'
import type { ModelPointMeasurement, OceanVariable } from '@/types/ocean'
import { latLonToVec3, GLOBE_RADIUS } from '@/utils/geoUtils'
import { DataIngestionWizard } from '@/components/ui/DataIngestionWizard'
import { ModelComparisonDashboard } from '@/components/comparison/ModelComparisonDashboard'

type DrawerTab = 'layers' | 'regions' | 'alerts' | 'weather' | 'models' | 'inspector'
type InspectorTab = 'telemetry' | 'profile' | 'comparison'

const VARIABLES: { id: OceanVariable; label: string; icon: string; short: string; desc: string }[] = [
  { id: 'temperature', label: 'Temperature', icon: '🌡️', short: 'Temp', desc: 'Sea Surface & Subsurface Temperature (°C)' },
  { id: 'salinity', label: 'Salinity', icon: '🧂', short: 'Salinity', desc: 'Practical Salinity (PSU)' },
  { id: 'current_velocity', label: 'Currents', icon: '🌊', short: 'Currents', desc: 'Surface & Subsurface Current Velocity (m/s)' },
  { id: 'chlorophyll', label: 'Chlorophyll-a', icon: '🌿', short: 'Chl-a', desc: 'Phytoplankton Biomass Concentration (mg/m³)' },
  { id: 'sea_level', label: 'Sea Level', icon: '📊', short: 'Sea Level', desc: 'Sea Surface Height Anomaly / Altimetry (cm)' },
]

const REGIONS = [
  { name: 'Indian Ocean', label: 'Whole Basin', desc: 'Full synoptic oceanic coverage', coords: '20°S–25°N, 40°E–100°E' },
  { name: 'Arabian Sea', label: 'Arabian Sea', desc: 'High salinity & Somali upwelling', coords: '10°N–25°N, 55°E–75°E' },
  { name: 'Bay of Bengal', label: 'Bay of Bengal', desc: 'Monsoon freshwater runoff basin', coords: '8°N–22°N, 80°E–95°E' },
  { name: 'Equatorial Indian Ocean', label: 'Equatorial', desc: 'Wyrtki jets & Kelvin waves', coords: '10°S–5°N, 60°E–95°E' },
  { name: 'Southern Indian Ocean', label: 'Southern Basin', desc: 'Subtropical gyre & convergence', coords: '40°S–20°S, 50°E–100°E' },
]

const PRESET_DEPTHS = [
  { depth: 0, label: '0m', name: 'Surface', zone: 'Epipelagic' },
  { depth: 50, label: '50m', name: 'Mixed Layer', zone: 'Epipelagic' },
  { depth: 100, label: '100m', name: 'Euphotic Base', zone: 'Epipelagic' },
  { depth: 200, label: '200m', name: 'Thermocline', zone: 'Mesopelagic' },
  { depth: 500, label: '500m', name: 'Intermediate', zone: 'Mesopelagic' },
  { depth: 1000, label: '1000m', name: 'Deep Boundary', zone: 'Mesopelagic' },
  { depth: 2000, label: '2000m', name: 'Abyssal Floor', zone: 'Bathypelagic' },
]

export function DashboardPage() {
  const state = useDashboardState()

  const [globeMode, setGlobeMode] = useState<'heatmap' | 'satellite'>('heatmap')
  const [selectedRegion, setSelectedRegion] = useState('Indian Ocean')
  const [navTarget, setNavTarget] = useState<CameraNavTarget | null>(null)
  const [isPresentationMode, setIsPresentationMode] = useState(false)

  // Unified Scientific Intelligence Drawer (Replaces dual-sidebar dock + inspector)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('layers')
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('telemetry')

  // Top Bar Dropdowns
  const [isDepthOpen, setIsDepthOpen] = useState(false)
  const [isToolsOpen, setIsToolsOpen] = useState(false)
  const depthDropdownRef = useRef<HTMLDivElement>(null)
  const toolsDropdownRef = useRef<HTMLDivElement>(null)

  // Modals
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false)
  const [showIngestionWizard, setShowIngestionWizard] = useState(false)

  // Hover & Point Inspection Tooltips
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const [hoveredMeasurement, setHoveredMeasurement] = useState<ModelPointMeasurement | null>(null)
  const [selectedMeasurement, setSelectedMeasurement] = useState<ModelPointMeasurement | null>(null)
  const [pointPopup, setPointPopup] = useState<{ m: ModelPointMeasurement; sx: number; sy: number } | null>(null)

  // 4-Sided Portion Selection
  const [searchParams] = useSearchParams()
  const [isSelectingPortion, setIsSelectingPortion] = useState(
    () => searchParams.get('selectPortion') === 'true'
  )
  const [selectedPortionBounds, setSelectedPortionBounds] = useState<SelectedPortionBounds | null>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (depthDropdownRef.current && !depthDropdownRef.current.contains(event.target as Node)) {
        setIsDepthOpen(false)
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── URL Param sync (from OperationsPage deep links) ─────────────────────
  useEffect(() => {
    const variable = searchParams.get('variable') as OceanVariable | null
    const region = searchParams.get('region')
    const depth = searchParams.get('depth')
    if (variable && VARIABLES.find((v) => v.id === variable)) {
      state.setSelectedVariable(variable)
    }
    if (region) {
      const decodedRegion = decodeURIComponent(region)
      setSelectedRegion(decodedRegion)
      const target = REGION_CAMERA_TARGETS[decodedRegion]
      if (target) setNavTarget(target)
    }
    if (depth) {
      const depthNum = Number(depth)
      const idx = state.availableDepths.findIndex((d) => Math.abs(d - depthNum) < 30)
      if (idx >= 0) state.setSelectedDepthIndex(idx)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Camera Navigation Handlers ──────────────────────────────────────────
  const handleNavHome = useCallback(() => {
    setSelectedRegion('Indian Ocean')
    setNavTarget(REGION_CAMERA_TARGETS['Indian Ocean'])
  }, [])

  const handlePortionSelected = useCallback((bounds: SelectedPortionBounds) => {
    setSelectedPortionBounds(bounds)
    setIsSelectingPortion(false)
  }, [])

  const handleSelectRegion = useCallback((region: string) => {
    setSelectedRegion(region)
    const target = REGION_CAMERA_TARGETS[region]
    if (target) setNavTarget(target)
  }, [])

  const handleSelectAnomaly = useCallback((anomaly: OceanAlert) => {
    state.setSelectedVariable(anomaly.variable)
    const idx = state.availableDepths.indexOf(anomaly.depth)
    state.setSelectedDepthIndex(idx >= 0 ? idx : 0)
    setSelectedRegion(anomaly.region)
    const [x, y, z] = latLonToVec3(anomaly.lat, anomaly.lon, GLOBE_RADIUS + 0.9)
    const [tx, ty, tz] = latLonToVec3(anomaly.lat, anomaly.lon, GLOBE_RADIUS)
    setNavTarget({ position: [x, y, z], target: [tx, ty, tz] })
  }, [state])

  const handleSelectLocation = useCallback((loc: CoastalLocation) => {
    const [x, y, z] = latLonToVec3(loc.lat, loc.lon, GLOBE_RADIUS + 0.7)
    const [tx, ty, tz] = latLonToVec3(loc.lat, loc.lon, GLOBE_RADIUS)
    setNavTarget({ position: [x, y, z], target: [tx, ty, tz] })
  }, [])

  // ── Model Point & Observation Inspection Handlers ───────────────────────
  const handleHoverModelPoint = useCallback(
    (m: ModelPointMeasurement, e: ThreeEvent<PointerEvent>) => {
      setHoveredMeasurement(m)
      setHoverPos({ x: e.clientX, y: e.clientY })
    }, []
  )

  const handleUnhoverModelPoint = useCallback(() => {
    setHoveredMeasurement(null)
    setHoverPos(null)
  }, [])

  const handleClickModelPoint = useCallback((m: ModelPointMeasurement, e?: ThreeEvent<PointerEvent>) => {
    setSelectedMeasurement(m)
    if (e) {
      setPointPopup({ m, sx: e.clientX, sy: e.clientY })
    } else {
      setDrawerTab('inspector')
      setInspectorTab('telemetry')
      setIsDrawerOpen(true)
    }
  }, [])

  const handleSelectObs = useCallback((id: string | null) => {
    if (!id) return
    state.setSelectedObservationId(id)
    setDrawerTab('inspector')
    setInspectorTab('telemetry')
    setIsDrawerOpen(true)
  }, [state])

  // Select depth level from quick popover
  const handleSelectDepthLevel = (depthM: number) => {
    const idx = state.availableDepths.findIndex((d) => Math.abs(d - depthM) < 25)
    if (idx >= 0) {
      state.setSelectedDepthIndex(idx)
    }
    state.setContinuousDepth(depthM)
    setIsDepthOpen(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#010610] text-slate-100 select-none font-sans relative">
      {/* ── STREAMLINED SINGLE-ROW GLASS HUD HEADER ──────────────────────── */}
      {!isPresentationMode && (
        <header className="flex items-center justify-between px-3 md:px-5 h-13 border-b border-white/10 bg-[#030d1a]/95 backdrop-blur-xl z-20 flex-shrink-0 gap-3">
          {/* Left: Live Status Pill & Segmented Variable Switcher */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Live Data Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border transition-colors ${
                state.dataSourceMode === 'api'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
              title="INCOIS Live Ocean Data Stream (ROM/HYCOM 1/12° Model Grid)"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${state.dataSourceMode === 'api' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="hidden sm:inline">{state.dataSourceMode === 'api' ? 'INCOIS LIVE' : 'DEMO MODE'}</span>
            </div>

            {/* Segmented Ocean Parameter Switcher */}
            <nav className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md" aria-label="Ocean parameter selector">
              {VARIABLES.map((v) => {
                const isSelected = state.selectedVariable === v.id
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      state.setSelectedVariable(v.id)
                      setGlobeMode('heatmap')
                      // Cleanly adjust functional layers without turning on noisy text labels
                      if (v.id === 'temperature' || v.id === 'salinity') {
                        state.batchSetLayers({
                          oceanModel: true,
                          depthSlice: true,
                          currentVectors: false,
                          currentStreamlines: false,
                          valueLabels: false,
                          seaLevel: false,
                          phytoplankton: false,
                          zooplankton: false,
                          pfzFish: false,
                        })
                      } else if (v.id === 'current_velocity') {
                        state.batchSetLayers({
                          oceanModel: true,
                          depthSlice: false,
                          currentVectors: true,
                          currentStreamlines: true,
                          valueLabels: false,
                          seaLevel: false,
                          phytoplankton: false,
                          zooplankton: false,
                          pfzFish: false,
                        })
                      } else if (v.id === 'chlorophyll') {
                        state.batchSetLayers({
                          oceanModel: true,
                          depthSlice: false,
                          currentVectors: false,
                          currentStreamlines: false,
                          phytoplankton: true,
                          zooplankton: true,
                          pfzFish: true,
                          valueLabels: false,
                          seaLevel: false,
                        })
                      } else if (v.id === 'sea_level') {
                        state.batchSetLayers({
                          oceanModel: true,
                          depthSlice: false,
                          currentVectors: false,
                          currentStreamlines: false,
                          phytoplankton: false,
                          zooplankton: false,
                          pfzFish: false,
                          seaLevel: true,
                          valueLabels: false,
                        })
                      }
                    }}
                    title={v.desc}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/35 text-cyan-200 border border-cyan-400/40 shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span className="text-xs">{v.icon}</span>
                    <span className="hidden md:inline">{v.label}</span>
                    <span className="md:hidden">{v.short}</span>
                  </button>
                )
              })}
            </nav>

            {/* Quick Depth Popover Trigger */}
            <div className="relative" ref={depthDropdownRef}>
              <button
                onClick={() => setIsDepthOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                  isDepthOpen
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-sm'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                }`}
                title="Change vertical water column depth (0 to 2000m)"
              >
                <Anchor size={12} className="text-cyan-400" />
                <span className="hidden lg:inline text-slate-400">Depth:</span>
                <span className="font-bold text-cyan-300">{state.selectedDepth}m</span>
                <ChevronDown size={11} className={`text-slate-400 transition-transform ${isDepthOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Depth Popover Floating Window */}
              {isDepthOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-[#020b18]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-3.5 space-y-3 font-sans animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Anchor size={13} className="text-cyan-400" />
                      Vertical Depth Levels
                    </span>
                    <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      {state.selectedDepth}m
                    </span>
                  </div>

                  {/* Preset Snap Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                      Quick Strata Selection
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PRESET_DEPTHS.map((p) => {
                        const isCurrent = Math.abs(state.selectedDepth - p.depth) < 25
                        return (
                          <button
                            key={p.depth}
                            onClick={() => handleSelectDepthLevel(p.depth)}
                            className={`px-2 py-1.5 rounded-lg text-left text-xs font-mono transition-all flex items-center justify-between cursor-pointer border ${
                              isCurrent
                                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-bold'
                                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/15'
                            }`}
                          >
                            <span>{p.label}</span>
                            <span className="text-[9px] text-slate-500">{p.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Ocean Strata Zones Guide */}
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 text-[10px] space-y-1 text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-amber-300">☀️ Epipelagic</span>
                      <span>0 – 200m (Sunlight)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-indigo-300">🌅 Mesopelagic</span>
                      <span>200 – 1000m (Twilight)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-blue-400">🌑 Bathypelagic</span>
                      <span>1000 – 2000m (Midnight)</span>
                    </div>
                  </div>

                  {/* Full 3D Water Column link */}
                  <a
                    href={`/depth-view?region=${encodeURIComponent(selectedRegion)}&variable=${state.selectedVariable}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-medium transition-all"
                  >
                    <span>Inspect 3D Water Column</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right: Basemap Switcher, Tools Dropdown & Control Center Trigger */}
          <div className="flex items-center gap-2">
            {/* Basemap Toggle (Ocean Data Heatmap vs Pure Satellite) */}
            <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
              <button
                onClick={() => setGlobeMode('heatmap')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  globeMode === 'heatmap'
                    ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/30 text-cyan-200 border border-cyan-400/40 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
                title="Display dynamic numerical ocean model heatmap (SST, Salinity, Currents)"
              >
                <span>🌡️</span>
                <span className="hidden xl:inline">Ocean Data</span>
              </button>
              <button
                onClick={() => setGlobeMode('satellite')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  globeMode === 'satellite'
                    ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/30 text-cyan-200 border border-cyan-400/40 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
                title="Pure 4K Blue Marble Satellite basemap without data overlay"
              >
                <Satellite size={12} />
                <span className="hidden xl:inline">Satellite</span>
              </button>
            </div>

            {/* Signature 4-Sided Portion Depth Slice Tool */}
            <button
              onClick={() => setIsSelectingPortion((p) => !p)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                isSelectingPortion
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/30 animate-pulse'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-400/30'
              }`}
              title="Click and drag a 4-sided portion directly on the 3D globe to slice the water column"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">{isSelectingPortion ? 'Cancel Slice' : '3D Slice'}</span>
            </button>

            {/* Consolidated Tools Dropdown Menu */}
            <div className="relative" ref={toolsDropdownRef}>
              <button
                onClick={() => setIsToolsOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                  isToolsOpen
                    ? 'bg-white/15 text-white border-white/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                }`}
                title="Secondary Tools, Data Ingestion, CF-1.8 Metadata, and Display Modes"
              >
                <Sparkles size={12} className="text-cyan-400" />
                <span className="hidden md:inline">Tools</span>
                <ChevronDown size={11} className={`text-slate-400 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Tools Dropdown Menu Window */}
              {isToolsOpen && (
                <div className="absolute top-full right-0 mt-2 z-50 w-64 bg-[#020b18]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-2 space-y-1 font-sans text-xs animate-fade-in">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/10">
                    Workspace Actions
                  </div>

                  <a
                    href={`/depth-view?region=${encodeURIComponent(selectedRegion)}&variable=${state.selectedVariable}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsToolsOpen(false)}
                    className="flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Anchor size={13} className="text-cyan-400" />
                      3D Volumetric Depth View
                    </span>
                    <ExternalLink size={12} className="text-slate-400" />
                  </a>

                  <button
                    onClick={() => {
                      setShowIngestionWizard(true)
                      setIsToolsOpen(false)
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-left text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Database size={13} className="text-emerald-400" />
                    <span>Ingest Ocean Data (NetCDF/CSV)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDatasetModalOpen(true)
                      setIsToolsOpen(false)
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-left text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Info size={13} className="text-cyan-400" />
                    <span>CF-1.8 Dataset Metadata</span>
                  </button>

                  <div className="border-t border-white/10 my-1" />

                  <button
                    onClick={() => {
                      state.toggleAutoRotate()
                      setIsToolsOpen(false)
                    }}
                    className="flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-left text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw size={13} className="text-purple-400" />
                      <span>Auto-Rotate Globe</span>
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${state.autoRotate ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-500'}`}>
                      {state.autoRotate ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPresentationMode(true)
                      setIsToolsOpen(false)
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-left text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Tv size={13} className="text-sky-400" />
                    <span>Presentation Clean Mode</span>
                  </button>

                  <button
                    onClick={() => {
                      handleNavHome()
                      setIsToolsOpen(false)
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-left text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Home size={13} className="text-amber-400" />
                    <span>Reset View to Whole Basin</span>
                  </button>
                </div>
              )}
            </div>

            {/* Unified Scientific Control Center Drawer Toggle */}
            <button
              onClick={() => setIsDrawerOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                isDrawerOpen
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/30'
                  : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10 hover:border-cyan-400/40'
              }`}
              title="Open Scientific Control Center (Layers, Regions, Alerts, Weather, Models, Inspector)"
            >
              <Sliders size={13} />
              <span className="hidden sm:inline">Controls</span>
              {/* Alert Count Indicator */}
              <span className="w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-mono flex items-center justify-center font-extrabold ml-0.5">
                3
              </span>
            </button>
          </div>
        </header>
      )}

      {/* ── MAIN IMMERSIVE 3D WORKSPACE ─────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden min-h-0 bg-[#010610]">
        {/* Full-width 3D Canvas Scene */}
        <div className="absolute inset-0 isolate">
          <OceanScene
            selectedVariable={state.selectedVariable}
            selectedDepth={state.selectedDepth}
            continuousDepth={state.continuousDepth}
            availableDepths={state.availableDepths}
            selectedTimeIndex={state.selectedTimeIndex}
            selectedTime={state.selectedTime}
            selectedObservationId={state.selectedObservationId}
            observations={state.observations}
            visibleLayers={state.visibleLayers}
            autoRotate={state.autoRotate}
            globeMode={globeMode}
            visibleVolumetricBlock={false}
            visibleGliderPath={true}
            selectedRegion={selectedRegion}
            verticalExaggeration={state.verticalExaggeration}
            navTarget={navTarget}
            onNavComplete={() => setNavTarget(null)}
            onSelectObservation={handleSelectObs}
            onHoverModelPoint={handleHoverModelPoint}
            onUnhoverModelPoint={handleUnhoverModelPoint}
            onClickModelPoint={handleClickModelPoint}
            selectedMeasurement={selectedMeasurement}
            onSelectAnomaly={handleSelectAnomaly}
            isSelectingPortion={isSelectingPortion}
            onPortionSelected={handlePortionSelected}
            onCancelPortionSelection={() => setIsSelectingPortion(false)}
          />
        </div>

        {/* Floating Guidance Banner during 4-Sided Portion Drag */}
        {isSelectingPortion && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/90 border border-cyan-400 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 font-mono text-xs text-white backdrop-blur-md animate-fade-in pointer-events-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Click and drag on the globe to draw a 4-sided water column slice</span>
            <button
              onClick={() => setIsSelectingPortion(false)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Floating Quick Home Reset Camera Button (Top Left) */}
        {!isPresentationMode && (
          <div className="absolute top-3 left-3 z-10">
            <button
              onClick={handleNavHome}
              title="Reset Camera to Indian Ocean Basin"
              className="w-8.5 h-8.5 rounded-xl bg-[#030d1a]/85 hover:bg-[#06182c] border border-white/10 text-slate-300 hover:text-cyan-300 flex items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer"
            >
              <Home size={15} />
            </button>
          </div>
        )}

        {/* Hover Tooltip HUD */}
        {hoveredMeasurement && hoverPos && (
          <OceanHoverTooltip
            hoverState={{
              type: 'model',
              measurement: hoveredMeasurement,
              screenX: hoverPos.x,
              screenY: hoverPos.y,
            }}
          />
        )}

        {/* Click-Anywhere Ocean Popup */}
        {pointPopup && (
          <OceanPointPopup
            lat={pointPopup.m.latitude}
            lon={pointPopup.m.longitude}
            depth={pointPopup.m.depth}
            variable={state.selectedVariable}
            timeIndex={state.selectedTimeIndex}
            observations={state.observations}
            screenX={pointPopup.sx}
            screenY={pointPopup.sy}
            onClose={() => setPointPopup(null)}
            onOpenDepthInspector={() => {
              setDrawerTab('inspector')
              setInspectorTab('telemetry')
              setIsDrawerOpen(true)
              setPointPopup(null)
            }}
            onSelectObservation={(id: string | null) => {
              if (id) handleSelectObs(id)
              setPointPopup(null)
            }}
          />
        )}

        {/* ── UNIFIED SCIENTIFIC INTELLIGENCE DRAWER (Floating Glass Panel) ── */}
        {!isPresentationMode && isDrawerOpen && (
          <aside className="absolute top-3 right-3 bottom-3 w-[410px] max-w-[calc(100vw-24px)] z-30 flex flex-col bg-[#020b18]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden font-sans animate-fade-in">
            {/* Drawer Header & Tab Navigation Bar */}
            <div className="p-3 border-b border-white/10 bg-[#030e20]/80 flex-shrink-0">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-xs font-mono font-bold tracking-wide uppercase text-slate-200">
                    Scientific Control Center
                  </span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close Control Center"
                >
                  <X size={15} />
                </button>
              </div>

              {/* 6 Organized Tabs */}
              <div className="grid grid-cols-6 gap-1 p-0.5 rounded-xl bg-black/40 border border-white/10 font-mono text-[10px]">
                <button
                  onClick={() => setDrawerTab('layers')}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-all cursor-pointer ${
                    drawerTab === 'layers'
                      ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  title="Visualization Layers & Strata Depth"
                >
                  <Layers size={13} />
                  <span className="mt-0.5">Layers</span>
                </button>

                <button
                  onClick={() => setDrawerTab('regions')}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-all cursor-pointer ${
                    drawerTab === 'regions'
                      ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  title="Geographic Presets"
                >
                  <Compass size={13} />
                  <span className="mt-0.5">Regions</span>
                </button>

                <button
                  onClick={() => setDrawerTab('alerts')}
                  className={`relative flex flex-col items-center justify-center py-1.5 rounded-lg transition-all cursor-pointer ${
                    drawerTab === 'alerts'
                      ? 'bg-red-500/25 text-red-200 border border-red-400/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  title="AI Threat Alerts & Current Flow Visualizer"
                >
                  <Bell size={13} />
                  <span className="mt-0.5">Alerts</span>
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                </button>

                <button
                  onClick={() => setDrawerTab('weather')}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-all cursor-pointer ${
                    drawerTab === 'weather'
                      ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  title="Live Coastal Marine Weather"
                >
                  <Cloud size={13} />
                  <span className="mt-0.5">Weather</span>
                </button>

                <button
                  onClick={() => setDrawerTab('models')}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-all cursor-pointer ${
                    drawerTab === 'models'
                      ? 'bg-purple-500/25 text-purple-200 border border-purple-400/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  title="Competitive Model vs Model & In-Situ Comparison"
                >
                  <Scale size={13} />
                  <span className="mt-0.5">Models</span>
                </button>

                <button
                  onClick={() => setDrawerTab('inspector')}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-all cursor-pointer ${
                    drawerTab === 'inspector'
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  title="Sensor Telemetry & Depth Residuals"
                >
                  <Activity size={13} />
                  <span className="mt-0.5">Inspect</span>
                </button>
              </div>
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
              {/* TAB 1: LAYERS & DEPTH */}
              {drawerTab === 'layers' && (
                <div className="space-y-4">
                  <LayerControls
                    visibleLayers={state.visibleLayers}
                    onToggle={state.toggleLayer}
                    onBatchSet={state.batchSetLayers}
                  />

                  <div className="pt-3 border-t border-white/10">
                    <DepthControl
                      selectedDepthIndex={state.selectedDepthIndex}
                      onChange={state.setSelectedDepthIndex}
                      continuousDepth={state.continuousDepth}
                      onContinuousChange={state.setContinuousDepth}
                      verticalExaggeration={state.verticalExaggeration}
                      onExaggerationChange={state.setVerticalExaggeration}
                      availableDepths={state.availableDepths}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: GEOGRAPHIC REGIONS */}
              {drawerTab === 'regions' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                      Geographic Regional Presets
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400">5 Ocean Zones</span>
                  </div>

                  {REGIONS.map((r) => {
                    const isSelected = selectedRegion === r.name
                    return (
                      <button
                        key={r.name}
                        onClick={() => handleSelectRegion(r.name)}
                        className={`w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-md'
                            : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-xs flex items-center gap-1.5">
                            <span>{r.label}</span>
                            {isSelected && <Check size={12} className="text-cyan-400" />}
                          </div>
                          <div className="text-[10px] text-slate-400">{r.desc}</div>
                          <div className="text-[9px] font-mono text-slate-500">{r.coords}</div>
                        </div>
                        <Compass size={15} className={isSelected ? 'text-cyan-400' : 'text-slate-500'} />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* TAB 3: ALERTS & THREATS */}
              {drawerTab === 'alerts' && (
                <div className="space-y-4">
                  <AlertManagementPanel onSelectAlert={handleSelectAnomaly} maxHeight="calc(100vh - 240px)" />
                  <div className="pt-3 border-t border-white/10">
                    <UnifiedRiskPanel onSelectLocation={handleSelectLocation} />
                  </div>
                </div>
              )}

              {/* TAB 4: MARINE WEATHER */}
              {drawerTab === 'weather' && (
                <div className="h-full min-h-0">
                  <WeatherMonitor compact={false} selectedRegion={selectedRegion} />
                </div>
              )}

              {/* TAB 5: COMPETITIVE MODEL VIEW */}
              {drawerTab === 'models' && (
                <div className="h-full min-h-0">
                  <ModelComparisonDashboard />
                </div>
              )}

              {/* TAB 6: SENSOR TELEMETRY & PROFILE INSPECTOR */}
              {drawerTab === 'inspector' && (
                <div className="space-y-3">
                  {/* Inspector Sub-tabs */}
                  <div className="flex gap-1 p-0.5 rounded-lg bg-black/40 border border-white/10 font-mono text-[10px]">
                    {(['telemetry', 'profile', 'comparison'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setInspectorTab(tab)}
                        className={`flex-1 py-1 rounded transition-colors cursor-pointer text-center ${
                          inspectorTab === tab
                            ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab === 'telemetry' ? 'Telemetry' : tab === 'profile' ? 'Profile' : 'Residuals'}
                      </button>
                    ))}
                  </div>

                  {inspectorTab === 'telemetry' && (
                    <OceanInfoPanel
                      selectedVariable={state.selectedVariable}
                      selectedDepth={state.selectedDepth}
                      selectedTimeIndex={state.selectedTimeIndex}
                      selectedTime={state.selectedTime}
                      selectedObservation={state.selectedObservation}
                      selectedMeasurement={selectedMeasurement}
                      onClearMeasurement={() => setSelectedMeasurement(null)}
                      onOpenProfile={() => setInspectorTab('profile')}
                      onOpenComparison={() => setInspectorTab('comparison')}
                    />
                  )}

                  {inspectorTab === 'profile' && (
                    <div className="p-1">
                      {state.selectedObservation ? (
                        <ObservationProfile observation={state.selectedObservation} />
                      ) : (
                        <div className="text-center p-6 text-xs font-mono text-slate-400 bg-white/5 rounded-xl border border-white/5">
                          Click any Argo float, autonomous glider, or CTD buoy on the globe to inspect its vertical CTD profile.
                        </div>
                      )}
                    </div>
                  )}

                  {inspectorTab === 'comparison' && (
                    <div className="p-1">
                      {state.selectedObservation ? (
                        <ModelObservationComparison
                          observation={state.selectedObservation}
                          selectedTimeIndex={state.selectedTimeIndex}
                        />
                      ) : (
                        <div className="text-center p-6 text-xs font-mono text-slate-400 bg-white/5 rounded-xl border border-white/5">
                          Click an observation platform to compute real-time model forecast residuals against in-situ observations.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ── CLEAN BOTTOM WORKSPACE: TIME SCRUBBER & COLORBAR ───────────── */}
        {!isPresentationMode && (
          <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-end justify-between gap-3 pointer-events-none">
            {/* Left: TimeControl HUD Scrubber */}
            <div className="pointer-events-auto max-w-md w-full bg-[#030d1a]/92 backdrop-blur-xl p-2.5 rounded-2xl border border-white/10 shadow-2xl transition-all">
              <TimeControl
                modelTimes={state.modelTimes}
                selectedTimeIndex={state.selectedTimeIndex}
                isPlaying={state.isPlaying}
                onSelectTime={state.setSelectedTimeIndex}
                onTogglePlay={state.togglePlay}
                onStep={state.stepTime}
              />
            </div>

            {/* Right: OceanColorbar Legend (Safely shifted left of AI Copilot, fades out when drawer is open) */}
            <div
              className={`pointer-events-auto bg-[#030d1a]/92 backdrop-blur-xl p-2.5 rounded-2xl border border-white/10 shadow-2xl transition-all duration-300 hidden sm:block ${
                isDrawerOpen ? 'opacity-0 pointer-events-none translate-y-3' : 'mr-44 opacity-100'
              }`}
            >
              <OceanColorbar selectedVariable={state.selectedVariable} />
            </div>
          </div>
        )}

        {/* Exit Presentation Mode Floating Button */}
        {isPresentationMode && (
          <div className="absolute top-4 right-4 z-30">
            <button
              onClick={() => setIsPresentationMode(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#030d1a]/95 border border-white/20 text-white text-xs font-mono shadow-2xl hover:bg-white/10 cursor-pointer"
            >
              <Minimize2 size={13} />
              <span>Exit Presentation</span>
            </button>
          </div>
        )}
      </div>

      {/* Data Ingestion Wizard Modal */}
      {showIngestionWizard && (
        <DataIngestionWizard onClose={() => setShowIngestionWizard(false)} />
      )}

      {/* Dataset CF Metadata Modal */}
      {isDatasetModalOpen && (
        <DatasetInfoModal
          isOpen={isDatasetModalOpen}
          onClose={() => setIsDatasetModalOpen(false)}
        />
      )}

      {/* 4-Sided Ocean Portion Confirmation & 3D Depth View Launcher */}
      {selectedPortionBounds && (
        <PortionConfirmModal
          bounds={selectedPortionBounds}
          initialVariable={state.selectedVariable}
          onClose={() => setSelectedPortionBounds(null)}
          onRedraw={() => {
            setSelectedPortionBounds(null)
            setIsSelectingPortion(true)
          }}
        />
      )}
    </div>
  )
}
