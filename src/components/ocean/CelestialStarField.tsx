/**
 * CelestialStarField.tsx — Deep Cosmic Skybox & Pinpoint Multi-Magnitude Starfield
 * Faithfully matches Sketchfab Earth Globe celestial aesthetics:
 * - Deep cosmos starry skybox with faint interstellar dust & nebula clouds
 * - 4,000 multi-magnitude, anti-aliased 3D point stars with realistic spectral color temperature
 * - True 3D celestial sphere with subtle parallax during orbit/pan
 * - Smooth, serene cosmic drift
 */

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTheme } from '@/context/ThemeContext'

interface CelestialStarFieldProps {
  visible?: boolean
}

export function CelestialStarField({ visible = true }: CelestialStarFieldProps) {
  const { theme } = useTheme()
  const pointsRef = useRef<THREE.Points>(null)
  const skyboxRef = useRef<THREE.Mesh>(null)

  // In light/daylight mode, do not render stars
  const isEnabled = visible && theme !== 'light'

  // ── 1. Equirectangular Deep Cosmic Nebula Skybox Texture ─────────────────
  const skyboxTexture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const tex = loader.load('/textures/night-sky.png')
    tex.colorSpace = THREE.SRGBColorSpace
    tex.mapping = THREE.EquirectangularReflectionMapping
    return tex
  }, [])

  // ── 2. Anti-Aliased Circular Pinpoint Star Texture ────────────────────────
  const starTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Draw crisp, bright star core with realistic Gaussian falloff
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30)
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
    grad.addColorStop(0.12, 'rgba(255, 255, 255, 0.95)')
    grad.addColorStop(0.35, 'rgba(220, 240, 255, 0.55)')
    grad.addColorStop(0.7, 'rgba(140, 195, 255, 0.12)')
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)

    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    return texture
  }, [])

  // ── 3. Generate 3,800 Multi-Magnitude 3D Stars Across Sphere ─────────────
  const { positions, colors, sizes } = useMemo(() => {
    const count = 3800
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    // Galactic band tilt (32 degrees)
    const tilt = THREE.MathUtils.degToRad(32)
    const cosT = Math.cos(tilt)
    const sinT = Math.sin(tilt)

    for (let i = 0; i < count; i++) {
      // 60% clustered along realistic Milky Way band, 40% uniform spherical scatter
      const isBand = i < count * 0.6

      let theta: number
      let phi: number
      let radius: number

      if (isBand) {
        theta = (Math.random() - 0.5) * Math.PI * 2
        // Safe Box-Muller Gaussian distribution along celestial equator
        const u1 = Math.max(1e-6, Math.min(0.999999, Math.random()))
        const u2 = Math.random()
        const gaussian = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
        phi = (isFinite(gaussian) ? gaussian : 0) * 0.28
        radius = 55 + Math.random() * 35
      } else {
        theta = Math.random() * Math.PI * 2
        phi = Math.asin(Math.max(-1, Math.min(1, (Math.random() - 0.5) * 2)))
        radius = 50 + Math.random() * 40
      }

      // Spherical to Cartesian
      const x = radius * Math.cos(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi)
      const z = radius * Math.cos(phi) * Math.sin(theta)

      // Apply galactic tilt
      const yTilted = y * cosT - z * sinT
      const zTilted = y * sinT + z * cosT

      positions[i * 3] = isFinite(x) ? x : 0
      positions[i * 3 + 1] = isFinite(yTilted) ? yTilted : 0
      positions[i * 3 + 2] = isFinite(zTilted) ? zTilted : 0

      // Realistic Stellar Spectral Classification Colors
      const randColor = Math.random()
      if (randColor < 0.2) {
        // Class O/B: Sapphire ice blue
        colors[i * 3] = 0.72
        colors[i * 3 + 1] = 0.86
        colors[i * 3 + 2] = 1.0
      } else if (randColor < 0.65) {
        // Class A/F: Pure diamond white
        colors[i * 3] = 0.96
        colors[i * 3 + 1] = 0.98
        colors[i * 3 + 2] = 1.0
      } else if (randColor < 0.9) {
        // Class G/K: Warm solar gold / amber
        colors[i * 3] = 1.0
        colors[i * 3 + 1] = 0.91
        colors[i * 3 + 2] = 0.75
      } else {
        // Class M: Soft reddish dwarf
        colors[i * 3] = 1.0
        colors[i * 3 + 1] = 0.78
        colors[i * 3 + 2] = 0.68
      }

      // Apparent Stellar Magnitude Hierarchy
      const randMag = Math.random()
      if (randMag > 0.96) {
        // Major bright landmark stars (Vega, Sirius, Rigel style)
        sizes[i] = 2.4 + Math.random() * 1.2
      } else if (randMag > 0.78) {
        // Medium bright stars
        sizes[i] = 1.5 + Math.random() * 0.8
      } else {
        // Faint distant background pinpoints
        sizes[i] = 0.75 + Math.random() * 0.65
      }
    }

    return { positions, colors, sizes }
  }, [])

  // Serene cosmic drift
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.0015
    }
    if (skyboxRef.current) {
      skyboxRef.current.rotation.y += delta * 0.0008
    }
  })

  if (!isEnabled) return null

  return (
    <group name="CelestialUniverse">
      {/* ── 1. Distant Cosmic Skybox Sphere (Faint interstellar dust & galaxies) ── */}
      <mesh ref={skyboxRef} scale={[-1, 1, 1]}>
        <sphereGeometry args={[95, 48, 32]} />
        <meshBasicMaterial
          map={skyboxTexture}
          side={THREE.BackSide}
          transparent={true}
          opacity={0.32}
          color="#a8c0e8"
          depthWrite={false}
        />
      </mesh>

      {/* ── 2. 3D Pinpoint Multi-Magnitude Starfield ── */}
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.6}
          sizeAttenuation={true}
          vertexColors={true}
          map={starTexture ?? undefined}
          transparent={true}
          opacity={0.92}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
