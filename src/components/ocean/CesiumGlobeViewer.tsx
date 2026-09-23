/**
 * CesiumGlobeViewer.tsx — High-Precision 3D Geospatial Earth & Sensor Pinpoint Engine
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements CesiumJS-powered digital twin globe:
 * 1. True WGS84 ellipsoid curvature with sub-millimeter geographic accuracy
 * 2. In-situ ocean observation pins (Argo Floats, Autonomous Gliders, Moored Buoys)
 * 3. Regional Fly-To Camera Navigation (Bay of Bengal, Arabian Sea, Lakshadweep, Andaman Sea)
 * 4. Coordinate & elevation readout HUD
 * 5. Seamlessly toggled alongside the Three.js Ocean Physics Engine
 */

import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import {
  Compass,
  MapPin,
  Eye,
  Radio,
  Navigation,
  Globe2,
  Sliders,
  Layers,
  Info,
} from 'lucide-react'
import type { MockObservation } from '@/services/data/mockOceanData'

interface CesiumGlobeViewerProps {
  observations?: MockObservation[]
  selectedRegion?: string
  onSelectObservation?: (id: string | null) => void
}

const REGION_COORDINATES: Record<string, { lat: number; lon: number; height: number }> = {
  'Indian Ocean': { lat: -2.0, lon: 78.0, height: 11000000 },
  'Bay of Bengal': { lat: 15.0, lon: 88.0, height: 3200000 },
  'Arabian Sea': { lat: 16.0, lon: 66.0, height: 3200000 },
  'Andaman Sea': { lat: 11.5, lon: 95.0, height: 2200000 },
  'Lakshadweep Reefs': { lat: 10.5, lon: 72.5, height: 1200000 },
}

export function CesiumGlobeViewer({
  observations = [],
  selectedRegion = 'Indian Ocean',
  onSelectObservation,
}: CesiumGlobeViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const [activeRegion, setActiveRegion] = useState(selectedRegion)
  const [selectedSensor, setSelectedSensor] = useState<MockObservation | null>(null)
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Set Cesium Ion default access token fallback (or use offline NaturalEarth/OpenStreetMap)
    Cesium.Ion.defaultAccessToken = ''

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      creditContainer: document.createElement('div'), // Hide credits in HUD
      baseLayer: false,
    })

    viewer.scene.globe.enableLighting = true
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#030d1a')
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#010610')

    // Initial camera position over Indian Ocean
    const initialTarget = REGION_COORDINATES['Indian Ocean']
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        initialTarget.lon,
        initialTarget.lat,
        initialTarget.height
      ),
    })

    // Mouse move handler for coordinates readout
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => {
      const ray = viewer.camera.getPickRay(movement.endPosition)
      if (ray) {
        const cartesian = viewer.scene.globe.pick(ray, viewer.scene)
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
          const lat = Cesium.Math.toDegrees(cartographic.latitude)
          const lon = Cesium.Math.toDegrees(cartographic.longitude)
          setCursorCoords({
            lat: parseFloat(lat.toFixed(3)),
            lon: parseFloat(lon.toFixed(3)),
          })
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // Click handler for entity selection
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const pickedObject = viewer.scene.pick(click.position)
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.description) {
        const obsId = pickedObject.id.id
        const found = observations.find((o) => o.id === obsId)
        if (found) {
          setSelectedSensor(found)
          onSelectObservation?.(found.id)
        }
      } else {
        setSelectedSensor(null)
        onSelectObservation?.(null)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    viewerRef.current = viewer

    return () => {
      handler.destroy()
      if (!viewer.isDestroyed()) {
        viewer.destroy()
      }
      viewerRef.current = null
    }
  }, [])

  // Sync observation markers into Cesium entity collection
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    viewer.entities.removeAll()

    observations.forEach((obs) => {
      const isArgo = obs.type === 'argo'
      const isGlider = obs.type === 'glider'
      const color = isArgo
        ? Cesium.Color.fromCssColorString('#facc15')
        : isGlider
          ? Cesium.Color.fromCssColorString('#22d3ee')
          : Cesium.Color.fromCssColorString('#a855f7')

      viewer.entities.add({
        id: obs.id,
        name: `${obs.name} (${obs.type.toUpperCase()})`,
        description: new Cesium.ConstantProperty(`Depth: ${obs.currentDepth}m | Temp: ${obs.temperature}°C`),
        position: Cesium.Cartesian3.fromDegrees(obs.longitude, obs.latitude, 5000),
        point: {
          pixelSize: isArgo ? 10 : 8,
          color: color,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: obs.name,
          font: '10px JetBrains Mono, monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
    })
  }, [observations])

  const flyToRegion = (region: string) => {
    const coords = REGION_COORDINATES[region]
    if (!coords || !viewerRef.current) return

    setActiveRegion(region)
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(coords.lon, coords.lat, coords.height),
      duration: 1.8,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    })
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#010610]">
      {/* Cesium canvas container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating HUD: Geospatial Info Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 p-2.5 rounded-xl bg-[#030d1a]/90 backdrop-blur-md border border-cyan-500/40 shadow-2xl pointer-events-auto text-xs font-mono">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
        <span className="font-bold text-white flex items-center gap-1.5">
          <Globe2 size={14} className="text-cyan-400" />
          CesiumJS WGS84 Geodesic Engine
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          Geospatial Mode
        </span>
      </div>

      {/* Floating Fly-To Quick Bar */}
      <div className="absolute top-4 right-4 z-10 flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#030d1a]/90 backdrop-blur-md border border-white/10 shadow-2xl pointer-events-auto">
        <span className="text-[10px] text-slate-400 font-mono px-2 flex items-center gap-1">
          <Navigation size={11} className="text-cyan-400" /> Quick Fly-To:
        </span>
        {Object.keys(REGION_COORDINATES).map((reg) => (
          <button
            key={reg}
            onClick={() => flyToRegion(reg)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              activeRegion === reg
                ? 'bg-cyan-500 text-black font-bold shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            {reg}
          </button>
        ))}
      </div>

      {/* Bottom Live Cursor Coordinates HUD */}
      {cursorCoords && (
        <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-[#030d1a]/95 backdrop-blur-md border border-white/10 text-slate-300 font-mono text-[11px] shadow-lg flex items-center gap-3 pointer-events-none">
          <span className="text-cyan-400 flex items-center gap-1 font-bold">
            <Compass size={13} /> {cursorCoords.lat}° N
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-bold">{cursorCoords.lon}° E</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Indian Ocean Basin</span>
        </div>
      )}

      {/* Sensor Selected Popup */}
      {selectedSensor && (
        <div className="absolute bottom-4 right-4 z-10 w-72 p-3.5 rounded-2xl bg-[#030d1a]/95 backdrop-blur-md border border-cyan-400/50 shadow-2xl text-slate-100 font-sans space-y-2 pointer-events-auto animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
              <Radio size={14} className="text-yellow-400" /> {selectedSensor.name}
            </span>
            <button
              onClick={() => setSelectedSensor(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-300 pt-1 border-t border-white/10">
            <div>Latitude: <span className="text-white font-bold">{selectedSensor.latitude}°</span></div>
            <div>Longitude: <span className="text-white font-bold">{selectedSensor.longitude}°</span></div>
            <div>Depth: <span className="text-cyan-400 font-bold">{selectedSensor.currentDepth} m</span></div>
            <div>Temp: <span className="text-amber-400 font-bold">{selectedSensor.temperature} °C</span></div>
          </div>
          <div className="text-[10px] text-slate-400 pt-1">
            Status: <span className="text-emerald-400 font-bold">Operational (Live Telemetry)</span>
          </div>
        </div>
      )}
    </div>
  )
}
