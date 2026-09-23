/**
 * DepthSlice.tsx — Interactive Scientific Depth Slicing Plane & Layer
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements Concept 6:
 * 1. Horizontal cross-section visualization of the selected scalar variable at user-chosen depth.
 * 2. High-performance dynamic 2D canvas texture generation with strict land masking.
 * 3. Exact vs Interpolated level differentiation and continuous depth evaluation.
 * 4. 3D spatial alignment using centralized coordinate conversion (latLonToVec3 / vec3ToLatLon).
 * 5. Interactive pointer hover & click measurement sampling at the slice plane.
 * 6. Visual depth level HUD badge and concentric contour guides.
 */

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { GLOBE_RADIUS, vec3ToLatLon, isLandCoordinate } from '@/utils/geoUtils'
import type { OceanVariable, ModelPointMeasurement } from '@/types/ocean'
import { getMeasurementImmediate } from '@/utils/measurementCache'
import { valueToRGB, VARIABLE_COLOR_CONFIGS } from '@/utils/oceanColorScale'
import { getOceanValueSync, getDataSourceOceanField } from '@/services/data/dataSource'
import type { ModelTime } from '@/services/data/mockOceanData'

interface DepthSliceProps {
  selectedDepth: number // metres
  maxDepth?: number     // default 2000m
  selectedVariable?: OceanVariable
  selectedTimeIndex?: number
  selectedTime?: ModelTime
  verticalExaggeration?: number
  availableDepths?: number[]
  opacity?: number
  onHoverModelPoint?: (m: ModelPointMeasurement, e: ThreeEvent<PointerEvent>) => void
  onUnhoverModelPoint?: () => void
  onClickModelPoint?: (m: ModelPointMeasurement) => void
}

const MAX_DISC_RADIUS = GLOBE_RADIUS * 1.01

export function DepthSlice({
  selectedDepth,
  maxDepth = 2000,
  selectedVariable = 'temperature',
  selectedTimeIndex = 2,
  selectedTime,
  verticalExaggeration = 1.0,
  availableDepths,
  opacity = 0.85,
  onHoverModelPoint,
  onUnhoverModelPoint,
  onClickModelPoint,
}: DepthSliceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)

  // Depth fraction [0, 1]
  const depthFraction = Math.min(1, Math.max(0, selectedDepth / maxDepth))

  // Disc radius shrinks subtly with depth for tapered visual clarity
  const discRadius = MAX_DISC_RADIUS * (1 - depthFraction * 0.18)

  // Vertical position with vertical exaggeration
  const yPosition = -(depthFraction * 0.3) * Math.min(2.5, 0.8 + (verticalExaggeration - 1) * 0.2)

  // Check if current depth is an exact available dataset depth
  const isExact = availableDepths ? availableDepths.some((d) => Math.abs(d - selectedDepth) < 0.5) : false

  // Variable metadata
  const varConfig = VARIABLE_COLOR_CONFIGS[selectedVariable] ?? VARIABLE_COLOR_CONFIGS.temperature

  // ── 1. Create Canvas & CanvasTexture in Memory ──────────────────────────────
  const { texture } = useMemo(() => {
    const cvs = document.createElement('canvas')
    cvs.width = 512
    cvs.height = 512
    const ctx = cvs.getContext('2d', { willReadFrequently: true })
    if (ctx) {
      ctx.imageSmoothingEnabled = true
    }

    const tex = new THREE.CanvasTexture(cvs)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.generateMipmaps = false

    canvasRef.current = cvs
    textureRef.current = tex

    return { texture: tex }
  }, [])

  // ── 2. Update Dynamic Cross-Section Heatmap on Canvas ───────────────────────
  useEffect(() => {
    let active = true

    async function updateSliceCanvas() {
      if (!canvasRef.current || !textureRef.current) return
      const cvs = canvasRef.current
      const ctx = cvs.getContext('2d')
      if (!ctx) return

      const w = cvs.width
      const h = cvs.height
      const imgData = ctx.createImageData(w, h)
      const data = imgData.data

      const timeIso = selectedTime?.isoString || '2026-08-28T12:00:00Z'
      const field = await getDataSourceOceanField(selectedVariable, selectedDepth, timeIso)
      if (!active) return

      const rSq = discRadius * discRadius

      for (let py = 0; py < h; py++) {
        // Local circle coordinates: u, v in [-discRadius, discRadius]
        const localY = ((py / h) - 0.5) * 2 * discRadius

        for (let px = 0; px < w; px++) {
          const localX = ((px / w) - 0.5) * 2 * discRadius
          const idx = (py * w + px) * 4

          // 1. Outside disc circle boundary
          const distSq = localX * localX + localY * localY
          if (distSq > rSq) {
            data[idx] = 0
            data[idx + 1] = 0
            data[idx + 2] = 0
            data[idx + 3] = 0
            continue
          }

          // 2. Geographic position from 3D coords on the horizontal plane
          // Slicing plane is at World (X=localX, Y=yPosition, Z=localY)
          const [lat, lon] = vec3ToLatLon(localX, yPosition, localY)

          // 3. Strict Land Masking: discard continental & island pixels
          if (isLandCoordinate(lat, lon)) {
            data[idx] = 10
            data[idx + 1] = 16
            data[idx + 2] = 26
            data[idx + 3] = 40 // very faint backdrop on land
            continue
          }

          // 4. Sample Ocean Model Field or Analytical Physics at (lat, lon, selectedDepth)
          let val = 27.5
          if (field && field.latitudes && field.latitudes.length > 0) {
            const latIdx = Math.min(
              field.latitudes.length - 1,
              Math.max(
                0,
                Math.round(
                  ((lat - field.latitudes[0]) /
                    (field.latitudes[field.latitudes.length - 1] - field.latitudes[0] || 1)) *
                    (field.latitudes.length - 1)
                )
              )
            )
            const lonIdx = Math.min(
              field.nlon - 1,
              Math.max(
                0,
                Math.round(
                  ((lon - field.longitudes[0]) /
                    (field.longitudes[field.nlon - 1] - field.longitudes[0] || 1)) *
                    (field.nlon - 1)
                )
              )
            )
            val = field.values[latIdx * field.nlon + lonIdx] ?? 27.5
          } else {
            // Continuous physical model value at specific depth
            val = getOceanValueSync(lat, lon, selectedDepth, selectedVariable, selectedTimeIndex)
          }

          // 5. Convert to scientific RGB color map
          const [r, g, b] = valueToRGB(val, selectedVariable)
          data[idx] = Math.round(r * 255)
          data[idx + 1] = Math.round(g * 255)
          data[idx + 2] = Math.round(b * 255)
          data[idx + 3] = Math.round(opacity * 255)
        }
      }

      ctx.putImageData(imgData, 0, 0)
      textureRef.current.needsUpdate = true
    }

    updateSliceCanvas()

    return () => {
      active = false
    }
  }, [
    selectedVariable,
    selectedDepth,
    selectedTimeIndex,
    selectedTime,
    discRadius,
    yPosition,
    opacity,
  ])

  // ── 3. Pointer Handlers with Exact Geographic Sampling ─────────────────────
  function handlePointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    document.body.style.cursor = 'crosshair'
    if (e.point) {
      const [lat, lon] = vec3ToLatLon(e.point.x, e.point.y, e.point.z)
      const m = getMeasurementImmediate(lat, lon, selectedDepth, selectedVariable, selectedTimeIndex)
      onHoverModelPoint?.(m, e)
    }
  }

  function handlePointerOut(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    document.body.style.cursor = 'auto'
    onUnhoverModelPoint?.()
  }

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    if (e.point) {
      const [lat, lon] = vec3ToLatLon(e.point.x, e.point.y, e.point.z)
      const m = getMeasurementImmediate(lat, lon, selectedDepth, selectedVariable, selectedTimeIndex)
      onClickModelPoint?.(m)
    }
  }

  // At surface (0m), do not render subsurface cutting plane or equator torus
  if (selectedDepth <= 0) return null

  return (
    <group position={[0, yPosition, 0]} rotation={[Math.PI / 2, 0, 0]}>
      {/* ── 1. Filled Dynamic Scientific Slicing Disc ─────────────────────── */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <circleGeometry args={[discRadius, 64]} />
        <meshBasicMaterial
          map={texture}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── 2. Outer Glowing Ring Outline ─────────────────────────────────── */}
      <mesh>
        <torusGeometry args={[discRadius, 0.012, 6, 80]} />
        <meshBasicMaterial color="#00b4d8" transparent opacity={0.75} />
      </mesh>

      {/* ── 3. Inner Depth Contour Reference Rings ─────────────────────────── */}
      <mesh>
        <torusGeometry args={[discRadius * 0.65, 0.005, 6, 60]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
      </mesh>
      <mesh>
        <torusGeometry args={[discRadius * 0.35, 0.004, 6, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.2} />
      </mesh>

      {/* ── 4. Floating 3D Depth Indicator Badge ──────────────────────────── */}
      <group position={[discRadius * 0.88, discRadius * 0.35, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <Html center occlude zIndexRange={[1, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#020b18]/90 border border-cyan-400/50 shadow-lg text-[10px] font-mono whitespace-nowrap backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-cyan-200">
              {Math.round(selectedDepth)}m
            </span>
            <span className="text-slate-400 text-[9px]">
              {varConfig.label} ({varConfig.unit})
            </span>
            {isExact ? (
              <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded border border-emerald-400/30">
                DATA LEVEL
              </span>
            ) : (
              <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-400/30">
                INTERPOLATED
              </span>
            )}
          </div>
        </Html>
      </group>
    </group>
  )
}
