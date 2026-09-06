/**
 * Globe3DPage.tsx — Dedicated Standalone 3D Ocean Globe Viewport
 * Route: /globe
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */

import { useState, useCallback } from 'react'
import { OceanScene } from '@/components/ocean/OceanScene'
import { useDashboardState } from '@/hooks/useDashboardState'
import { OceanColorbar } from '@/components/ocean/OceanColorbar'
import { TimeControl } from '@/components/controls/TimeControl'
import { AnomalyDetectionPanel, type OceanAnomaly } from '@/components/ai/AnomalyDetectionPanel'
import { OceanAssistantModal } from '@/components/ai/OceanAssistantModal'
import { type CameraNavTarget } from '@/components/ocean/CameraController'
import { latLonToVec3, GLOBE_RADIUS } from '@/utils/geoUtils'
import { Compass, Sparkles, ShieldAlert } from 'lucide-react'

export function Globe3DPage() {
  const state = useDashboardState()
  const [globeMode, setGlobeMode] = useState<'heatmap' | 'satellite'>('heatmap')
  const [visibleModelVolume, setVisibleModelVolume] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('Bay of Bengal')
  const [navTarget, setNavTarget] = useState<CameraNavTarget | null>(null)
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false)
  const [showAnomalyDrawer, setShowAnomalyDrawer] = useState(false)

  const handleSelectAnomaly = useCallback(
    (anomaly: OceanAnomaly) => {
      state.setSelectedVariable(anomaly.variable)
      const idx = state.availableDepths.indexOf(anomaly.depth)
      state.setSelectedDepthIndex(idx >= 0 ? idx : 0)
      setSelectedRegion(anomaly.region)
      setVisibleModelVolume(true)

      const [x, y, z] = latLonToVec3(anomaly.lat, anomaly.lon, GLOBE_RADIUS + 0.9)
      const [tx, ty, tz] = latLonToVec3(anomaly.lat, anomaly.lon, GLOBE_RADIUS)
      setNavTarget({
        position: [x, y, z],
        target: [tx, ty, tz],
      })
    },
    [state]
  )

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#010610] text-slate-100 relative select-none font-sans">
      {/* Immersive 3D Canvas Header HUD */}
      <header className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#030d1a]/80 backdrop-blur-md border border-white/10 pointer-events-auto shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold font-mono text-white">Full-Screen 3D Globe</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
            {state.selectedVariable.toUpperCase()} ({state.selectedDepth}m)
          </span>
        </div>

        {/* Quick Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowAnomalyDrawer((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs font-mono font-bold backdrop-blur-md shadow-lg transition-all"
          >
            <ShieldAlert size={14} className="text-red-400" />
            <span>AI Threats</span>
          </button>

          <button
            onClick={() => setIsAiAssistantOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/40 hover:bg-cyan-600/60 border border-cyan-400/50 text-cyan-200 text-xs font-mono font-bold backdrop-blur-md shadow-lg transition-all"
          >
            <Sparkles size={14} className="text-cyan-400" />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => setGlobeMode((m) => (m === 'satellite' ? 'heatmap' : 'satellite'))}
            className="p-2 rounded-lg bg-[#030d1a]/80 hover:bg-white/10 border border-white/10 text-slate-200 backdrop-blur-md transition-colors"
            title="Toggle Globe Mode"
          >
            <Compass size={16} />
          </button>
        </div>
      </header>

      {/* Floating Anomaly Threat Drawer */}
      {showAnomalyDrawer && (
        <div className="absolute top-16 right-3 z-40 w-80 p-3 rounded-xl bg-[#030d1a]/95 backdrop-blur-md border border-cyan-500/40 shadow-2xl space-y-3">
          <div className="flex items-center justify-between text-xs font-bold font-mono text-white">
            <span>AI Threat Detection</span>
            <button onClick={() => setShowAnomalyDrawer(false)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
          <AnomalyDetectionPanel onSelectAnomaly={handleSelectAnomaly} />
        </div>
      )}

      {/* Main 3D Canvas */}
      <div className="flex-1 relative isolate">
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
          visibleVolumetricBlock={visibleModelVolume}
          visibleGliderPath={true}
          selectedRegion={selectedRegion}
          verticalExaggeration={state.verticalExaggeration}
          navTarget={navTarget}
          onNavComplete={() => setNavTarget(null)}
          onSelectObservation={state.setSelectedObservationId}
          onSelectAnomaly={handleSelectAnomaly}
        />
      </div>

      {/* Footer Timeline & Colorbar */}
      <footer className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-4 p-2 px-3 rounded-xl bg-[#030d1a]/85 backdrop-blur-md border border-white/10 shadow-2xl">
        <div className="flex-1 max-w-xl">
          <TimeControl
            modelTimes={state.modelTimes}
            selectedTimeIndex={state.selectedTimeIndex}
            isPlaying={state.isPlaying}
            onSelectTime={state.setSelectedTimeIndex}
            onTogglePlay={state.togglePlay}
            onStep={state.stepTime}
          />
        </div>
        <OceanColorbar selectedVariable={state.selectedVariable} />
      </footer>

      {/* AI Assistant Modal */}
      <OceanAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        onExecuteAction={(act) => {
          if (act.targetVariable) state.setSelectedVariable(act.targetVariable)
          if (act.targetDepth !== undefined) {
            const idx = state.availableDepths.indexOf(act.targetDepth)
            state.setSelectedDepthIndex(idx >= 0 ? idx : 0)
          }
          if (act.globeMode) setGlobeMode(act.globeMode)
        }}
      />
    </div>
  )
}
