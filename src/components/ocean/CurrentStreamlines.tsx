/**
 * CurrentStreamlines.tsx — 3D Particle-Based Dynamic Current Streamlines
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements continuous particle streamlines tracing major Indian Ocean current systems:
 * - Somali Current (strong boundary jet)
 * - South Equatorial Current (SEC)
 * - East India Coastal Current (EICC)
 * - West India Coastal Current (WICC)
 * - Equatorial Countercurrent (ECC)
 */

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GLOBE_RADIUS } from '@/utils/geoUtils'

interface CurrentStreamlinesProps {
  selectedDepth?: number
  visible?: boolean
}

interface StreamlineDef {
  name: string
  points: { lat: number; lon: number }[]
  color: string
  speedMultiplier: number
}

const INDIAN_OCEAN_STREAMS: StreamlineDef[] = [
  // 1. Somali Current (Speedy northward boundary jet)
  {
    name: 'Somali Current',
    color: '#38bdf8',
    speedMultiplier: 1.6,
    points: [
      { lat: -5.0, lon: 42.0 },
      { lat: 0.0, lon: 46.0 },
      { lat: 5.0, lon: 50.0 },
      { lat: 10.0, lon: 53.5 },
      { lat: 14.5, lon: 55.0 },
      { lat: 18.0, lon: 60.0 },
    ],
  },
  // 2. South Equatorial Current (Broad westward flow)
  {
    name: 'South Equatorial Current',
    color: '#818cf8',
    speedMultiplier: 1.1,
    points: [
      { lat: -12.0, lon: 95.0 },
      { lat: -11.5, lon: 85.0 },
      { lat: -11.0, lon: 75.0 },
      { lat: -10.5, lon: 65.0 },
      { lat: -10.0, lon: 55.0 },
      { lat: -9.5, lon: 45.0 },
    ],
  },
  // 3. West India Coastal Current (WICC)
  {
    name: 'West India Coastal Current',
    color: '#22d3ee',
    speedMultiplier: 1.3,
    points: [
      { lat: 22.0, lon: 68.5 },
      { lat: 18.5, lon: 71.5 },
      { lat: 14.5, lon: 73.5 },
      { lat: 10.0, lon: 75.5 },
      { lat: 7.0, lon: 77.5 },
    ],
  },
  // 4. East India Coastal Current (EICC)
  {
    name: 'East India Coastal Current',
    color: '#a78bfa',
    speedMultiplier: 1.25,
    points: [
      { lat: 21.0, lon: 88.0 },
      { lat: 18.0, lon: 85.0 },
      { lat: 14.0, lon: 81.5 },
      { lat: 10.5, lon: 80.2 },
      { lat: 6.5, lon: 81.5 },
    ],
  },
  // 5. Equatorial Countercurrent
  {
    name: 'Equatorial Jet / Countercurrent',
    color: '#34d399',
    speedMultiplier: 1.4,
    points: [
      { lat: 1.5, lon: 48.0 },
      { lat: 0.5, lon: 60.0 },
      { lat: -0.5, lon: 72.0 },
      { lat: 0.2, lon: 84.0 },
      { lat: 1.0, lon: 95.0 },
    ],
  },
]

function latLonToVec3(lat: number, lon: number, altitude = 0.015): THREE.Vector3 {
  const latRad = (lat * Math.PI) / 180
  const lonRad = ((lon + 90) * Math.PI) / 180
  const phi = Math.PI / 2 - latRad
  const theta = lonRad
  const r = GLOBE_RADIUS + altitude
  return new THREE.Vector3().setFromSphericalCoords(r, phi, theta)
}

export function CurrentStreamlines({ visible = true }: CurrentStreamlinesProps) {
  const particlesRef = useRef<THREE.Points | null>(null)

  // Generate curves and sampled points along the streamlines
  const { curves, particleInitialOffsets, totalParticles } = useMemo(() => {
    const builtCurves = INDIAN_OCEAN_STREAMS.map((st) => {
      const vecPoints = st.points.map((p) => latLonToVec3(p.lat, p.lon, 0.018))
      const curve = new THREE.CatmullRomCurve3(vecPoints, false, 'centripetal')
      return { curve, def: st }
    })

    const particlesPerStream = 50
    const total = builtCurves.length * particlesPerStream
    const offsets = new Float32Array(total)

    for (let i = 0; i < total; i++) {
      offsets[i] = Math.random()
    }

    return {
      curves: builtCurves,
      particleInitialOffsets: offsets,
      totalParticles: total,
    }
  }, [])

  // Static Line Geometry for the streamline paths
  const lineGeometries = useMemo(() => {
    return curves.map(({ curve }) => {
      const points = curve.getPoints(60)
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      return geo
    })
  }, [curves])

  // Dynamic particle buffer geometry
  const particleBuffer = useMemo(() => {
    const positions = new Float32Array(totalParticles * 3)
    const colors = new Float32Array(totalParticles * 3)

    let idx = 0
    curves.forEach(({ def }) => {
      const c = new THREE.Color(def.color)
      for (let i = 0; i < 50; i++) {
        colors[idx * 3] = c.r
        colors[idx * 3 + 1] = c.g
        colors[idx * 3 + 2] = c.b
        idx++
      }
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [curves, totalParticles])

  // Animation Loop: advance particles along curves
  useFrame(({ clock }) => {
    if (!particlesRef.current || !visible) return

    const time = clock.getElapsedTime()
    const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute
    const positions = posAttr.array as Float32Array

    let pIdx = 0
    curves.forEach(({ curve, def }, cIdx) => {
      const speed = 0.12 * def.speedMultiplier
      for (let i = 0; i < 50; i++) {
        const initial = particleInitialOffsets[cIdx * 50 + i]
        const progress = (initial + time * speed) % 1.0

        const pt = curve.getPoint(progress)
        positions[pIdx * 3] = pt.x
        positions[pIdx * 3 + 1] = pt.y
        positions[pIdx * 3 + 2] = pt.z
        pIdx++
      }
    })

    posAttr.needsUpdate = true
  })

  if (!visible) return null

  return (
    <group>
      {/* ── Semi-transparent background curve paths ── */}
      {lineGeometries.map((geo, idx) => (
        // @ts-expect-error R3F line element geometry
        <line key={idx} geometry={geo}>
          <lineBasicMaterial
            color={curves[idx].def.color}
            transparent
            opacity={0.35}
            linewidth={1}
          />
        </line>
      ))}

      {/* ── Flowing current particles ── */}
      <points ref={particlesRef} geometry={particleBuffer}>
        <pointsMaterial
          size={0.024}
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}
