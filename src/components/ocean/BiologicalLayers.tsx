/**
 * BiologicalLayers.tsx — 3D Living Ocean Biological Layers
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements:
 * 1. Phytoplankton Blooms (photosynthetic chlorophyll-a glowing clouds)
 * 2. Zooplankton Hotspots & Diel Vertical Migration swarms
 * 3. PFZ (Potential Fishing Zone) Pelagic Fish Schools with swimming animation
 */

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { GLOBE_RADIUS } from '@/utils/geoUtils'
import type { VisibleLayers } from '@/hooks/useDashboardState'

interface BiologicalLayersProps {
  visibleLayers: VisibleLayers
  selectedDepth?: number
}

// Key biological hotspots in the Indian Ocean (PFZ advisory locations)
const PFZ_HOTSPOTS = [
  { name: 'Somali Upwelling Zone', lat: 8.5, lon: 52.0, species: 'Yellowfin Tuna & Sardines', biomass: 'High (3.8 mg/m³)' },
  { name: 'Gujarat Coast / Saurashtra', lat: 21.0, lon: 69.5, species: 'Indian Mackerel & Pomfret', biomass: 'High (4.2 mg/m³)' },
  { name: 'Malabar Upwelling (Kerala)', lat: 10.2, lon: 75.4, species: 'Oil Sardine & Anchovy', biomass: 'Very High (5.1 mg/m³)' },
  { name: 'Andaman Archipelagic Shelf', lat: 12.0, lon: 93.0, species: 'Skipjack Tuna & Snappers', biomass: 'Medium (2.4 mg/m³)' },
  { name: 'Sri Lanka Dome Upwelling', lat: 7.5, lon: 83.5, species: 'Bigeye Tuna & Mackerel', biomass: 'High (3.6 mg/m³)' },
  { name: 'Northern Bay of Bengal', lat: 19.5, lon: 88.0, species: 'Hilsa & Bombay Duck', biomass: 'High (3.9 mg/m³)' },
]

function latLonToVector3(lat: number, lon: number, altitudeOffset = 0.02): THREE.Vector3 {
  const latRad = (lat * Math.PI) / 180
  const lonRad = ((lon + 90) * Math.PI) / 180
  const phi = Math.PI / 2 - latRad
  const theta = lonRad
  const r = GLOBE_RADIUS + altitudeOffset
  return new THREE.Vector3().setFromSphericalCoords(r, phi, theta)
}

export function BiologicalLayers({ visibleLayers }: BiologicalLayersProps) {
  const fishGroupRef = useRef<THREE.Group | null>(null)
  const phytoRef = useRef<THREE.Points | null>(null)
  const zooRef = useRef<THREE.Points | null>(null)

  // ── 1. Phytoplankton Bloom Cloud (Surface green shimmer) ───────────────────
  const phytoData = useMemo(() => {
    const count = 420
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    // Concentrate points around fertile coastal upwelling regions
    const upwellingCenters = [
      { lat: 12.0, lon: 74.0, spread: 4.5 },
      { lat: 19.0, lon: 87.0, spread: 5.0 },
      { lat: 9.0, lon: 51.0, spread: 4.0 },
      { lat: 21.5, lon: 69.0, spread: 3.5 },
      { lat: 7.0, lon: 82.0, spread: 3.5 },
    ]

    let idx = 0
    for (let i = 0; i < count; i++) {
      const center = upwellingCenters[i % upwellingCenters.length]
      const lat = center.lat + (Math.random() - 0.5) * center.spread * 2
      const lon = center.lon + (Math.random() - 0.5) * center.spread * 2
      const alt = 0.012 + Math.random() * 0.015

      const pos = latLonToVector3(lat, lon, alt)
      positions[idx * 3] = pos.x
      positions[idx * 3 + 1] = pos.y
      positions[idx * 3 + 2] = pos.z

      // Emerald to neon seafoam green colors
      colors[idx * 3] = 0.15 + Math.random() * 0.2     // R
      colors[idx * 3 + 1] = 0.85 + Math.random() * 0.15 // G
      colors[idx * 3 + 2] = 0.45 + Math.random() * 0.35 // B
      idx++
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  // ── 2. Zooplankton Swarm (Diel vertical migration particles) ────────────────
  const zooData = useMemo(() => {
    const count = 350
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    const centers = [
      { lat: 14.0, lon: 68.0, spread: 6.0 },
      { lat: 15.0, lon: 85.0, spread: 6.0 },
      { lat: 4.0, lon: 77.0, spread: 5.0 },
    ]

    for (let i = 0; i < count; i++) {
      const center = centers[i % centers.length]
      const lat = center.lat + (Math.random() - 0.5) * center.spread * 2
      const lon = center.lon + (Math.random() - 0.5) * center.spread * 2
      const alt = 0.018 + Math.random() * 0.022

      const pos = latLonToVector3(lat, lon, alt)
      positions[i * 3] = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z

      // Bioluminescent blue-cyan-lavender
      colors[i * 3] = 0.5 + Math.random() * 0.3
      colors[i * 3 + 1] = 0.9 + Math.random() * 0.1
      colors[i * 3 + 2] = 1.0
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  // ── 3. PFZ Fish Schools positions ──────────────────────────────────────────
  const fishSchools = useMemo(() => {
    return PFZ_HOTSPOTS.map((spot) => {
      const pos = latLonToVector3(spot.lat, spot.lon, 0.024)
      return { ...spot, pos }
    })
  }, [])

  // ── Animation Loop ─────────────────────────────────────────────────────────
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // Pulse phytoplankton clouds
    if (phytoRef.current) {
      const scale = 1.0 + Math.sin(t * 1.5) * 0.008
      phytoRef.current.scale.set(scale, scale, scale)
    }

    // Oscillate zooplankton (diel vertical migration simulation)
    if (zooRef.current) {
      const scale = 1.0 + Math.cos(t * 1.2) * 0.012
      zooRef.current.scale.set(scale, scale, scale)
    }

    // Orbit/swim fish schools
    if (fishGroupRef.current) {
      fishGroupRef.current.children.forEach((child, i) => {
        child.rotation.z = Math.sin(t * 2 + i) * 0.25
        child.rotation.y = Math.cos(t * 1.8 + i) * 0.15
      })
    }
  })

  return (
    <group>
      {/* ── Phytoplankton Bloom Clouds ── */}
      {visibleLayers.phytoplankton && (
        <points ref={phytoRef} geometry={phytoData}>
          <pointsMaterial
            size={0.038}
            vertexColors
            transparent
            opacity={0.82}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}

      {/* ── Zooplankton Swarms ── */}
      {visibleLayers.zooplankton && (
        <points ref={zooRef} geometry={zooData}>
          <pointsMaterial
            size={0.028}
            vertexColors
            transparent
            opacity={0.75}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}

      {/* ── PFZ Pelagic Fish Schools ── */}
      {visibleLayers.pfzFish && (
        <group ref={fishGroupRef}>
          {fishSchools.map((school, i) => (
            <group key={school.name} position={school.pos}>
              {/* Animated School of Fish Glyphs */}
              <mesh>
                <coneGeometry args={[0.018, 0.045, 4]} />
                <meshStandardMaterial
                  color="#fbbf24"
                  emissive="#d97706"
                  emissiveIntensity={0.8}
                  roughness={0.2}
                />
              </mesh>

              {/* Trailing school members */}
              <mesh position={[0.015, 0.01, -0.005]}>
                <coneGeometry args={[0.012, 0.032, 4]} />
                <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.6} />
              </mesh>
              <mesh position={[-0.014, -0.008, 0.005]}>
                <coneGeometry args={[0.011, 0.028, 4]} />
                <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.6} />
              </mesh>

              {/* Pulsing Aura Ring */}
              <mesh>
                <ringGeometry args={[0.032, 0.042, 20]} />
                <meshBasicMaterial
                  color="#f59e0b"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.5}
                />
              </mesh>

              {/* PFZ Label HUD */}
              <Html distanceFactor={4.5} center zIndexRange={[1, 0]} occlude style={{ pointerEvents: 'none', userSelect: 'none' }}>
                <div className="pointer-events-none select-none px-2 py-1 rounded bg-black/90 backdrop-blur-sm border border-amber-400/40 text-[9px] font-mono text-amber-300 whitespace-nowrap shadow-lg flex items-center gap-1.5 animate-fade-in">
                  <span className="text-amber-400">🐟</span>
                  <div>
                    <span className="font-bold">{school.name}</span>
                    <span className="text-slate-400 ml-1">({school.species})</span>
                  </div>
                </div>
              </Html>
            </group>
          ))}
        </group>
      )}
    </group>
  )
}
