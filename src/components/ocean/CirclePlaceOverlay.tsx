/**
 * CirclePlaceOverlay.tsx — Interactive 3D Circle Region Tool for Globe
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements:
 * "whenever I click the circle here as a button, it would allow me to circle over any place and see the isolation view of that place."
 *
 * Capabilities:
 * 1. Raycasts directly onto the 3D globe sphere surface to track pointer down/move/up.
 * 2. Projects a glowing holographic circular sonar ring and pulsing radar ripples over the circled location.
 * 3. Automatically recognizes nearest marine ecosystems (Lakshadweep, Andaman, Bay of Bengal, Arabian Sea, Gulf of Mannar, Maldives, etc.).
 * 4. Displays real-time coordinates, depth, and a direct "[Enter Isolation View ➔]" action.
 */

import { useState, useMemo, useCallback, useRef } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { vec3ToLatLon, latLonToVec3, GLOBE_RADIUS } from '@/utils/geoUtils'
import { Fish, MapPin, Eye, Sparkles, X } from 'lucide-react'

export interface CircledPlaceResult {
  placeName: string
  lat: number
  lon: number
  radiusKm: number
}

interface CirclePlaceOverlayProps {
  isActive: boolean
  onCircleComplete: (result: CircledPlaceResult) => void
  onCancel: () => void
}

// Key Marine Protected Areas & Ecosystem Locations
interface KnownPlace {
  name: string
  lat: number
  lon: number
  biome: string
}

const KNOWN_PLACES: KnownPlace[] = [
  { name: 'Lakshadweep Coral Atoll (Kavaratti)', lat: 10.57, lon: 72.64, biome: 'Coral Reef & Lagoon' },
  { name: 'Andaman & Nicobar Subduction Trench', lat: 11.62, lon: 92.72, biome: 'Deep Trench & Seamount' },
  { name: 'Bay of Bengal Ganges-Brahmaputra Delta', lat: 19.80, lon: 88.50, biome: 'Estuarine Delta & Mangrove' },
  { name: 'Arabian Sea Somali-Oman Upwelling', lat: 15.50, lon: 62.00, biome: 'Upwelling Pelagic Zone' },
  { name: 'Gulf of Mannar Marine Biosphere', lat: 9.12, lon: 79.15, biome: 'Coral Reef & Seagrass' },
  { name: 'Maldives Atolls & Chagos Ridge', lat: 0.50, lon: 73.10, biome: 'Atoll & Pelagic Bank' },
  { name: 'Seychelles & Mascarene Plateau', lat: -4.60, lon: 55.45, biome: 'Granitic Island Reefs' },
  { name: 'Central Indian Ocean Basin (CIOB)', lat: -10.00, lon: 80.00, biome: 'Abyssal Plain' },
]

function getNearestPlace(lat: number, lon: number): { name: string; biome: string } {
  let nearest = KNOWN_PLACES[0]
  let minDist = Infinity

  for (const place of KNOWN_PLACES) {
    const dLat = (lat - place.lat) * 111
    const dLon = (lon - place.lon) * 111 * Math.cos((lat * Math.PI) / 180)
    const dist = Math.sqrt(dLat * dLat + dLon * dLon)
    if (dist < minDist) {
      minDist = dist
      nearest = place
    }
  }

  if (minDist < 850) {
    return { name: nearest.name, biome: nearest.biome }
  }

  const latStr = Math.abs(lat).toFixed(1) + (lat >= 0 ? '°N' : '°S')
  const lonStr = Math.abs(lon).toFixed(1) + (lon >= 0 ? '°E' : '°W')
  return {
    name: `Isolated Oceanic Biome (${latStr}, ${lonStr})`,
    biome: 'Open Ocean Pelagic & Benthic Column',
  }
}

// Generate circular 3D ring points on the sphere surface around a center (lat, lon)
function createSphereCirclePoints(
  centerLat: number,
  centerLon: number,
  radiusAngularRad: number,
  segments = 64,
  altitude = 0.028
): THREE.Vector3[] {
  const [cx, cy, cz] = latLonToVec3(centerLat, centerLon, GLOBE_RADIUS + altitude)
  const centerVec = new THREE.Vector3(cx, cy, cz).normalize()

  // Orthogonal basis vectors perpendicular to centerVec
  const arbitrary = Math.abs(centerVec.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
  const u = new THREE.Vector3().crossVectors(centerVec, arbitrary).normalize()
  const v = new THREE.Vector3().crossVectors(centerVec, u).normalize()

  const points: THREE.Vector3[] = []
  const sinR = Math.sin(radiusAngularRad)
  const cosR = Math.cos(radiusAngularRad)
  const rSphere = GLOBE_RADIUS + altitude

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2
    const dir = new THREE.Vector3()
      .copy(centerVec).multiplyScalar(cosR)
      .addScaledVector(u, sinR * Math.cos(theta))
      .addScaledVector(v, sinR * Math.sin(theta))
      .normalize()
      .multiplyScalar(rSphere)

    points.push(dir)
  }

  return points
}

export function CirclePlaceOverlay({
  isActive,
  onCircleComplete,
  onCancel,
}: CirclePlaceOverlayProps) {
  const [hoverPt, setHoverPt] = useState<{ lat: number; lon: number } | null>(null)
  const [selectedCircle, setSelectedCircle] = useState<{
    lat: number
    lon: number
    radiusKm: number
    angularRadius: number
  } | null>(null)

  const pulseRef = useRef<THREE.Mesh>(null)

  // Raycast point from event
  const getLatLonFromEvent = useCallback((e: ThreeEvent<PointerEvent>): { lat: number; lon: number } => {
    const p = e.point
    const [lat, lon] = vec3ToLatLon(p.x, p.y, p.z)
    return { lat, lon }
  }, [])

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isActive) return
      e.stopPropagation()
      const pt = getLatLonFromEvent(e)
      setHoverPt(pt)
    },
    [isActive, getLatLonFromEvent]
  )

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isActive) return
      e.stopPropagation()
      const pt = getLatLonFromEvent(e)

      // Set circled region (default 420km radius circle)
      const radiusKm = 420
      const angularRadius = radiusKm / 6371.0

      setSelectedCircle({
        lat: pt.lat,
        lon: pt.lon,
        radiusKm,
        angularRadius,
      })
    },
    [isActive, getLatLonFromEvent]
  )

  // Animated sonar ripple pulse
  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const t = clock.getElapsedTime()
      const scale = 1.0 + 0.12 * Math.sin(t * 3.5)
      pulseRef.current.scale.set(scale, scale, scale)
    }
  })

  // Circle path line geometry
  const targetLat = selectedCircle?.lat ?? hoverPt?.lat ?? 12.0
  const targetLon = selectedCircle?.lon ?? hoverPt?.lon ?? 80.0
  const targetRadius = selectedCircle?.angularRadius ?? (320 / 6371.0)

  const circlePoints = useMemo(() => {
    return createSphereCirclePoints(targetLat, targetLon, targetRadius, 64, 0.028)
  }, [targetLat, targetLon, targetRadius])

  const circleGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(circlePoints)
  }, [circlePoints])

  // Center vector for placing the tag
  const [tagX, tagY, tagZ] = useMemo(() => {
    return latLonToVec3(targetLat, targetLon, GLOBE_RADIUS + 0.035)
  }, [targetLat, targetLon])

  const detected = useMemo(() => {
    return getNearestPlace(targetLat, targetLon)
  }, [targetLat, targetLon])

  if (!isActive) return null

  return (
    <group name="CirclePlaceOverlayRoot">
      {/* ── 1. Invisible Raycast Sphere ─────────────────────────────────── */}
      <mesh
        visible={false}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
      >
        <sphereGeometry args={[GLOBE_RADIUS + 0.03, 48, 32]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* ── 2. Holographic Sonar Circle on Globe ─────────────────────────── */}
      <group>
        {/* Outer glowing radar ring */}
        {/* @ts-expect-error R3F line element */}
        <line geometry={circleGeo}>
          <lineBasicMaterial
            color="#00f0ff"
            transparent
            opacity={0.95}
            linewidth={2}
            blending={THREE.AdditiveBlending}
          />
        </line>

        {/* Concentric inner ripple */}
        <mesh ref={pulseRef} position={[tagX, tagY, tagZ]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* ── 3. Interactive Floating Confirmation HUD Badge ───────────────── */}
      <group position={[tagX, tagY, tagZ]}>
        <Html
          center
          distanceFactor={5.5}
          zIndexRange={[50, 0]}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#020b18]/95 border border-cyan-400/80 shadow-2xl backdrop-blur-md min-w-[260px] animate-fade-in font-mono text-xs select-none pointer-events-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <Fish size={14} className="text-cyan-400" />
                <span className="text-[11px] tracking-wide">CIRCLED PLACE</span>
              </div>
              <button
                onClick={onCancel}
                className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Cancel Circle"
              >
                <X size={12} />
              </button>
            </div>

            {/* Place Details */}
            <div className="space-y-1">
              <div className="font-bold text-white text-xs leading-snug">
                {detected.name}
              </div>
              <div className="text-[10px] text-cyan-300/80">
                {detected.biome}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-300 pt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin size={10} className="text-amber-400" />
                  {Math.abs(targetLat).toFixed(2)}°{targetLat >= 0 ? 'N' : 'S'}, {Math.abs(targetLon).toFixed(2)}°{targetLon >= 0 ? 'E' : 'W'}
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">Live 3D Biosphere</span>
              </div>
            </div>

            {/* Direct Action Button: Enter Isolation View */}
            <button
              onClick={() => {
                onCircleComplete({
                  placeName: detected.name,
                  lat: targetLat,
                  lon: targetLon,
                  radiusKm: selectedCircle?.radiusKm ?? 420,
                })
              }}
              className="mt-1 w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-cyan-500/30 cursor-pointer group"
            >
              <Eye size={13} className="group-hover:scale-110 transition-transform" />
              <span>Enter 3D Isolation View</span>
              <Sparkles size={11} className="text-black animate-pulse" />
            </button>
          </div>
        </Html>
      </group>
    </group>
  )
}
