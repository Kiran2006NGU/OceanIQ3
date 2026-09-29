/**
 * AquaGlobe.tsx — Photorealistic 4K Earth Globe with Bathymetric Relief, PBR Specular Oceans, & Atmospheric Rayleigh Scattering
 * Faithfully matches Sketchfab Earth Globe 3D Model:
 * 1. 4K NASA Blue Marble satellite diffuse map with deep cobalt oceans, trenches, and continental shelves
 * 2. High-resolution topography & bathymetry bump mapping (earth-topology.png)
 * 3. Micro-relief normal mapping (earth-normal.jpg)
 * 4. PBR dielectric roughness map inverted from specular data (glossy water reflections, matte continents)
 * 5. Razor-sharp Rayleigh scattering Fresnel atmospheric limb glow (Apollo / ISS orbital realism)
 * 6. Dynamic oceanographic numerical simulation layers (SST, Salinity, Currents, Chl-a)
 */

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { OceanVariable } from '@/types/ocean'
import type { ModelTime } from '@/services/data/mockOceanData'
import { Html } from '@react-three/drei'
import { GLOBE_RADIUS, isLandCoordinate, latLonToVec3 } from '@/utils/geoUtils'
import { valueToRGB } from '@/utils/oceanColorScale'
import { getDataSourceOceanField } from '@/services/data/dataSource'

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

interface AquaGlobeProps {
  selectedVariable?: OceanVariable
  selectedDepth?: number
  selectedTimeIndex?: number
  selectedTime?: ModelTime
  opacity?: number
  showAtmosphere?: boolean
  showSatelliteOnly?: boolean
}

export function AquaGlobe({
  selectedVariable = 'temperature',
  selectedDepth = 0,
  selectedTimeIndex = 2,
  selectedTime,
  opacity = 0.88,
  showAtmosphere = true,
  showSatelliteOnly = false,
}: AquaGlobeProps) {
  const earthMeshRef = useRef<THREE.Mesh | null>(null)
  const oceanMeshRef = useRef<THREE.Mesh | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)

  // ── 1. High-Definition 4K Satellite Earth Map (with vibrant lighter oceans) ──
  const earthTexture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const tex = loader.load('/textures/earth-blue-marble-4k.jpg')
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = true
    return tex
  }, [])

  // ── 2. Topography & Bathymetric Elevation Bump Map ────────────────────────
  const bumpTexture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const tex = loader.load('/textures/earth-topology.png')
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    return tex
  }, [])

  // ── 3. High-Frequency Micro-Relief Normal Map ────────────────────────────
  const normalTexture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const tex = loader.load('/textures/earth-normal.jpg')
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    return tex
  }, [])

  // ── 4. Inverted Specular-to-Roughness Map for Realistic Ocean Sheen ───────
  const roughnessTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/textures/earth-specular.jpg'
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imgData.data
      for (let i = 0; i < d.length; i += 4) {
        // Specular is white on ocean, black on land
        // Invert to roughness: ocean (~255) -> low roughness (~0.18), land (~0) -> high roughness (~0.94)
        const spec = d[i] / 255
        const r = Math.round((0.94 - spec * 0.76) * 255)
        d[i] = r
        d[i + 1] = r
        d[i + 2] = r
      }
      ctx.putImageData(imgData, 0, 0)
      texture.needsUpdate = true
    }
    return texture
  }, [])

  // ── 5. PBR Earth Material (Reacts realistically to directional sunlight) ──
  const isXRayMode = selectedDepth > 0

  const earthMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.035, // Crisp mountain and ocean ridge relief
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: roughnessTexture,
      roughness: 0.65,
      metalness: 0.05,
      transparent: isXRayMode,
      opacity: isXRayMode ? 0.35 : 1.0,
      depthWrite: !isXRayMode,
    })
  }, [earthTexture, bumpTexture, normalTexture, roughnessTexture, isXRayMode])

  useEffect(() => {
    if (earthMeshRef.current) {
      const mat = earthMeshRef.current.material as THREE.MeshStandardMaterial
      mat.transparent = isXRayMode
      mat.opacity = isXRayMode ? 0.35 : 1.0
      mat.depthWrite = !isXRayMode
      mat.needsUpdate = true
    }
  }, [isXRayMode])

  // ── 6. Ultra-Subtle Natural Atmospheric Limb (Matching Sketchfab's delicate horizon) ──
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#4ea8de') },
        uPower: { value: 6.2 },
        uMultiplier: { value: 0.35 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 uColor;
        uniform float uPower;
        uniform float uMultiplier;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float fresnel = 1.0 - max(0.0, dot(viewDir, vNormal));
          float intensity = pow(fresnel, uPower) * uMultiplier;
          gl_FragColor = vec4(uColor, intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      depthWrite: false,
    })
  }, [])

  // ── 7. Dynamic Ocean Model Heatmap Canvas Texture ────────────────────────
  const { texture } = useMemo(() => {
    const cvs = document.createElement('canvas')
    cvs.width = 512
    cvs.height = 256
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

  // Render Ocean Physics Heatmap
  useEffect(() => {
    if (showSatelliteOnly) return

    let active = true

    function paintData(field: any | null) {
      if (!canvasRef.current || !textureRef.current) return

      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      ctx.imageSmoothingEnabled = false
      const w = canvasRef.current.width
      const h = canvasRef.current.height

      const imgData = ctx.createImageData(w, h)
      const data = imgData.data

      for (let py = 0; py < h; py++) {
        const lat = 90 - (py / h) * 180

        for (let px = 0; px < w; px++) {
          const lon = -180 + (px / w) * 360
          const idx = (py * w + px) * 4

          // Strict Land Masking: Leave land pixels fully transparent
          if (isLandCoordinate(lat, lon)) {
            data[idx] = 0
            data[idx + 1] = 0
            data[idx + 2] = 0
            data[idx + 3] = 0
            continue
          }

          // Sample Model Data or Analytical Physics
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
            // Analytical physics distribution for Indian Ocean Basin
            if (selectedVariable === 'temperature') {
              const tropicalWarm = 29.5 * Math.exp(-Math.pow(lat - 10, 2) / 600)
              const upwelling = -4.8 * Math.exp(-Math.pow(lat - 11, 2) / 35 - Math.pow(lon - 54, 2) / 45)
              const depthDecay = Math.exp(-selectedDepth / 320.0)
              val = 4.0 + (tropicalWarm + upwelling - 4.0) * depthDecay
            } else if (selectedVariable === 'salinity') {
              const arabsHigh = 36.6 * Math.exp(-Math.pow(lat - 16, 2) / 220 - Math.pow(lon - 64, 2) / 320)
              const bobFresh = -3.6 * Math.exp(-Math.pow(lat - 18, 2) / 100 - Math.pow(lon - 89, 2) / 100)
              const baseSal = 34.8 + 0.6 * Math.cos(((lon - 70) * Math.PI) / 60.0)
              const depthDecay = Math.exp(-selectedDepth / 450.0)
              const surfaceSal = Math.max(31.0, Math.min(37.5, (arabsHigh || baseSal) + bobFresh))
              val = 34.6 + (surfaceSal - 34.6) * depthDecay
            } else if (selectedVariable === 'current_velocity') {
              const somaliJet = 2.2 * Math.exp(-Math.pow(lat - 9, 2) / 40 - Math.pow(lon - 53, 2) / 45)
              const wyrtkiJet = 1.6 * Math.exp(-Math.pow(lat, 2) / 20 - Math.pow(lon - 80, 2) / 500)
              const eicc = 1.2 * Math.exp(-Math.pow(lat - 14, 2) / 35 - Math.pow(lon - 83, 2) / 25)
              const baseSpeed = 0.2 + 0.15 * Math.sin(lat * 0.2 + lon * 0.1)
              const depthDecay = Math.exp(-selectedDepth / 220.0)
              val = Math.min(2.5, (somaliJet + wyrtkiJet + eicc + baseSpeed) * depthDecay)
            } else if (selectedVariable === 'chlorophyll') {
              const deltaBloom = 3.8 * Math.exp(-Math.pow(lat - 19, 2) / 45 - Math.pow(lon - 89, 2) / 55)
              const srilankaDome = 2.8 * Math.exp(-Math.pow(lat - 7.5, 2) / 25 - Math.pow(lon - 83, 2) / 30)
              const somaliBloom = 3.2 * Math.exp(-Math.pow(lat - 12, 2) / 40 - Math.pow(lon - 54, 2) / 45)
              const malabarBloom = 2.4 * Math.exp(-Math.pow(lat - 10, 2) / 30 - Math.pow(lon - 75.5, 2) / 20)
              const baseChl = 0.18 + 0.08 * Math.sin(lat * 0.3)
              const depthDecay = Math.exp(-selectedDepth / 65.0)
              val = Math.min(5.0, (deltaBloom + srilankaDome + somaliBloom + malabarBloom + baseChl) * depthDecay)
            } else if (selectedVariable === 'sea_level' || selectedVariable === 'sea_surface_height') {
              const eddy1 = 18.5 * Math.sin((lat * Math.PI) / 25) * Math.cos(((lon - 85) * Math.PI) / 30)
              const eddy2 = -15.0 * Math.exp(-Math.pow(lat - 11, 2) / 40 - Math.pow(lon - 55, 2) / 45)
              const eqBelt = 12.0 * Math.exp(-Math.pow(lat, 2) / 35)
              val = Math.max(-30, Math.min(30, eddy1 + eddy2 + eqBelt))
            } else {
              val = 1.0 * Math.exp(-Math.pow(lat - 8, 2) / 30 - Math.pow(lon - 52, 2) / 30)
            }
          }

          const [r, g, b] = valueToRGB(val, selectedVariable)
          data[idx] = Math.round(r * 255)
          data[idx + 1] = Math.round(g * 255)
          data[idx + 2] = Math.round(b * 255)
          data[idx + 3] = Math.round(255 * Math.min(1, opacity * 0.95))
        }
      }

      ctx.putImageData(imgData, 0, 0)
      textureRef.current.needsUpdate = true
    }

    // 1. Immediately paint analytical physics synchronously for zero latency
    paintData(null)

    // 2. Fetch remote or ingested dataset field if available
    const timeIso = selectedTime?.isoString || '2026-08-28T12:00:00Z'
    getDataSourceOceanField(selectedVariable, selectedDepth, timeIso).then((field) => {
      if (active && field) {
        paintData(field)
      }
    })

    return () => {
      active = false
    }
  }, [selectedVariable, selectedDepth, selectedTimeIndex, selectedTime, opacity, showSatelliteOnly])

  // Concentric ocean sphere radius
  const oceanRadius = useMemo(() => {
    if (isXRayMode) {
      const depthScale = Math.min(0.25, (selectedDepth / 2000) * 0.22)
      return GLOBE_RADIUS - depthScale
    }
    return GLOBE_RADIUS + 0.012
  }, [isXRayMode, selectedDepth])

  return (
    <group name="AquaGlobeRoot">
      {/* ── 1. High-Definition 4K Satellite Earth Sphere ── */}
      <mesh
        ref={earthMeshRef}
        material={earthMaterial}
        receiveShadow
        castShadow
        rotation={[0, Math.PI, 0]}
      >
        <sphereGeometry args={[GLOBE_RADIUS, 128, 96, 0, Math.PI * 2, 0, Math.PI]} />
      </mesh>

      {/* ── 2. Dynamic Ocean Model Heatmap Sphere (Hidden in pure satellite view) ── */}
      {!showSatelliteOnly && (
        <mesh ref={oceanMeshRef} rotation={[0, Math.PI, 0]}>
          <sphereGeometry args={[oceanRadius, 128, 96, 0, Math.PI * 2, 0, Math.PI]} />
          <meshStandardMaterial
            map={texture}
            transparent={true}
            alphaTest={0.01}
            roughness={0.32}
            metalness={0.02}
            depthWrite={false}
            side={THREE.FrontSide}
          />
        </mesh>
      )}

      {/* ── 3. Ultra-Subtle Natural Atmospheric Limb Glow ── */}
      {showAtmosphere && (
        <mesh material={atmosphereMaterial}>
          <sphereGeometry args={[GLOBE_RADIUS * 1.002, 64, 48]} />
        </mesh>
      )}

      {/* ── 4. Geographic Labels (Matching Google Earth / Sketchfab Typography) ── */}
      {GEO_LABELS.map((label) => {
        const [x, y, z] = latLonToVec3(label.lat, label.lon, GLOBE_RADIUS + 0.02)
        const isOcean = label.type === 'ocean'

        return (
          <group key={label.name} position={[x, y, z]}>
            <Html
              center
              occlude
              zIndexRange={[1, 0]}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              <div
                className={[
                  'text-center font-sans whitespace-nowrap pointer-events-none select-none',
                  isOcean
                    ? 'text-[11px] italic font-medium tracking-wider text-cyan-200/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
                    : 'text-[10px] font-semibold tracking-wide text-slate-200/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]',
                ].join(' ')}
              >
                {label.name}
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}
