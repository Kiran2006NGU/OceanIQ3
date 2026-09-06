/**
 * RegionBoundary.tsx — Scientific Geographic Boundary Lines
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Renders subtle, restrained Lat/Lon bounding lines on the globe surface
 * for active regions (Bay of Bengal, Arabian Sea, Andaman Sea, Equatorial IO)
 * with corner coordinate tags.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { latLonToVec3, GLOBE_RADIUS } from '@/utils/geoUtils'

export interface RegionBoundsInfo {
  id: string
  name: string
  latMin: number
  latMax: number
  lonMin: number
  lonMax: number
  depthMin: number
  depthMax: number
  obsCount: number
}

export const REGION_BOUNDS: Record<string, RegionBoundsInfo> = {
  'Bay of Bengal': {
    id: 'Bay of Bengal',
    name: 'Bay of Bengal',
    latMin: 8,
    latMax: 22,
    lonMin: 80,
    lonMax: 95,
    depthMin: 0,
    depthMax: 1500,
    obsCount: 5,
  },
  'Arabian Sea': {
    id: 'Arabian Sea',
    name: 'Arabian Sea',
    latMin: 10,
    latMax: 25,
    lonMin: 55,
    lonMax: 75,
    depthMin: 0,
    depthMax: 1500,
    obsCount: 4,
  },
  'Andaman Sea': {
    id: 'Andaman Sea',
    name: 'Andaman Sea',
    latMin: 6,
    latMax: 14,
    lonMin: 92,
    lonMax: 98,
    depthMin: 0,
    depthMax: 1500,
    obsCount: 2,
  },
  'Equatorial Indian Ocean': {
    id: 'Equatorial Indian Ocean',
    name: 'Equatorial Indian Ocean',
    latMin: -10,
    latMax: 5,
    lonMin: 60,
    lonMax: 95,
    depthMin: 0,
    depthMax: 2000,
    obsCount: 2,
  },
}

interface RegionBoundaryProps {
  selectedRegion: string
  visible?: boolean
}

export function RegionBoundary({ selectedRegion, visible = true }: RegionBoundaryProps) {
  const bounds = REGION_BOUNDS[selectedRegion]

  const { linePoints, cornerTags } = useMemo(() => {
    if (!bounds) return { linePoints: [], cornerTags: [] }

    const { latMin, latMax, lonMin, lonMax } = bounds
    const altitude = GLOBE_RADIUS + 0.02
    const segments = 24
    const pts: THREE.Vector3[] = []

    // Bottom edge (latMin, lonMin -> lonMax)
    for (let i = 0; i <= segments; i++) {
      const lon = lonMin + (lonMax - lonMin) * (i / segments)
      const [x, y, z] = latLonToVec3(latMin, lon, altitude)
      pts.push(new THREE.Vector3(x, y, z))
    }
    // Right edge (lonMax, latMin -> latMax)
    for (let i = 0; i <= segments; i++) {
      const lat = latMin + (latMax - latMin) * (i / segments)
      const [x, y, z] = latLonToVec3(lat, lonMax, altitude)
      pts.push(new THREE.Vector3(x, y, z))
    }
    // Top edge (latMax, lonMax -> lonMin)
    for (let i = 0; i <= segments; i++) {
      const lon = lonMax - (lonMax - lonMin) * (i / segments)
      const [x, y, z] = latLonToVec3(latMax, lon, altitude)
      pts.push(new THREE.Vector3(x, y, z))
    }
    // Left edge (lonMin, latMax -> latMin)
    for (let i = 0; i <= segments; i++) {
      const lat = latMax - (latMax - latMin) * (i / segments)
      const [x, y, z] = latLonToVec3(lat, lonMin, altitude)
      pts.push(new THREE.Vector3(x, y, z))
    }

    const swPos = latLonToVec3(latMin, lonMin, altitude + 0.015)
    const nePos = latLonToVec3(latMax, lonMax, altitude + 0.015)

    const tags = [
      {
        pos: swPos,
        text: `${Math.abs(latMin)}°${latMin >= 0 ? 'N' : 'S'}, ${lonMin}°E`,
      },
      {
        pos: nePos,
        text: `${Math.abs(latMax)}°${latMax >= 0 ? 'N' : 'S'}, ${lonMax}°E`,
      },
    ]

    return { linePoints: pts, cornerTags: tags }
  }, [bounds])

  const lineGeometry = useMemo(() => {
    if (linePoints.length === 0) return null
    const geo = new THREE.BufferGeometry().setFromPoints(linePoints)
    return geo
  }, [linePoints])

  if (!visible || !bounds || !lineGeometry) return null

  return (
    <group>
      {/* ── 3D Restrained Line Geometry on Sphere ── */}
      <lineLoop geometry={lineGeometry}>
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.65} linewidth={1} />
      </lineLoop>

      {/* ── Corner Coordinate HUD Labels ── */}
      {cornerTags.map((tag, idx) => (
        <group key={idx} position={tag.pos as [number, number, number]}>
          <Html occlude zIndexRange={[1, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div className="px-1.5 py-0.5 rounded bg-[#030a16]/90 border border-cyan-500/30 text-[8px] font-mono text-cyan-300 shadow-md whitespace-nowrap">
              {tag.text}
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}
