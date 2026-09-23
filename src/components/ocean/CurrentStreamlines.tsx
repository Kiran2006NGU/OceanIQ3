/**
 * CurrentStreamlines.tsx — High-Fidelity 3D Dynamic Ocean Current Streamlines
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements continuous, glowing particle streamlines tracing the full Indian Ocean circulation:
 * 1. Somali Boundary Jet & The Great Whirl
 * 2. South Equatorial Current (SEC) & Equatorial Wyrtki Jets
 * 3. East India Coastal Current (EICC) & Bay of Bengal Cyclonic Gyre
 * 4. West India Coastal Current (WICC)
 * 5. Southwest Monsoon Current (SMC) & Sri Lanka Dome
 * 6. Agulhas Current & Mozambique Channel Retroflection
 * 7. Indonesian Throughflow (ITF)
 * 8. Southern Ocean Subtropical Gyre & West Australian Current
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
  // 1. Somali Boundary Jet (High-speed northward jet)
  {
    name: 'Somali Current Jet',
    color: '#38bdf8',
    speedMultiplier: 1.8,
    points: [
      { lat: -8.0, lon: 40.0 },
      { lat: -3.0, lon: 43.5 },
      { lat: 2.0, lon: 47.0 },
      { lat: 7.5, lon: 51.0 },
      { lat: 11.5, lon: 54.0 },
      { lat: 15.0, lon: 56.5 },
      { lat: 18.5, lon: 61.0 },
    ],
  },
  // 2. The Great Whirl (Mesoscale clockwise vortex off Somalia)
  {
    name: 'Great Whirl Vortex',
    color: '#06b6d4',
    speedMultiplier: 1.5,
    points: [
      { lat: 8.5, lon: 51.5 },
      { lat: 11.0, lon: 54.5 },
      { lat: 10.5, lon: 57.0 },
      { lat: 7.5, lon: 55.5 },
      { lat: 7.0, lon: 52.5 },
      { lat: 8.5, lon: 51.5 },
    ],
  },
  // 3. South Equatorial Current (Broad westward flow)
  {
    name: 'South Equatorial Current',
    color: '#818cf8',
    speedMultiplier: 1.2,
    points: [
      { lat: -13.0, lon: 105.0 },
      { lat: -12.5, lon: 95.0 },
      { lat: -12.0, lon: 85.0 },
      { lat: -11.5, lon: 75.0 },
      { lat: -11.0, lon: 65.0 },
      { lat: -10.5, lon: 55.0 },
      { lat: -10.0, lon: 46.0 },
    ],
  },
  // 4. Equatorial Wyrtki Jet (Fast semi-annual eastward surge)
  {
    name: 'Equatorial Wyrtki Jet',
    color: '#22d3ee',
    speedMultiplier: 2.0,
    points: [
      { lat: 1.2, lon: 46.0 },
      { lat: 0.8, lon: 58.0 },
      { lat: 0.0, lon: 70.0 },
      { lat: -0.5, lon: 82.0 },
      { lat: 0.2, lon: 94.0 },
      { lat: 0.5, lon: 99.0 },
    ],
  },
  // 5. West India Coastal Current (WICC)
  {
    name: 'West India Coastal Current',
    color: '#34d399',
    speedMultiplier: 1.3,
    points: [
      { lat: 22.5, lon: 68.0 },
      { lat: 19.5, lon: 71.0 },
      { lat: 15.5, lon: 73.0 },
      { lat: 12.0, lon: 74.8 },
      { lat: 8.5, lon: 76.8 },
      { lat: 6.0, lon: 78.5 },
    ],
  },
  // 6. East India Coastal Current (EICC)
  {
    name: 'East India Coastal Current',
    color: '#a78bfa',
    speedMultiplier: 1.4,
    points: [
      { lat: 21.5, lon: 89.0 },
      { lat: 18.5, lon: 85.5 },
      { lat: 15.0, lon: 82.0 },
      { lat: 11.5, lon: 80.5 },
      { lat: 7.5, lon: 81.8 },
    ],
  },
  // 7. Bay of Bengal Central Gyre
  {
    name: 'Bay of Bengal Gyre',
    color: '#60a5fa',
    speedMultiplier: 1.15,
    points: [
      { lat: 12.0, lon: 83.0 },
      { lat: 15.5, lon: 85.5 },
      { lat: 17.5, lon: 89.5 },
      { lat: 14.5, lon: 92.5 },
      { lat: 10.5, lon: 88.0 },
      { lat: 12.0, lon: 83.0 },
    ],
  },
  // 8. Southwest Monsoon Current & Sri Lanka Dome
  {
    name: 'Southwest Monsoon Current',
    color: '#38bdf8',
    speedMultiplier: 1.6,
    points: [
      { lat: 7.0, lon: 73.0 },
      { lat: 5.5, lon: 78.0 },
      { lat: 6.2, lon: 83.5 },
      { lat: 8.5, lon: 88.0 },
      { lat: 11.0, lon: 92.0 },
    ],
  },
  // 9. Agulhas Current (Powerful western boundary current)
  {
    name: 'Agulhas Retroflection',
    color: '#f59e0b',
    speedMultiplier: 1.7,
    points: [
      { lat: -14.0, lon: 42.5 },
      { lat: -21.0, lon: 38.0 },
      { lat: -29.0, lon: 33.5 },
      { lat: -36.0, lon: 26.0 },
      { lat: -39.0, lon: 21.0 },
      { lat: -38.5, lon: 32.0 },
      { lat: -36.0, lon: 44.0 },
    ],
  },
  // 10. Indonesian Throughflow (ITF)
  {
    name: 'Indonesian Throughflow',
    color: '#fbbf24',
    speedMultiplier: 1.35,
    points: [
      { lat: -8.5, lon: 118.0 },
      { lat: -11.0, lon: 112.0 },
      { lat: -12.5, lon: 104.0 },
      { lat: -13.0, lon: 94.0 },
    ],
  },
  // 11. West Australian Current (Northward branch of gyre)
  {
    name: 'West Australian Current',
    color: '#67e8f9',
    speedMultiplier: 1.05,
    points: [
      { lat: -32.0, lon: 112.0 },
      { lat: -26.0, lon: 109.0 },
      { lat: -20.0, lon: 106.0 },
      { lat: -15.0, lon: 104.0 },
    ],
  },
  // 12. Antarctic Circumpolar Drift (Roaring Forties)
  {
    name: 'Antarctic Circumpolar Flow',
    color: '#93c5fd',
    speedMultiplier: 1.25,
    points: [
      { lat: -42.0, lon: 35.0 },
      { lat: -43.0, lon: 55.0 },
      { lat: -43.5, lon: 75.0 },
      { lat: -44.0, lon: 95.0 },
      { lat: -43.0, lon: 115.0 },
    ],
  },
]

function latLonToVec3(lat: number, lon: number, altitude = 0.024): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = lon * (Math.PI / 180)
  const r = GLOBE_RADIUS + altitude

  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  )
}

export function CurrentStreamlines({ visible = true }: CurrentStreamlinesProps) {
  const particlesRef = useRef<THREE.Points | null>(null)

  const PARTICLES_PER_STREAM = 75

  // Generate curves and sampled points along the streamlines
  const { curves, particleInitialOffsets, totalParticles } = useMemo(() => {
    const builtCurves = INDIAN_OCEAN_STREAMS.map((st) => {
      const vecPoints = st.points.map((p) => latLonToVec3(p.lat, p.lon, 0.024))
      const curve = new THREE.CatmullRomCurve3(vecPoints, false, 'centripetal', 0.5)
      return { curve, def: st }
    })

    const total = builtCurves.length * PARTICLES_PER_STREAM
    const offsets = new Float32Array(total)

    for (let i = 0; i < total; i++) {
      offsets[i] = (i % PARTICLES_PER_STREAM) / PARTICLES_PER_STREAM
    }

    return {
      curves: builtCurves,
      particleInitialOffsets: offsets,
      totalParticles: total,
    }
  }, [])

  // Static line path ribbons
  const lineGeometries = useMemo(() => {
    return curves.map(({ curve }) => {
      const points = curve.getPoints(90)
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      return geo
    })
  }, [curves])

  // Dynamic particle buffer geometry with head/tail color gradients
  const particleBuffer = useMemo(() => {
    const positions = new Float32Array(totalParticles * 3)
    const colors = new Float32Array(totalParticles * 3)

    let idx = 0
    curves.forEach(({ curve, def }, cIdx) => {
      const baseCol = new THREE.Color(def.color)
      for (let i = 0; i < PARTICLES_PER_STREAM; i++) {
        const initial = particleInitialOffsets[cIdx * PARTICLES_PER_STREAM + i]
        const pt = curve.getPoint(initial)
        positions[idx * 3] = pt.x
        positions[idx * 3 + 1] = pt.y
        positions[idx * 3 + 2] = pt.z

        // High intensity head with subtle fade towards tail
        const brightness = 0.6 + 0.4 * Math.sin((i / PARTICLES_PER_STREAM) * Math.PI)
        colors[idx * 3] = baseCol.r * brightness
        colors[idx * 3 + 1] = baseCol.g * brightness
        colors[idx * 3 + 2] = baseCol.b * brightness
        idx++
      }
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeBoundingSphere()
    return geo
  }, [curves, particleInitialOffsets, totalParticles])

  // Soft circular glow point texture for streamline heads
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
      grad.addColorStop(0.35, 'rgba(125, 211, 252, 0.85)')
      grad.addColorStop(0.7, 'rgba(14, 165, 233, 0.35)')
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 32, 32)
    }
    const tex = new THREE.CanvasTexture(canvas)
    return tex
  }, [])

  // Animation Loop: advance particles continuously along streamline curves
  useFrame(({ clock }) => {
    if (!particlesRef.current || !visible) return

    const time = clock.getElapsedTime()
    const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute
    const positions = posAttr.array as Float32Array

    let pIdx = 0
    curves.forEach(({ curve, def }, cIdx) => {
      const speed = 0.08 * def.speedMultiplier
      for (let i = 0; i < PARTICLES_PER_STREAM; i++) {
        const initial = particleInitialOffsets[cIdx * PARTICLES_PER_STREAM + i]
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
    <group name="CurrentStreamlinesRoot">
      {/* ── 1. Soft subtle guide path trails ── */}
      {lineGeometries.map((geo, idx) => (
        // @ts-expect-error R3F line element geometry
        <line key={idx} geometry={geo}>
          <lineBasicMaterial
            color={curves[idx].def.color}
            transparent
            opacity={0.07}
            linewidth={1}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}

      {/* ── 2. Flowing luminous streamline particles with glowing tails ── */}
      <points ref={particlesRef} geometry={particleBuffer}>
        <pointsMaterial
          size={0.038}
          vertexColors
          map={particleTexture}
          transparent
          opacity={0.94}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}
