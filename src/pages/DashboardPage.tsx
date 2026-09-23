/**
 * DashboardPage.tsx — Streamlined 3D Ocean Intelligence Explorer
 * Route: /dashboard
 * SIH 26067 | OceanIQ — INCOIS 3D Ocean Data Platform
 *
 * Clean, de-cluttered layout:
 * • Full-screen 3D globe with calm scientific rendering
 * • Slim top bar: Parameter Pills | Depth Selector | Basemap Toggle | Dock Toggle
 * • Unified Scientific Control Dock (Layers, Regional Views, Threat Hazards)
 * • Right Inspector Panel for selected sensors and clicked ocean points
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ThreeEvent } from '@react-three/fiber'
import {
  Layers,
  ShieldAlert,
  X,
  Minimize2,
  Globe,
  Satellite,
  Compass,
  Home,
  Sliders,
  Maximize2,
  Tv,
  Plus,
  ChevronDown,
  Check,
  Database,
  Info,
  Mic,
  CloudSun,
  Scale,
  Fish,
  Globe2,
  Bot,
  Wrench,
  CircleDot,
} from 'lucide-react'

import { useDashboardState } from '@/hooks/useDashboardState'
import { AnomalyDetectionPanel, type OceanAnomaly } from '@/components/ai/AnomalyDetectionPanel'
import { UnifiedRiskPanel, type CoastalLocation } from '@/components/ocean/UnifiedRiskPanel'
import { OceanScene } from '@/components/ocean/OceanScene'
import { CesiumGlobeViewer } from '@/components/ocean/CesiumGlobeViewer'
import { DisasterAlertSystem, ACTIVE_DISASTER_ALERTS } from '@/components/ocean/DisasterAlertSystem'
import { WeatherPredictorModal } from '@/components/ocean/WeatherPredictorModal'
import { ModelComparativeViewer } from '@/components/comparison/ModelComparativeViewer'
import { PlaceEcosystemIsolationView } from '@/components/ocean/PlaceEcosystemIsolationView'
import { OceanAssistantModal, type AssistantAction } from '@/components/ai/OceanAssistantModal'
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
import { CompassRose } from '@/components/ocean/CompassRose'

type DockTab = 'layers' | 'regions' | 'anomalies'
type InspectorTab = 'telemetry' | 'profile' | 'comparison'

const VARIABLES: { id: OceanVariable; label: string; icon: string; desc: string }[] = [
  { id: 'temperature', label: 'Temperature', icon: '🌡️', desc: 'Sea Surface & Subsurface Temperature (°C)' },
  { id: 'salinity', label: 'Salinity', icon: '🧂', desc: 'Practical Salinity (PSU)' },
  { id: 'current_velocity', label: 'Currents', icon: '🌊', desc: 'Surface & Subsurface Current Velocity (m/s)' },
  { id: 'chlorophyll', label: 'Chlorophyll-a', icon: '🌿', desc: 'Phytoplankton Biomass Concentration (mg/m³)' },
  { id: 'sea_level', label: 'Sea Level', icon: '🌊', desc: 'Sea Surface Height Anomaly / Altimetry (cm)' },
]

const REGIONS = [
  { name: 'Indian Ocean', label: 'Whole Basin' },
  { name: 'Arabian Sea', label: 'Arabian Sea' },
  { name: 'Bay of Bengal', label: 'Bay of Bengal' },
  { name: 'Equatorial Indian Ocean', label: 'Equatorial' },
  { name: 'Southern Indian Ocean', label: 'Southern Basin' },
]

export function DashboardPage() {
  const state = useDashboardState()

  const [globeMode, setGlobeMode] = useState<'heatmap' | 'satellite'>('heatmap')
  const [selectedRegion, setSelectedRegion] = useState('Bay of Bengal')
  const [navTarget, setNavTarget] = useState<CameraNavTarget | null>(null)
  const [isPresentationMode, setIsPresentationMode] = useState(false)

  // Unified Scientific Control Dock
  const [isDockOpen, setIsDockOpen] = useState(false)
  const [dockTab, setDockTab] = useState<DockTab>('layers')

  // Right Inspector Panel
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('telemetry')

  // Modals
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false)

  // Hover Tooltip
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const [hoveredMeasurement, setHoveredMeasurement] = useState<ModelPointMeasurement | null>(null)
  const [selectedMeasurement, setSelectedMeasurement] = useState<ModelPointMeasurement | null>(null)

  // Click-anywhere popup
  const [pointPopup, setPointPopup] = useState<{ m: ModelPointMeasurement; sx: number; sy: number } | null>(null)

  // 4-Sided Portion Selection on Globe
  const [searchParams] = useSearchParams()
  const [isSelectingPortion, setIsSelectingPortion] = useState(
    () => searchParams.get('selectPortion') === 'true'
  )
  const [selectedPortionBounds, setSelectedPortionBounds] = useState<SelectedPortionBounds | null>(null)

  // Interactive Sonar Circle Place Selection
  const [isCirclingPlace, setIsCirclingPlace] = useState(false)

  // Collapsible Ocean Variable Selector
  const [isVariableDropdownOpen, setIsVariableDropdownOpen] = useState(false)

  // Dual Engine Switcher: 'three' (Physics / Volumetric) vs 'cesium' (WGS84 Geodesic)
  const [globeEngine, setGlobeEngine] = useState<'three' | 'cesium'>('three')

  // Feature Modals
  const [showDisasterAlerts, setShowDisasterAlerts] = useState(false)
  const [showWeatherPredictor, setShowWeatherPredictor] = useState(false)
  const [showModelComparison, setShowModelComparison] = useState(false)
  const [showPlaceEcosystem, setShowPlaceEcosystem] = useState(false)
  const [ecosystemPlaceName, setEcosystemPlaceName] = useState<string>('Lakshadweep Reefs')
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false)

  // Data Ingestion Wizard
  const [showIngestionWizard, setShowIngestionWizard] = useState(false)

  // Consolidated Tools Dropdown
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false)
  const toolsDropdownRef = useRef<HTMLDivElement | null>(null)

  // Close Tools dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setIsToolsDropdownOpen(false)
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
      setSelectedRegion(decodeURIComponent(region))
      const target = REGION_CAMERA_TARGETS[decodeURIComponent(region)]
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

  const handleSelectAnomaly = useCallback((anomaly: OceanAnomaly) => {
    state.setSelectedVariable(anomaly.variable)
    const idx = state.availableDepths.indexOf(anomaly.depth)
    state.setSelectedDepthIndex(idx >= 0 ? idx : 0)
    setSelectedRegion(anomaly.region)
    const [x, y, z] = latLonToVec3(anomaly.lat, anomaly.lon, GLOBE_RADIUS + 0.9)
    const [tx, ty, tz] = latLonToVec3(anomaly.lat, anomaly.lon, GLOBE_RADIUS)
    setNavTarget({ position: [x, y, z], target: [tx, ty, tz] })
    setIsDockOpen(false)
  }, [state])

  const handleSelectLocation = useCallback((loc: CoastalLocation) => {
    const [x, y, z] = latLonToVec3(loc.lat, loc.lon, GLOBE_RADIUS + 0.7)
    const [tx, ty, tz] = latLonToVec3(loc.lat, loc.lon, GLOBE_RADIUS)
    setNavTarget({ position: [x, y, z], target: [tx, ty, tz] })
    setIsDockOpen(false)
  }, [])

  // ── Model Point Inspection Handlers ─────────────────────────────────────
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
      setIsInspectorOpen(true)
      setInspectorTab('telemetry')
    }
  }, [])

  const handleSelectObs = useCallback((id: string | null) => {
    if (!id) return
    state.setSelectedObservationId(id)
    setIsInspectorOpen(true)
    setInspectorTab('telemetry')
  }, [state])

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#010610] text-slate-100 select-none font-sans">
      {/* ── TOP STREAMLINED CONTROLS BAR (Slim Single Row, Height 44px) ── */}
      {!isPresentationMode && (
        <header className="flex items-center justify-between px-3 sm:px-4 h-11 border-b border-white/10 bg-[#030d1a]/95 backdrop-blur-md z-30 flex-shrink-0 gap-2 select-none relative">
          {/* Left: Data Status, Depth & Variable Segmented Switcher */}
          <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border tracking-wider flex-shrink-0 ${
                state.dataSourceMode === 'api'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {state.dataSourceMode === 'api' ? '● LIVE' : '● DEMO'}
            </span>
            <span className="text-xs font-mono text-slate-300 hidden md:inline flex-shrink-0">
              Depth: <strong className="text-cyan-300">{state.selectedDepth}m</strong>
            </span>

            <div className="h-4 w-px bg-white/10 hidden md:block flex-shrink-0" />

            {/* Segmented Variable Pill Selector */}
            <div className="flex items-center p-0.5 bg-black/40 rounded-lg border border-white/10 gap-0.5 overflow-x-auto no-scrollbar flex-shrink-0">
              {VARIABLES.map((v) => {
                const isSelected = state.selectedVariable === v.id
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      state.setSelectedVariable(v.id)
                      if (v.id === 'temperature' || v.id === 'salinity') {
                        state.batchSetLayers({
                          oceanModel: true,
                          depthSlice: true,
                          currentVectors: false,
                          currentStreamlines: false,
                          seaLevel: false,
                          phytoplankton: false,
                          zooplankton: false,
                          pfzFish: false,
                          valueLabels: true,
                        })
                      } else if (v.id === 'current_velocity') {
                        state.batchSetLayers({
                          oceanModel: true,
                          depthSlice: false,
                          currentVectors: true,
                          currentStreamlines: true,
                          seaLevel: false,
                          phytoplankton: false,
                          zooplankton: false,
                          pfzFish: false,
                          valueLabels: true,
                        })
                      } else if (v.id === 'chlorophyll') {
                        state.batchSetLayers({
                          oceanModel: true,
                          depthSlice: false,
                          phytoplankton: true,
                          zooplankton: true,
                          pfzFish: true,
                          currentVectors: false,
                          currentStreamlines: false,
                          seaLevel: false,
                          valueLabels: true,
                        })
                      } else if (v.id === 'sea_level') {
                        state.batchSetLayers({
                          oceanModel: true,
                          depthSlice: false,
                          seaLevel: true,
                          currentVectors: false,
                          currentStreamlines: false,
                          phytoplankton: false,
                          zooplankton: false,
                          pfzFish: false,
                          valueLabels: true,
                        })
                      }
                    }}
                    title={v.desc}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-xs transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-cyan-500 text-black font-bold shadow-sm shadow-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xs">{v.icon}</span>
                    <span className="text-[11px] font-semibold">{v.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right: Quick Action Badges & Consolidated Tools Dropdown */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Multi-Hazard Disaster Alerts Badge */}
            <button
              onClick={() => setShowDisasterAlerts(true)}
              title="Multi-Hazard Early Warning Center (Tsunamis, Cyclones, High Tides, Heavy Rains)"
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm flex-shrink-0"
            >
              <ShieldAlert size={13} className="text-red-400 animate-pulse" />
              <span className="hidden sm:inline">Alerts</span>
              <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-black text-[9px] font-bold">
                {ACTIVE_DISASTER_ALERTS.length}
              </span>
            </button>

            {/* Voice AI Copilot Quick Button */}
            <button
              onClick={() => setShowVoiceAssistant(true)}
              title="Launch Voice-Enabled AI Copilot"
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-500/40 text-cyan-200 text-xs font-mono font-bold transition-all cursor-pointer flex-shrink-0"
            >
              <Mic size={13} className="text-cyan-400 animate-pulse" />
              <span className="hidden md:inline">Voice</span>
            </button>

            {/* 3D Engine Toggle: Three.js vs CesiumJS */}
            <button
              onClick={() => setGlobeEngine((e) => (e === 'three' ? 'cesium' : 'three'))}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-mono font-medium transition-all cursor-pointer flex-shrink-0 ${
                globeEngine === 'cesium'
                  ? 'bg-purple-600/40 text-purple-200 border-purple-400/60'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
              title="Toggle between Three.js Physics Engine and CesiumJS WGS84 Geodesic Engine"
            >
              <Globe2 size={13} className={globeEngine === 'cesium' ? 'text-purple-400' : 'text-cyan-400'} />
              <span className="hidden sm:inline">{globeEngine === 'three' ? 'Three.js' : 'Cesium'}</span>
            </button>

            {/* Unified Control Dock Toggle */}
            <button
              onClick={() => setIsDockOpen((d) => !d)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex-shrink-0 ${
                isDockOpen
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                  : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
              }`}
              title="Toggle Scientific Layer & Dimension Controls Dock"
            >
              <Sliders size={13} />
              <span className="hidden sm:inline">Controls</span>
            </button>

            {/* Quick 4-Sided Portion Drag Button */}
            <button
              onClick={() => {
                setIsSelectingPortion((p) => !p)
                if (isCirclingPlace) setIsCirclingPlace(false)
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border flex-shrink-0 ${
                isSelectingPortion
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm animate-pulse'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-400/40 text-cyan-300'
              }`}
              title="Drag a 4-sided portion directly on the globe and inspect 3D volumetric depth"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span className="hidden md:inline">{isSelectingPortion ? 'Cancel' : 'Drag'}</span>
            </button>

            {/* Dedicated Circular Place Sonar Selector */}
            <button
              onClick={() => {
                setIsCirclingPlace((c) => !c)
                if (isSelectingPortion) setIsSelectingPortion(false)
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border flex-shrink-0 ${
                isCirclingPlace
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black border-cyan-300 shadow-md shadow-cyan-500/40 animate-pulse'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-400/40 text-cyan-300'
              }`}
              title="Circle over any place on the globe to open its 3D marine ecosystem isolation view"
            >
              <CircleDot size={13} strokeWidth={2.5} className={isCirclingPlace ? 'animate-spin' : ''} />
              <span className="hidden md:inline">{isCirclingPlace ? 'Cancel Circle' : 'Circle Place'}</span>
            </button>

            {/* Consolidated Tools Dropdown */}
            <div className="relative flex-shrink-0" ref={toolsDropdownRef}>
              <button
                onClick={() => setIsToolsDropdownOpen((o) => !o)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                  isToolsDropdownOpen
                    ? 'bg-cyan-950 text-cyan-200 border-cyan-400/60 shadow-md'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
                title="Open Advanced Analysis & Data Tools Menu"
              >
                <Wrench size={12} className="text-cyan-400" />
                <span>Tools</span>
                <ChevronDown size={11} className={`transition-transform duration-200 ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Tools Dropdown Menu */}
              {isToolsDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-[#030d1a]/98 backdrop-blur-xl border border-cyan-500/30 shadow-2xl p-2 z-50 animate-fade-in font-mono text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-cyan-400/80 uppercase border-b border-white/10 mb-1">
                    Simulation & Analysis
                  </div>

                  {/* Weather Predictor */}
                  <button
                    onClick={() => {
                      setIsToolsDropdownOpen(false)
                      setShowWeatherPredictor(true)
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer group"
                  >
                    <CloudSun size={14} className="text-amber-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-[11px]">Weather Predictor</span>
                      <span className="text-[9px] text-slate-400 font-sans">7-Day Synoptic Storm Forecast</span>
                    </div>
                  </button>

                  {/* Model Comparison */}
                  <button
                    onClick={() => {
                      setIsToolsDropdownOpen(false)
                      setShowModelComparison(true)
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer group"
                  >
                    <Scale size={14} className="text-purple-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-[11px]">Model Cross-Validation</span>
                      <span className="text-[9px] text-slate-400 font-sans">INCOIS vs Copernicus & HYCOM</span>
                    </div>
                  </button>

                  {/* Place Ecosystem Isolation View */}
                  <button
                    onClick={() => {
                      setIsToolsDropdownOpen(false)
                      setEcosystemPlaceName(selectedRegion)
                      setShowPlaceEcosystem(true)
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer group"
                  >
                    <Fish size={14} className="text-emerald-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-[11px]">Ecosystem Isolation</span>
                      <span className="text-[9px] text-slate-400 font-sans">3D Marine Biodiversity Explorer</span>
                    </div>
                  </button>

                  <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-cyan-400/80 uppercase border-b border-white/10 mt-1 mb-1">
                    Display & Data Ops
                  </div>

                  {/* Basemap Toggle */}
                  <button
                    onClick={() => {
                      setGlobeMode((m) => (m === 'satellite' ? 'heatmap' : 'satellite'))
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      {globeMode === 'satellite' ? (
                        <Satellite size={14} className="text-cyan-400 flex-shrink-0" />
                      ) : (
                        <Globe size={14} className="text-cyan-400 flex-shrink-0" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-[11px]">Basemap Mode</span>
                        <span className="text-[9px] text-slate-400 font-sans">
                          {globeMode === 'satellite' ? 'Satellite Imagery' : 'Model Heatmap'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold">
                      {globeMode === 'satellite' ? 'SAT' : 'GRID'}
                    </span>
                  </button>

                  {/* Ingest Data */}
                  <button
                    onClick={() => {
                      setIsToolsDropdownOpen(false)
                      setShowIngestionWizard(true)
                    }}
                    id="ingest-data-btn"
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer group"
                  >
                    <Database size={14} className="text-emerald-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-[11px]">Ingest Datasets</span>
                      <span className="text-[9px] text-slate-400 font-sans">NetCDF, CSV, Excel, GeoJSON</span>
                    </div>
                  </button>

                  {/* CF-Metadata */}
                  <button
                    onClick={() => {
                      setIsToolsDropdownOpen(false)
                      setIsDatasetModalOpen(true)
                    }}
                    id="dataset-info-btn"
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer group"
                  >
                    <Info size={14} className="text-cyan-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-[11px]">Dataset Metadata</span>
                      <span className="text-[9px] text-slate-400 font-sans">CF-1.8 Provenance & Attributes</span>
                    </div>
                  </button>

                  {/* Presentation Mode */}
                  <button
                    onClick={() => {
                      setIsToolsDropdownOpen(false)
                      setIsPresentationMode(true)
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer group border-t border-white/10 mt-1 pt-1.5"
                  >
                    <Tv size={14} className="text-slate-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-[11px]">Fullscreen Mode</span>
                      <span className="text-[9px] text-slate-400 font-sans">Distraction-free kiosk view</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ── MAIN 3D WORKSPACE ───────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        <main className="flex-1 relative overflow-hidden min-w-0 min-h-0 bg-[radial-gradient(ellipse_at_center,#071c38_0%,#030a17_55%,#01040a_100%)]">

          {/* Data Ingestion Wizard */}
          {showIngestionWizard && (
            <DataIngestionWizard onClose={() => setShowIngestionWizard(false)} />
          )}
          {/* 3D Scene Viewport */}
          <div className="absolute inset-0 isolate">
            {globeEngine === 'cesium' ? (
              <CesiumGlobeViewer
                observations={state.observations}
                selectedRegion={selectedRegion}
                onSelectObservation={handleSelectObs}
              />
            ) : (
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
                isCirclingPlace={isCirclingPlace}
                onCirclePlaceComplete={(result) => {
                  setIsCirclingPlace(false)
                  setEcosystemPlaceName(result.placeName)
                  setShowPlaceEcosystem(true)
                }}
                onCancelCirclePlace={() => setIsCirclingPlace(false)}
              />
            )}
          </div>

          {/* Floating Guidance Banner during 4-Sided Portion Drag */}
          {isSelectingPortion && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/90 border border-cyan-400 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 font-mono text-xs text-white backdrop-blur-md animate-fade-in pointer-events-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Click and drag directly on the globe to draw a 4-sided ocean portion</span>
              <button
                onClick={() => setIsSelectingPortion(false)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Floating Guidance Banner during Circle Place Sonar Mode */}
          {isCirclingPlace && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#030d1a]/95 border border-cyan-400 px-5 py-2.5 rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.4)] flex items-center gap-3.5 font-mono text-xs text-white backdrop-blur-md animate-fade-in pointer-events-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Hover anywhere over the Indian Ocean & click to open its 3D Marine Ecosystem Isolation View</span>
              <button
                onClick={() => setIsCirclingPlace(false)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Quick Nav Tools: Home + 4-Point Compass Rose */}
          {!isPresentationMode && (
            <div className="absolute top-4 left-3 z-10 flex flex-col items-center gap-2 pointer-events-auto">
              <button
                onClick={handleNavHome}
                title="Reset Camera to Indian Ocean"
                className="w-10 h-10 rounded-xl bg-[#030d1a]/90 hover:bg-[#06182c] border border-white/10 text-slate-300 hover:text-cyan-300 flex items-center justify-center shadow-lg transition-all cursor-pointer"
              >
                <Home size={16} />
              </button>
              <CompassRose onResetNorth={handleNavHome} />
            </div>
          )}

          {/* Hover Tooltip */}
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
              onOpenPlaceEcosystem={() => {
                setEcosystemPlaceName(selectedRegion)
                setShowPlaceEcosystem(true)
              }}
              onOpenDepthInspector={() => {
                setIsInspectorOpen(true)
                setInspectorTab('telemetry')
              }}
              onSelectObservation={(id: string | null) => {
                if (id) handleSelectObs(id)
                setPointPopup(null)
              }}
            />
          )}

          {/* Bottom Controls Bar: Time Scrubber + Colorbar */}
          {!isPresentationMode && (
            <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-end justify-between gap-3 pointer-events-none">
              <div className="flex flex-col gap-2 max-w-lg w-full">
                {/* Scientific Basin Telemetry HUD */}
                <div className="hidden sm:flex items-center gap-2.5 px-3 py-1 rounded-xl bg-[#030d1a]/85 backdrop-blur-md border border-cyan-500/20 text-[10px] font-mono text-cyan-300 w-fit pointer-events-auto shadow-lg">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    WGS84 3D GRID
                  </span>
                  <span className="text-white/20">|</span>
                  <span>REGION: <strong className="text-white">{selectedRegion}</strong></span>
                  <span className="text-white/20">|</span>
                  <span>DEPTH: <strong className="text-cyan-400">{state.selectedDepth}m</strong></span>
                  <span className="text-white/20">|</span>
                  <span>SENSORS: <strong className="text-emerald-400">{state.observations.length}</strong></span>
                </div>

                <div className="pointer-events-auto w-full bg-[#030d1a]/95 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 shadow-2xl">
                  <TimeControl
                    modelTimes={state.modelTimes}
                    selectedTimeIndex={state.selectedTimeIndex}
                    isPlaying={state.isPlaying}
                    onSelectTime={state.setSelectedTimeIndex}
                    onTogglePlay={state.togglePlay}
                    onStep={state.stepTime}
                  />
                </div>
              </div>

              <div className="pointer-events-auto bg-[#030d1a]/95 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 shadow-2xl">
                <OceanColorbar selectedVariable={state.selectedVariable} />
              </div>
            </div>
          )}

          {/* Exit Presentation Mode Button */}
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
        </main>

        {/* ── UNIFIED SCIENTIFIC CONTROL DOCK (Collapsible Side Drawer) ──── */}
        {!isPresentationMode && isDockOpen && (
          <aside className="w-80 flex-shrink-0 border-l border-white/10 bg-[#030d1a]/95 backdrop-blur-md flex flex-col z-20 overflow-hidden shadow-2xl animate-fade-in font-mono">
            {/* Dock Header & Tabs */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDockTab('layers')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    dockTab === 'layers'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Layers & Depth
                </button>
                <button
                  onClick={() => setDockTab('regions')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    dockTab === 'regions'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Regions
                </button>
                <button
                  onClick={() => setDockTab('anomalies')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    dockTab === 'anomalies'
                      ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Hazards
                </button>
              </div>
              <button
                onClick={() => setIsDockOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Dock Content Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
              {dockTab === 'layers' && (
                <div className="space-y-4">
                  <LayerControls visibleLayers={state.visibleLayers} onToggle={state.toggleLayer} />
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

              {dockTab === 'regions' && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                    Quick Geographic Focus
                  </span>
                  {REGIONS.map((r) => (
                    <button
                      key={r.name}
                      onClick={() => handleSelectRegion(r.name)}
                      className={`w-full py-2.5 px-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        selectedRegion === r.name
                          ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 font-bold'
                          : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span>{r.label}</span>
                      <Compass size={13} className="text-cyan-400" />
                    </button>
                  ))}
                </div>
              )}

              {dockTab === 'anomalies' && (
                <div className="space-y-4">
                  <AnomalyDetectionPanel onSelectAnomaly={handleSelectAnomaly} />
                  <div className="pt-3 border-t border-white/10">
                    <UnifiedRiskPanel onSelectLocation={handleSelectLocation} />
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ── RIGHT INSPECTOR PANEL (When point/sensor is clicked) ────────── */}
        {!isPresentationMode && isInspectorOpen && (
          <aside className="w-80 flex-shrink-0 border-l border-white/10 bg-[#030d1a]/95 backdrop-blur-md flex flex-col z-20 overflow-hidden shadow-2xl font-mono">
            {/* Inspector Tab Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#020b18] flex-shrink-0">
              <div className="flex gap-1">
                {(['telemetry', 'profile', 'comparison'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setInspectorTab(tab)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      inspectorTab === tab
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab === 'telemetry' ? 'Telemetry' : tab === 'profile' ? 'Profile' : 'Residuals'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Inspector Tab Content */}
            <div className="flex-1 overflow-y-auto">
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
                <div className="p-3">
                  {state.selectedObservation ? (
                    <ObservationProfile
                      observation={state.selectedObservation}
                    />
                  ) : (
                    <div className="text-center p-4 text-xs font-mono text-slate-400">
                      Click an observation float or sensor marker to view its profile.
                    </div>
                  )}
                </div>
              )}

              {inspectorTab === 'comparison' && (
                <div className="p-3">
                  {state.selectedObservation ? (
                    <ModelObservationComparison
                      observation={state.selectedObservation}
                      selectedTimeIndex={state.selectedTimeIndex}
                    />
                  ) : (
                    <div className="text-center p-4 text-xs font-mono text-slate-400">
                      Click an observation float to compare with model forecast.
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Dataset Metadata Modal */}
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

      {/* Multi-Hazard Disaster Early Warning Modal */}
      {showDisasterAlerts && (
        <DisasterAlertSystem
          onClose={() => setShowDisasterAlerts(false)}
          onFocusCoordinates={(lat, lon) => {
            const [x, y, z] = latLonToVec3(lat, lon, GLOBE_RADIUS + 0.8)
            const [tx, ty, tz] = latLonToVec3(lat, lon, GLOBE_RADIUS)
            setNavTarget({ position: [x, y, z], target: [tx, ty, tz] })
          }}
        />
      )}

      {/* 7-Day Synoptic Weather Predictor Modal */}
      {showWeatherPredictor && (
        <WeatherPredictorModal
          onClose={() => setShowWeatherPredictor(false)}
        />
      )}

      {/* Model vs. Model Comparative Validation Modal */}
      {showModelComparison && (
        <ModelComparativeViewer
          onClose={() => setShowModelComparison(false)}
        />
      )}

      {/* Interactive Place Ecosystem Isolation View */}
      {showPlaceEcosystem && (
        <PlaceEcosystemIsolationView
          initialPlaceName={ecosystemPlaceName}
          onClose={() => setShowPlaceEcosystem(false)}
        />
      )}

      {/* Voice-Enabled AI Copilot Modal */}
      <OceanAssistantModal
        isOpen={showVoiceAssistant}
        onClose={() => setShowVoiceAssistant(false)}
        onExecuteAction={(action) => {
          if (action.targetVariable) state.setSelectedVariable(action.targetVariable)
          if (action.targetDepth !== undefined) {
            const idx = state.availableDepths.indexOf(action.targetDepth)
            state.setSelectedDepthIndex(idx >= 0 ? idx : 0)
          }
          if (action.targetRegion) handleSelectRegion(action.targetRegion)
          if (action.globeMode) setGlobeMode(action.globeMode)
        }}
        onOpenDisasterAlerts={() => setShowDisasterAlerts(true)}
        onOpenWeatherPredictor={() => setShowWeatherPredictor(true)}
        onOpenModelComparison={() => setShowModelComparison(true)}
        onOpenPlaceEcosystem={(place) => {
          setEcosystemPlaceName(place)
          setShowPlaceEcosystem(true)
        }}
      />
    </div>
  )
}
