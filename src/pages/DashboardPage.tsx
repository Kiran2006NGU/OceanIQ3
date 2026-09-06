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

import { useState, useCallback, useEffect } from 'react'
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
} from 'lucide-react'

import { useDashboardState } from '@/hooks/useDashboardState'
import { AnomalyDetectionPanel, type OceanAnomaly } from '@/components/ai/AnomalyDetectionPanel'
import { UnifiedRiskPanel, type CoastalLocation } from '@/components/ocean/UnifiedRiskPanel'
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

  // Collapsible Ocean Variable Selector
  const [isVariableDropdownOpen, setIsVariableDropdownOpen] = useState(false)

  // Data Ingestion Wizard
  const [showIngestionWizard, setShowIngestionWizard] = useState(false)

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
      {/* ── TOP STREAMLINED CONTROLS BAR ────────────────────────────────── */}
      {!isPresentationMode && (
        <header className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2 border-b border-white/10 bg-[#030d1a]/95 backdrop-blur-md z-30 flex-shrink-0 gap-2">
          {/* Left: Data Status & Current Focus */}
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                state.dataSourceMode === 'api'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {state.dataSourceMode === 'api' ? '● INCOIS LIVE' : '● DEMO DATA'}
            </span>
            <span className="text-xs font-mono text-slate-300 hidden md:inline">
              Depth: <strong className="text-cyan-300">{state.selectedDepth}m</strong>
            </span>
          </div>

          {/* Center: Direct 5 Parameter Action Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {VARIABLES.map((v) => {
              const isSelected = state.selectedVariable === v.id
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    state.setSelectedVariable(v.id)
                    if (v.id === 'temperature') {
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
                    } else if (v.id === 'salinity') {
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs transition-all cursor-pointer whitespace-nowrap shadow-md ${
                    isSelected
                      ? v.id === 'temperature'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold shadow-orange-500/40 border border-orange-300 ring-2 ring-orange-400/40 scale-105'
                        : v.id === 'salinity'
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold shadow-cyan-500/40 border border-cyan-200 ring-2 ring-cyan-400/40 scale-105'
                        : v.id === 'current_velocity'
                        ? 'bg-gradient-to-r from-indigo-400 to-sky-400 text-black font-bold shadow-indigo-500/40 border border-indigo-200 ring-2 ring-indigo-400/40 scale-105'
                        : v.id === 'chlorophyll'
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-bold shadow-emerald-500/40 border border-emerald-200 ring-2 ring-emerald-400/40 scale-105'
                        : 'bg-gradient-to-r from-sky-400 to-cyan-400 text-black font-bold shadow-sky-500/40 border border-sky-200 ring-2 ring-sky-400/40 scale-105'
                      : 'bg-[#0b1322] hover:bg-[#12233b] text-slate-200 hover:text-white border border-white/15'
                  }`}
                >
                  <span className="text-sm">{v.icon}</span>
                  <span className="font-semibold">{v.label}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse ml-0.5" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Right: Basemap & Scientific Dock Toggle */}
          <div className="flex items-center gap-2">
            {/* Basemap Toggle */}
            <button
              onClick={() => setGlobeMode((m) => (m === 'satellite' ? 'heatmap' : 'satellite'))}
              title="Toggle Ocean Heatmap / Satellite Basemap"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                globeMode === 'satellite'
                  ? 'bg-cyan-950 text-cyan-200 border-cyan-500/40 font-bold'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {globeMode === 'satellite' ? <Satellite size={13} /> : <Globe size={13} />}
              <span className="hidden sm:inline">{globeMode === 'satellite' ? 'Satellite' : 'Model Grid'}</span>
            </button>

            {/* Unified Control Dock Toggle */}
            <button
              onClick={() => setIsDockOpen((d) => !d)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                isDockOpen
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-md'
                  : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
              }`}
            >
              <Sliders size={13} />
              <span>Controls</span>
            </button>

            {/* The Prominent "+" Button: 4-Sided Portion Drag Tool */}
            <button
              onClick={() => setIsSelectingPortion((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                isSelectingPortion
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/40 animate-pulse'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/35 border-cyan-400/60 text-cyan-200'
              }`}
              title="Click the + button to drag a 4-sided portion directly on the globe and get its 3D depth view"
            >
              <Plus size={15} strokeWidth={3} />
              <span>{isSelectingPortion ? 'Cancel Selection' : 'Drag Portion Depth'}</span>
            </button>

            {/* Quick 3D Depth View (Opens as a new page) */}
            <a
              href={`/depth-view?region=${encodeURIComponent(selectedRegion)}&variable=${state.selectedVariable}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open 3D Volumetric Water Column Depth View in a new page"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white text-xs font-mono transition-all cursor-pointer"
            >
              <span>3D Depth View ↗</span>
            </a>

            {/* Ingest Data Button */}
            <button
              onClick={() => setShowIngestionWizard(true)}
              title="Ingest new observational data (CSV, Excel, JSON, NetCDF)"
              id="ingest-data-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <Database size={13} />
              <span className="hidden sm:inline">Ingest Data</span>
            </button>

            {/* Dataset Provenance & Metadata */}
            <button
              onClick={() => setIsDatasetModalOpen(true)}
              title="Inspect Dataset Provenance & CF-Metadata"
              id="dataset-info-btn"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-mono transition-all cursor-pointer"
            >
              <Info size={13} className="text-cyan-400" />
              <span className="hidden xl:inline">CF Metadata</span>
            </button>

            {/* Presentation Mode */}
            <button
              onClick={() => setIsPresentationMode(true)}
              title="Full-screen Presentation Mode"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 cursor-pointer"
            >
              <Tv size={14} />
            </button>
          </div>
        </header>
      )}

      {/* ── MAIN 3D WORKSPACE ───────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        <main className="flex-1 relative overflow-hidden min-w-0 min-h-0 bg-[#010610]">

          {/* Data Ingestion Wizard */}
          {showIngestionWizard && (
            <DataIngestionWizard onClose={() => setShowIngestionWizard(false)} />
          )}
          {/* 3D Scene Viewport */}
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
              <span>Click and drag directly on the globe to draw a 4-sided ocean portion</span>
              <button
                onClick={() => setIsSelectingPortion(false)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Quick Home Nav Button */}
          {!isPresentationMode && (
            <div className="absolute top-4 left-3 z-10">
              <button
                onClick={handleNavHome}
                title="Reset Camera to Indian Ocean"
                className="w-9 h-9 rounded-xl bg-[#030d1a]/90 hover:bg-[#06182c] border border-white/10 text-slate-300 hover:text-cyan-300 flex items-center justify-center shadow-lg transition-all cursor-pointer"
              >
                <Home size={16} />
              </button>
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
              <div className="pointer-events-auto max-w-lg w-full bg-[#030d1a]/95 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 shadow-2xl">
                <TimeControl
                  modelTimes={state.modelTimes}
                  selectedTimeIndex={state.selectedTimeIndex}
                  isPlaying={state.isPlaying}
                  onSelectTime={state.setSelectedTimeIndex}
                  onTogglePlay={state.togglePlay}
                  onStep={state.stepTime}
                />
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
    </div>
  )
}
