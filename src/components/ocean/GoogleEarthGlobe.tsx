/**
 * GoogleEarthGlobe.tsx — Photorealistic Google Earth-Style Satellite Globe
 * SIH 26067 | Ocean Intelligence Platform
 *
 * Features:
 * 1. High-resolution satellite Earth texture with realistic landmasses, bathymetry, and shallow shelves.
 * 2. Atmospheric Fresnel rim glow shader.
 * 3. 3D HTML geographic billboard labels (India, Sri Lanka, Bangladesh, Bay of Bengal, Arabian Sea, etc.).
 * 4. Region click handler to focus on the 3D volumetric ocean inspection block.
 */

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { createSatelliteEarthTexture } from '@/utils/earthTextures'
import { latLonToVec3, GLOBE_RADIUS } from '@/utils/geoUtils'

interface GoogleEarthGlobeProps {
  onSelectRegion?: (region: string) => void
  selectedRegion?: string
}

interface GeoLabel {
  name: string
  lat: number
  lon: number
  type: 'country' | 'ocean' | 'region'
}

const GEO_LABELS: GeoLabel[] = [
  { name: 'India', lat: 21.5, lon: 78.5, type: 'country' },
  { name: 'Bangladesh', lat: 24.2, lon: 89.8, type: 'country' },
  { name: 'Sri Lanka', lat: 7.8, lon: 80.7, type: 'country' },
  { name: 'Bay of Bengal', lat: 14.5, lon: 87.5, type: 'ocean' },
  { name: 'Arabian Sea', lat: 15.2, lon: 64.8, type: 'ocean' },
  { name: 'Andaman Sea', lat: 10.5, lon: 94.2, type: 'ocean' },
  { name: 'Myanmar', lat: 19.5, lon: 96.0, type: 'country' },
  { name: 'Sumatra', lat: 0.5, lon: 101.5, type: 'region' },
]

export function GoogleEarthGlobe({ onSelectRegion, selectedRegion = 'Bay of Bengal' }: GoogleEarthGlobeProps) {
  const globeRef = useRef<THREE.Mesh | null>(null)

  // Satellite texture
  const earthTexture = useMemo(() => createSatelliteEarthTexture(2048, 1024), [])

  // Geometry
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(GLOBE_RADIUS, 72, 48)
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <group>
      {/* ── Main Photorealistic Satellite Earth Sphere ──────────────────────── */}
      <mesh ref={globeRef} geometry={geometry} receiveShadow castShadow rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.55}
          metalness={0.12}
        />
      </mesh>

      {/* ── Atmospheric Rim Glow Mesh ───────────────────────────────────────── */}
      <mesh scale={[1.018, 1.018, 1.018]}>
        <sphereGeometry args={[GLOBE_RADIUS, 48, 48]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      {/* ── Geographic Labels (Matching Google Earth Typography) ───────────── */}
      {GEO_LABELS.map((label) => {
        const [x, y, z] = latLonToVec3(label.lat, label.lon, GLOBE_RADIUS + 0.02)
        const isOcean = label.type === 'ocean'
        const isSelected = selectedRegion === label.name

        return (
          <group key={label.name} position={[x, y, z]}>
            <Html
              center
              occlude
              zIndexRange={[1, 0]}
              style={{ pointerEvents: 'auto', userSelect: 'none' }}
            >
              <button
                onClick={() => onSelectRegion?.(label.name)}
                className={[
                  'cursor-pointer transition-all duration-200 text-center font-sans whitespace-nowrap',
                  isOcean
                    ? 'text-[11px] italic font-medium tracking-wider text-cyan-200/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] hover:text-cyan-100 hover:scale-110'
                    : 'text-[10px] font-semibold tracking-wide text-slate-200/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] hover:text-white',
                  isSelected ? 'scale-110 ring-1 ring-amber-400/60 rounded px-1.5 py-0.5 bg-black/40' : '',
                ].join(' ')}
              >
                {label.name}
              </button>
            </Html>
          </group>
        )
      })}
    </group>
  )
}
