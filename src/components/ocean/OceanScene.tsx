/**
 * OceanScene.tsx — React Three Fiber Canvas Scene
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Supports:
 * 1. BasemapProvider (OceanBasemap) with procedural satellite & heatmap modes
 * 2. 3D Sub-surface Volumetric Ocean Water Column Block with depth stratification
 * 3. Autonomous Glider & Sawtooth Telemetry Path
 * 4. In-situ observation markers (Argo floats, gliders, CTD stations)
 * 5. Scientific Region Boundaries with Lat/Lon tags
 * 6. Smooth CameraController (Home View, Reset North, Zoom to Region, Focus Observation)
 * 7. SelectionTarget crosshair & OceanHoverTooltip HUD
 */

import { useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { ThreeEvent } from '@react-three/fiber'
import type { OceanVariable, ModelPointMeasurement } from '@/types/ocean'
import type { MockObservation, ModelTime } from '@/services/data/mockOceanData'
import type { VisibleLayers } from '@/hooks/useDashboardState'
import { OceanBasemap, type BasemapProvider } from '../maps/OceanBasemap'
import { VolumetricOceanBlock } from './VolumetricOceanBlock'
import { ObservationMarkers } from './ObservationMarkers'
import { ArgoDivePaths } from './ArgoDivePaths'
import { DepthSlice } from './DepthSlice'
import { CurrentVectors } from './CurrentVectors'
import { CurrentStreamlines } from './CurrentStreamlines'
import { GlobeValueLabels } from './GlobeValueLabels'
import { BiologicalLayers } from './BiologicalLayers'
import { SeaLevelLayer } from './SeaLevelLayer'
import { IsosurfaceLayer } from './IsosurfaceLayer'
import { SelectionTarget } from './SelectionTarget'
import { RegionBoundary } from './RegionBoundary'
import { CelestialStarField } from './CelestialStarField'
import { CameraController, type CameraNavTarget } from './CameraController'
import { AnomalyMarkers } from './AnomalyMarkers'
import type { OceanAnomaly } from '../ai/AnomalyDetectionPanel'
import { PortionSelectionOverlay, type SelectedPortionBounds } from './PortionSelectionOverlay'

interface OceanSceneProps {
  selectedVariable: OceanVariable
  selectedDepth: number
  continuousDepth?: number
  availableDepths?: number[]
  selectedTimeIndex: number
  selectedTime: ModelTime
  selectedObservationId: string | null
  observations: MockObservation[]
  visibleLayers: VisibleLayers
  autoRotate: boolean
  globeMode?: BasemapProvider
  visibleVolumetricBlock?: boolean
  visibleGliderPath?: boolean
  selectedRegion?: string
  verticalExaggeration?: number
  navTarget?: CameraNavTarget | null
  onNavComplete?: () => void
  onSelectObservation: (id: string | null) => void
  onHoverModelPoint?: (m: ModelPointMeasurement, e: ThreeEvent<PointerEvent>) => void
  onUnhoverModelPoint?: () => void
  onClickModelPoint?: (m: ModelPointMeasurement) => void
  selectedMeasurement?: ModelPointMeasurement | null
  onSelectAnomaly?: (anomaly: OceanAnomaly) => void
  isSelectingPortion?: boolean
  onPortionSelected?: (bounds: SelectedPortionBounds) => void
  onCancelPortionSelection?: () => void
}

export type { OrbitControlsImpl }

// Regional 3D volume positioning over the globe
const REGION_OFFSETS: Record<string, { position: [number, number, number]; rotation: [number, number, number] }> = {
  'Bay of Bengal': { position: [0.42, 0.42, 1.88], rotation: [0.15, -0.28, 0.05] },
  'Arabian Sea': { position: [-0.46, 0.44, 1.86], rotation: [0.15, 0.28, -0.05] },
  'Andaman Sea': { position: [0.72, 0.28, 1.78], rotation: [0.10, -0.42, 0.08] },
  'Equatorial Indian Ocean': { position: [0.05, -0.15, 1.95], rotation: [-0.08, -0.05, 0] },
}

export function OceanScene({
  selectedVariable,
  selectedDepth,
  continuousDepth,
  availableDepths,
  selectedTimeIndex,
  selectedTime,
  selectedObservationId,
  observations,
  visibleLayers,
  autoRotate,
  globeMode = 'heatmap',
  visibleVolumetricBlock = false,
  visibleGliderPath = true,
  selectedRegion = 'Bay of Bengal',
  verticalExaggeration = 1,
  navTarget = null,
  onNavComplete,
  onSelectObservation,
  onHoverModelPoint,
  onUnhoverModelPoint,
  onClickModelPoint,
  selectedMeasurement,
  onSelectAnomaly,
  isSelectingPortion = false,
  onPortionSelected,
  onCancelPortionSelection,
}: OceanSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  // Click on empty canvas → deselect observation
  const handleCanvasClick = useCallback(() => {
    onSelectObservation(null)
  }, [onSelectObservation])

  const regionOffset = REGION_OFFSETS[selectedRegion] ?? REGION_OFFSETS['Bay of Bengal']

  return (
    <Canvas
      camera={{ position: [0.35, 0.65, 3.9], fov: 42, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
      onClick={handleCanvasClick}
    >
      {/* ── Studio & Sunlight Lighting (Brightened for scientific clarity) ── */}
      <ambientLight intensity={1.1} color="#e8f4fd" />
      <directionalLight
        position={[6, 5, 4]}
        intensity={1.9}
        color="#ffffff"
        castShadow={false}
      />
      {/* Fill light from opposite side to eliminate dark zones */}
      <directionalLight position={[-5, -2, -3]} intensity={0.7} color="#90cdf4" />
      <pointLight position={[-4, -3, -3]} intensity={0.6} color="#38bdf8" />
      {/* Subtle back glow for depth */}
      <pointLight position={[0, 0, -6]} intensity={0.3} color="#1e3a5f" />

      {/* ── Refined Clustered Celestial Starfield (Realistic Milky Way Band, not everywhere) ── */}
      <CelestialStarField />

      {/* ── Camera Interpolation Controller ── */}
      <CameraController
        controlsRef={controlsRef}
        navTarget={navTarget}
        onNavComplete={onNavComplete}
      />

      {/* ── Globe Basemap (Procedural Satellite or Ocean Model Heatmap) ── */}
      {visibleLayers.oceanModel && (
        <OceanBasemap
          provider={globeMode}
          selectedVariable={selectedVariable}
          selectedDepth={selectedDepth}
          selectedTimeIndex={selectedTimeIndex}
          selectedTime={selectedTime}
        />
      )}

      {/* ── Scientific Region Boundary Lines & Labels ── */}
      <RegionBoundary
        selectedRegion={selectedRegion}
        visible={true}
      />

      {/* ── 3D Volumetric Water Column Block (Digital Twin Extrusion) ── */}
      {visibleVolumetricBlock && (
        <VolumetricOceanBlock
          selectedVariable={selectedVariable}
          selectedDepth={selectedDepth}
          verticalExaggeration={verticalExaggeration}
          visibleModelVolume={visibleVolumetricBlock}
          visibleGliderPath={visibleGliderPath}
          gliderId="SG-152"
          regionName={selectedRegion}
          position={regionOffset.position}
          rotation={regionOffset.rotation}
          scale={0.92}
          onHoverModelPoint={onHoverModelPoint}
          onUnhoverModelPoint={onUnhoverModelPoint}
          onClickModelPoint={onClickModelPoint}
        />
      )}

      {/* ── Depth Slice (Global indicator when volumetric block hidden) ── */}
      {visibleLayers.depthSlice && !visibleVolumetricBlock && (
        <DepthSlice
          selectedDepth={continuousDepth ?? selectedDepth}
          selectedVariable={selectedVariable}
          selectedTimeIndex={selectedTimeIndex}
          selectedTime={selectedTime}
          verticalExaggeration={verticalExaggeration}
          availableDepths={availableDepths}
          onHoverModelPoint={onHoverModelPoint}
          onUnhoverModelPoint={onUnhoverModelPoint}
          onClickModelPoint={onClickModelPoint}
        />
      )}

      {/* ── 3D Isosurface Layer (Concept 7) ── */}
      {visibleLayers.isosurface && (
        <IsosurfaceLayer
          selectedVariable={selectedVariable}
          isovalue={selectedVariable === 'salinity' ? 35.0 : selectedVariable === 'chlorophyll' ? 0.35 : 26.0}
          selectedTimeIndex={selectedTimeIndex}
          verticalExaggeration={verticalExaggeration}
          visible={visibleLayers.isosurface}
        />
      )}

      {/* ── Surface Current Vectors ── */}
      {visibleLayers.currentVectors && (
        <CurrentVectors
          selectedDepth={selectedDepth}
          selectedTimeIndex={selectedTimeIndex}
          selectedTime={selectedTime}
        />
      )}

      {/* ── Dynamic Current Streamlines (Particles) ── */}
      {visibleLayers.currentStreamlines && (
        <CurrentStreamlines
          selectedDepth={selectedDepth}
          visible={visibleLayers.currentStreamlines}
        />
      )}

      {/* ── Sea Level (SSH) Layer ── */}
      {visibleLayers.seaLevel && (
        <SeaLevelLayer visible={visibleLayers.seaLevel} />
      )}

      {/* ── Biological Layers (Phytoplankton, Zooplankton, PFZ Fish) ── */}
      <BiologicalLayers
        visibleLayers={visibleLayers}
        selectedDepth={selectedDepth}
      />

      {/* ── Live Floating Numerical Parameter Labels ── */}
      {visibleLayers.valueLabels && (
        <GlobeValueLabels
          selectedVariable={selectedVariable}
          selectedDepth={selectedDepth}
          selectedTimeIso={selectedTime?.isoString}
          selectedTimeIndex={selectedTimeIndex}
          visible={visibleLayers.valueLabels}
        />
      )}

      {/* ── In-Situ Observation Markers (Argo 3D Tubes, Glider, CTD) ── */}
      {visibleLayers.argo && (
        <ArgoDivePaths
          observations={observations.filter((o) => o.type === 'argo')}
          selectedId={selectedObservationId}
          selectedTime={selectedTime}
          onSelect={onSelectObservation}
          onHover={
            onHoverModelPoint
              ? (obs, e) => {
                onHoverModelPoint(
                  {
                    latitude: obs.latitude,
                    longitude: obs.longitude,
                    depth: obs.currentDepth,
                    variable: selectedVariable,
                    value: obs.temperature,
                    unit: '°C',
                    timestamp: obs.timestamp,
                    isNearestGridPoint: false,
                    nearestLat: obs.latitude,
                    nearestLon: obs.longitude,
                  },
                  e
                )
              }
              : undefined
          }
          onUnhover={onUnhoverModelPoint}
          visibleDiveTubes={true}
        />
      )}

      {(visibleLayers.glider || visibleLayers.ctd) && (
        <ObservationMarkers
          observations={observations.filter((o) => o.type !== 'argo')}
          visibleArgo={false}
          visibleGlider={visibleLayers.glider}
          visibleCtd={visibleLayers.ctd}
          selectedId={selectedObservationId}
          selectedTime={selectedTime}
          onSelect={onSelectObservation}
          onHover={
            onHoverModelPoint
              ? (obs, e) => {
                onHoverModelPoint(
                  {
                    latitude: obs.latitude,
                    longitude: obs.longitude,
                    depth: obs.currentDepth,
                    variable: selectedVariable,
                    value: obs.temperature,
                    unit: '°C',
                    timestamp: obs.timestamp,
                    isNearestGridPoint: false,
                    nearestLat: obs.latitude,
                    nearestLon: obs.longitude,
                  },
                  e
                )
              }
              : undefined
          }
          onUnhover={onUnhoverModelPoint}
        />
      )}

      {/* ── 3D Pulsing Crosshair on Selected Model Point ── */}
      <SelectionTarget measurement={selectedMeasurement ?? null} />

      {/* ── AI Threat Anomaly Pulsing Rings (Hidden during portion selection) ── */}
      {onSelectAnomaly && !isSelectingPortion && <AnomalyMarkers onSelectAnomaly={onSelectAnomaly} />}

      {/* ── Interactive 4-Sided Portion Drag Selector ── */}
      {isSelectingPortion && onPortionSelected && (
        <PortionSelectionOverlay
          isActive={isSelectingPortion}
          onSelectionComplete={onPortionSelected}
          onCancel={onCancelPortionSelection ?? (() => { })}
        />
      )}

      {/* ── Smooth Orbit Controls ── */}
      <OrbitControls
        ref={controlsRef}
        enablePan={!isSelectingPortion}
        enableZoom
        enableRotate={!isSelectingPortion}
        autoRotate={autoRotate && !isSelectingPortion}
        autoRotateSpeed={0.35}
        minDistance={2.2}
        maxDistance={12}
        target={[0.15, 0.1, 0]}
      />
    </Canvas>
  )
}
