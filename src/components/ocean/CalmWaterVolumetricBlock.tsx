/**
 * CalmWaterVolumetricBlock.tsx — Fully Animated 3D Volumetric Ocean Water Column
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements full 3D Volumetric Ocean Data Visualization:
 * 1. Animated Water Surface with wave caustics & specular gloss.
 * 2. 3D Subsurface Current Streamlines with glowing particles & mesoscale eddy loops.
 * 3. Stratified Thermocline Walls (0m to 2,000m) with isopycnal depth lines.
 * 4. In-Situ Observational Devices (Interactive Hover & Click Telemetry):
 *    - Argo Profiling Float #2901452 with 2,000m 3D TubeGeometry dive tube & beacon.
 *    - Autonomous Ocean Glider SG-152 navigating 3D sawtooth depth cycles (0-1000m).
 *    - Moored CTD Rosette vertical mooring cable with 5-level sensor cages (50m, 200m, 500m, 1000m, 2000m).
 * 5. Living Biological Layers:
 *    - Phytoplankton Chlorophyll Bloom clouds (0–200m photic zone).
 *    - PFZ Pelagic Fish Shoals swimming in synchronized schools.
 * 6. Interactive Depth Slicing Plane & Core Probe Readout.
 * 7. Depth Axis Graduation Ruler (0m to 2,000m).
 */

import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { OceanVariable } from '@/types/ocean'

export interface InSituTelemetryData {
  id: string
  type: 'argo' | 'glider' | 'mooring' | 'pfz_fish' | 'phytoplankton'
  title: string
  subtitle: string
  agency: string
  depthMeters: number
  status: string
  metrics: {
    label: string
    value: string
    unit?: string
    color?: string
  }[]
  diagnostics?: {
    battery?: string
    telemetry?: string
    cycle?: string
    heading?: string
    pitch?: string
    targetWaypoint?: string
    sensors?: string[]
  }
  description: string
}

export interface CalmWaterVolumetricBlockProps {
  variable: OceanVariable
  transparency: number
  zRotation: number
  isAnimating: boolean
  showBoundingBox: boolean
  yClippingFraction: number // 0 (surface) to 1 (full depth)
  portionName: string
  lat: number
  lon: number
  maxDepth?: number
  showCurrents?: boolean
  showInSituDevices?: boolean
  showBiology?: boolean
  showDepthSlice?: boolean
  showDepthRuler?: boolean
  animationSpeed?: number
  selectedDeviceId?: string | null
  onSelectDevice?: (device: InSituTelemetryData | null) => void
  onHoverDevice?: (deviceId: string | null) => void
}

// ─── Surface Texture Generator (Waves & Caustics) ─────────────────────────────
function generateCalmSurfaceTexture(variable: OceanVariable, lat: number, lon: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#061325'
  ctx.fillRect(0, 0, 512, 512)

  const grad = ctx.createLinearGradient(0, 0, 512, 512)
  if (variable === 'temperature') {
    grad.addColorStop(0.0, '#e63946') // Warm Tropical Pool (30°C)
    grad.addColorStop(0.25, '#f4a261')
    grad.addColorStop(0.55, '#e9c46a')
    grad.addColorStop(0.8, '#2a9d8f')
    grad.addColorStop(1.0, '#264653')
  } else if (variable === 'salinity') {
    grad.addColorStop(0.0, '#d946ef')
    grad.addColorStop(0.3, '#8b5cf6')
    grad.addColorStop(0.7, '#3b82f6')
    grad.addColorStop(1.0, '#1e3a8a')
  } else if (variable === 'current_velocity') {
    grad.addColorStop(0.0, '#ef4444')
    grad.addColorStop(0.3, '#f59e0b')
    grad.addColorStop(0.6, '#10b981')
    grad.addColorStop(1.0, '#0284c7')
  } else {
    grad.addColorStop(0.0, '#22c55e')
    grad.addColorStop(0.4, '#06b6d4')
    grad.addColorStop(1.0, '#0f172a')
  }
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 512)

  // Surface eddy spirals & wave ripples
  ctx.lineWidth = 1.5
  for (let i = 0; i < 20; i++) {
    const cx = 160 + Math.sin(lat + i * 0.35) * 140
    const cy = 210 + Math.cos(lon + i * 0.45) * 140
    const r = 35 + i * 18
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.09 - i * 0.0035})`
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.generateMipmaps = true
  return texture
}

// ─── Stratified Thermocline Wall Texture ───────────────────────────────────────
function generateStratifiedWallTexture(variable: OceanVariable): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, 0, 512)
  if (variable === 'temperature') {
    grad.addColorStop(0.0, '#e63946')   // Mixed Layer (30°C)
    grad.addColorStop(0.08, '#f77f00')  // 28°C
    grad.addColorStop(0.18, '#fcbf49')  // 25°C
    grad.addColorStop(0.28, '#80ed99')  // Thermocline transition (Green/Lime)
    grad.addColorStop(0.42, '#38bdf8')  // Upper Thermocline (Cerulean)
    grad.addColorStop(0.65, '#0284c7')  // Subsurface Water
    grad.addColorStop(0.85, '#1e3a8a')  // Deep Oceanic Layer
    grad.addColorStop(1.0, '#172554')   // Abyssal Floor (4°C)
  } else if (variable === 'salinity') {
    grad.addColorStop(0.0, '#f472b6')
    grad.addColorStop(0.2, '#c084fc')
    grad.addColorStop(0.5, '#60a5fa')
    grad.addColorStop(0.8, '#1e40af')
    grad.addColorStop(1.0, '#0f172a')
  } else if (variable === 'current_velocity') {
    grad.addColorStop(0.0, '#ef4444')
    grad.addColorStop(0.2, '#f59e0b')
    grad.addColorStop(0.5, '#10b981')
    grad.addColorStop(0.8, '#0284c7')
    grad.addColorStop(1.0, '#0f172a')
  } else {
    grad.addColorStop(0.0, '#22c55e')
    grad.addColorStop(0.25, '#10b981')
    grad.addColorStop(0.5, '#06b6d4')
    grad.addColorStop(0.8, '#1e3a8a')
    grad.addColorStop(1.0, '#020617')
  }
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 512)

  // Horizontal isopycnal depth contour lines
  ctx.lineWidth = 1.0
  for (let y = 0; y < 512; y += 40) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(256, y)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.generateMipmaps = true
  return texture
}

export function CalmWaterVolumetricBlock({
  variable,
  transparency,
  zRotation,
  isAnimating,
  showBoundingBox,
  yClippingFraction,
  lat,
  lon,
  maxDepth = 2000,
  showCurrents = true,
  showInSituDevices = true,
  showBiology = true,
  showDepthSlice = true,
  showDepthRuler = true,
  animationSpeed = 1,
  selectedDeviceId = null,
  onSelectDevice,
  onHoverDevice,
}: CalmWaterVolumetricBlockProps) {
  const groupRef = useRef<THREE.Group>(null)
  const currentParticlesRef = useRef<THREE.Points>(null)
  const phytoParticlesRef = useRef<THREE.Points>(null)
  const fishGroupRef = useRef<THREE.Group>(null)
  const gliderRef = useRef<THREE.Group>(null)
  const argoBeaconRef = useRef<THREE.Mesh>(null)

  // Internal hover state
  const [internalHoverId, setInternalHoverId] = useState<string | null>(null)

  // Handlers for pointer events
  const handlePointerOver = (id: string, e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
    setInternalHoverId(id)
    onHoverDevice?.(id)
  }

  const handlePointerOut = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    document.body.style.cursor = 'auto'
    setInternalHoverId(null)
    onHoverDevice?.(null)
  }

  const handleClickDevice = (data: InSituTelemetryData, e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    onSelectDevice?.(data)
  }

  // Dimension proportions (scaled for 3D viewport)
  const width = 3.6
  const length = 3.6
  const height = 3.0

  // Procedural Textures
  const topTexture = useMemo(() => generateCalmSurfaceTexture(variable, lat, lon), [variable, lat, lon])
  const wallTexture = useMemo(() => generateStratifiedWallTexture(variable), [variable])

  // ── Device Telemetry Data Dictionaries ──────────────────────────────────────
  const argoData: InSituTelemetryData = useMemo(() => ({
    id: 'argo-2901452',
    type: 'argo',
    title: 'Argo Profiling Float #2901452',
    subtitle: 'INCOIS / INOSHAC Indian Ocean Bio-Argo Fleet',
    agency: 'INCOIS / MoES India',
    depthMeters: 842,
    status: 'Active Profiling (0-2000m)',
    metrics: [
      { label: 'Platform Model', value: 'APEX Apex-11 CTD-O2' },
      { label: 'Current Depth', value: '842 m', color: 'text-cyan-300' },
      { label: 'In-Situ Temp', value: '9.84 °C', color: 'text-amber-300' },
      { label: 'Salinity', value: '34.91 PSU', color: 'text-cyan-400' },
      { label: 'Dissolved O₂', value: '136.2 µmol/kg', color: 'text-emerald-400' },
      { label: 'Pressure', value: '850.4 dbar' },
      { label: 'Coordinates', value: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E` },
      { label: 'Drift Park Depth', value: '1,000 m' },
    ],
    diagnostics: {
      battery: '94% (Lithium Pack)',
      telemetry: 'Iridium SBD 2-Way (Online)',
      cycle: '#142 / 10-Day Cycle',
      sensors: ['Sea-Bird SBE 41CP CTD', 'Aanderaa 4330 Optode', 'WET Labs ECO-FLBB'],
    },
    description: 'Autonomous robotic float performing continuous vertical CTD and dissolved oxygen profiling down to 2,000m depths in the Indian Ocean basin.',
  }), [lat, lon])

  const gliderData: InSituTelemetryData = useMemo(() => ({
    id: 'glider-sg152',
    type: 'glider',
    title: 'Autonomous Ocean Glider SG-152 "Nautilus"',
    subtitle: 'NIOT Ocean Glider Boundary Current Survey',
    agency: 'NIOT / MoES India',
    depthMeters: 420,
    status: 'Sawtooth Gliding (0-1000m)',
    metrics: [
      { label: 'Glider Model', value: 'Slocum G3 Deep Glider' },
      { label: 'Current Depth', value: '420 m (Descent Phase)', color: 'text-cyan-300' },
      { label: 'Glide Velocity', value: '0.38 m/s (0.74 kts)', color: 'text-emerald-300' },
      { label: 'Pitch Angle', value: '-18.5° (Sawtooth Dive)', color: 'text-amber-300' },
      { label: 'In-Situ Temp', value: '16.2 °C', color: 'text-amber-400' },
      { label: 'Salinity', value: '34.68 PSU', color: 'text-cyan-400' },
      { label: 'Turbidity', value: '0.14 NTU' },
      { label: 'Mission Section', value: 'Section 14B Boundary Transect' },
    ],
    diagnostics: {
      battery: '78% (~48 days endurance)',
      telemetry: 'Iridium / FreeWave Acoustic Link',
      heading: '142° (South-East Transect)',
      pitch: '-18.5°',
      targetWaypoint: `${(lat + 0.2).toFixed(2)}°N, ${(lon - 0.3).toFixed(2)}°E`,
      sensors: ['SBE 41-Glider CTD', 'Turner Cyclops CDOM', 'Aanderaa Oxygen'],
    },
    description: 'Buoyancy-driven underwater vehicle navigating high-resolution vertical sawtooth flight cycles to map boundary current shears and pycnocline eddies.',
  }), [lat, lon])

  const mooringData: InSituTelemetryData = useMemo(() => ({
    id: 'mooring-omni-bd08',
    type: 'mooring',
    title: 'Moored CTD Rosette Array (OMNI BD-08)',
    subtitle: 'RAMA Tropical Indian Ocean Mooring Network',
    agency: 'NIOT / INCOIS Ocean Observation System',
    depthMeters: 2000,
    status: 'Taut-Wire Moored (0-2000m)',
    metrics: [
      { label: 'Station ID', value: 'OMNI BD-08 (RAMA Deep)' },
      { label: 'Mooring Depth', value: '2,000 m Full Water Column', color: 'text-cyan-300' },
      { label: 'Upper Layer (50m)', value: '28.6°C | 33.4 PSU', color: 'text-amber-300' },
      { label: 'Thermocline (200m)', value: '21.4°C | 34.8 PSU', color: 'text-emerald-400' },
      { label: 'Intermediate (500m)', value: '11.5°C | 35.0 PSU' },
      { label: 'Deep Abyss (2000m)', value: '3.8°C | 34.8 PSU' },
      { label: 'ADCP Current', value: '0.48 m/s @ 115° Heading', color: 'text-cyan-400' },
      { label: 'Coordinates', value: `${(lat - 0.25).toFixed(2)}°N, ${(lon - 0.2).toFixed(2)}°E` },
    ],
    diagnostics: {
      battery: 'Solar / Deep Sea Alkaline Pack (Nominal)',
      telemetry: 'INSAT & Iridium Real-Time Hourly Uplink',
      sensors: ['Teledyne RDI 300kHz ADCP', 'Sea-Bird SBE 37-IM MicroCAT (x5)', 'MetPak Pro Surface Station'],
    },
    description: 'Full water-column oceanographic mooring anchored from surface to abyssal sea floor measuring high-frequency internal waves, monsoon currents, and thermocline heat content.',
  }), [lat, lon])

  const fishData: InSituTelemetryData = useMemo(() => ({
    id: 'biology-pfz-fish',
    type: 'pfz_fish',
    title: 'Potential Fishing Zone (PFZ) Pelagic Shoal',
    subtitle: 'INCOIS Marine Fishery Advisory System',
    agency: 'INCOIS Marine Living Resources (MLR)',
    depthMeters: 45,
    status: 'Biological Pelagic Aggregation (0-80m)',
    metrics: [
      { label: 'Target Species', value: 'Yellowfin Tuna & Skipjack', color: 'text-amber-300' },
      { label: 'Epipelagic Stratum', value: '0m – 80m Photic Zone', color: 'text-cyan-300' },
      { label: 'Thermal Window', value: '27.5°C – 29.2°C Optimal', color: 'text-emerald-400' },
      { label: 'Chlorophyll Gradient', value: '0.82 mg/m³ Frontal Zone', color: 'text-cyan-400' },
      { label: 'Biomass Estimate', value: '14.8 tonnes / km²' },
      { label: 'PFZ Advisory Index', value: 'High Potential (Confidence 92%)' },
    ],
    description: 'High-density commercial pelagic fish aggregation sustained by chlorophyll-rich thermal front convergence in the upper euphotic layer.',
  }), [])

  const phytoData: InSituTelemetryData = useMemo(() => ({
    id: 'biology-phytoplankton',
    type: 'phytoplankton',
    title: 'Photic Zone Phytoplankton Bloom',
    subtitle: 'MODIS/Sentinel-3 Ocean Color Bio-Optics',
    agency: 'INCOIS / ISRO Oceansat-3 Bio-Optics',
    depthMeters: 80,
    status: 'Active Photosynthetic Bloom (0-150m)',
    metrics: [
      { label: 'Photic Zone Depth', value: '0m – 150m Euphotic Base', color: 'text-emerald-400' },
      { label: 'Chlorophyll-a', value: '1.45 mg/m³ Peak', color: 'text-emerald-300' },
      { label: 'PAR Irradiance', value: '185 µmol photons/m²/s' },
      { label: 'Primary Production', value: '1,250 mg C/m²/day', color: 'text-cyan-300' },
      { label: 'Dominant Phytoplankton', value: 'Diatoms & Synechococcus' },
    ],
    description: 'Sunlit photosynthetic chloroplast layer providing the primary trophic base for the regional marine ecosystem.',
  }), [])

  // ── 1. Subsurface Current 3D Splines ────────────────────────────────────────
  const currentCurves = useMemo(() => {
    const curves: { curve: THREE.CatmullRomCurve3; speed: number; count: number; color: string }[] = []

    // Surface Current Jet (0 to 100m)
    curves.push({
      curve: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-width * 0.45, height * 0.42, -length * 0.35),
        new THREE.Vector3(-width * 0.15, height * 0.44, -length * 0.1),
        new THREE.Vector3(width * 0.2, height * 0.41, length * 0.2),
        new THREE.Vector3(width * 0.45, height * 0.43, length * 0.38),
      ]),
      speed: 0.22,
      count: 140,
      color: '#ef4444',
    })

    // Thermocline Meandering Eddy (200m to 500m)
    curves.push({
      curve: new THREE.CatmullRomCurve3([
        new THREE.Vector3(width * 0.35, height * 0.18, -length * 0.3),
        new THREE.Vector3(width * 0.1, height * 0.15, 0),
        new THREE.Vector3(-width * 0.25, height * 0.22, -length * 0.15),
        new THREE.Vector3(-width * 0.1, height * 0.2, length * 0.3),
        new THREE.Vector3(width * 0.35, height * 0.18, -length * 0.3),
      ]),
      speed: 0.14,
      count: 110,
      color: '#f59e0b',
    })

    // Deep Undercurrent (800m to 1500m)
    curves.push({
      curve: new THREE.CatmullRomCurve3([
        new THREE.Vector3(width * 0.4, -height * 0.22, length * 0.35),
        new THREE.Vector3(width * 0.05, -height * 0.25, length * 0.05),
        new THREE.Vector3(-width * 0.25, -height * 0.2, -length * 0.25),
        new THREE.Vector3(-width * 0.42, -height * 0.23, -length * 0.4),
      ]),
      speed: 0.09,
      count: 90,
      color: '#06b6d4',
    })

    // Abyssal Inflow (1800m to 2000m)
    curves.push({
      curve: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-width * 0.38, -height * 0.42, length * 0.3),
        new THREE.Vector3(0, -height * 0.44, 0),
        new THREE.Vector3(width * 0.38, -height * 0.43, -length * 0.3),
      ]),
      speed: 0.05,
      count: 70,
      color: '#3b82f6',
    })

    return curves
  }, [width, height, length])

  // Total current particles buffer
  const totalCurrentParticles = useMemo(
    () => currentCurves.reduce((acc, c) => acc + c.count, 0),
    [currentCurves]
  )

  const { currentParticleBuffer, currentInitialOffsets } = useMemo(() => {
    const positions = new Float32Array(totalCurrentParticles * 3)
    const colors = new Float32Array(totalCurrentParticles * 3)
    const offsets: number[] = []

    let pIdx = 0
    currentCurves.forEach((c) => {
      const col = new THREE.Color(c.color)
      for (let i = 0; i < c.count; i++) {
        const offset = Math.random()
        offsets.push(offset)
        const pt = c.curve.getPoint(offset)

        positions[pIdx * 3] = pt.x + (Math.random() - 0.5) * 0.08
        positions[pIdx * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.08
        positions[pIdx * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.08

        colors[pIdx * 3] = col.r
        colors[pIdx * 3 + 1] = col.g
        colors[pIdx * 3 + 2] = col.b
        pIdx++
      }
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    return { currentParticleBuffer: geo, currentInitialOffsets: offsets }
  }, [currentCurves, totalCurrentParticles])

  // ── 2. Biological Euphotic Phytoplankton Buffer (0 to 200m) ─────────────────
  const phytoBuffer = useMemo(() => {
    const count = 350
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * (width * 0.9)
      // Upper 20% of the water column
      positions[i * 3 + 1] = height * 0.3 + Math.random() * (height * 0.18)
      positions[i * 3 + 2] = (Math.random() - 0.5) * (length * 0.9)

      // Emerald green to cyan hue
      colors[i * 3] = 0.1 + Math.random() * 0.2
      colors[i * 3 + 1] = 0.85 + Math.random() * 0.15
      colors[i * 3 + 2] = 0.4 + Math.random() * 0.3
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [width, height, length])

  // ── 3. Argo 3D Dive Tube Geometry (Surface to 2,000m floor) ────────────────
  const argoTubeGeometry = useMemo(() => {
    const pts = [
      new THREE.Vector3(width * 0.25, height / 2, -length * 0.25),
      new THREE.Vector3(width * 0.26, height * 0.2, -length * 0.24),
      new THREE.Vector3(width * 0.22, 0, -length * 0.28),
      new THREE.Vector3(width * 0.24, -height * 0.25, -length * 0.23),
      new THREE.Vector3(width * 0.25, -height / 2, -length * 0.25),
    ]
    const curve = new THREE.CatmullRomCurve3(pts)
    return new THREE.TubeGeometry(curve, 28, 0.024, 8, false)
  }, [width, height, length])

  // ── 4. Glider Sawtooth Path Curve ─────────────────────────────────────────
  const gliderSawtoothCurve = useMemo(() => {
    const pts = [
      new THREE.Vector3(-width * 0.38, height * 0.44, length * 0.32),
      new THREE.Vector3(-width * 0.2, 0.05, length * 0.15),
      new THREE.Vector3(-width * 0.05, height * 0.42, 0),
      new THREE.Vector3(width * 0.12, 0.02, -length * 0.15),
      new THREE.Vector3(width * 0.32, height * 0.44, -length * 0.3),
    ]
    return new THREE.CatmullRomCurve3(pts)
  }, [width, height, length])

  const gliderPathGeometry = useMemo(() => {
    const pts = gliderSawtoothCurve.getPoints(60)
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [gliderSawtoothCurve])

  // ── Continuous Animation Frame ─────────────────────────────────────────────
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime() * animationSpeed

    // 1. Z-axis Rotation (Only rotates when isAnimating is explicitly true)
    if (groupRef.current) {
      if (isAnimating) {
        groupRef.current.rotation.y += delta * 0.35 * animationSpeed
      } else {
        groupRef.current.rotation.y = (zRotation * Math.PI) / 180
      }
    }

    // 2. Animate Subsurface Current Particles
    if (currentParticlesRef.current && showCurrents) {
      const posAttr = currentParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute
      const positions = posAttr.array as Float32Array

      let pIdx = 0
      let offsetAccum = 0
      currentCurves.forEach((c) => {
        for (let i = 0; i < c.count; i++) {
          const initial = currentInitialOffsets[offsetAccum + i]
          const progress = (initial + t * c.speed) % 1.0
          const pt = c.curve.getPoint(progress)

          positions[pIdx * 3] = pt.x
          positions[pIdx * 3 + 1] = pt.y
          positions[pIdx * 3 + 2] = pt.z
          pIdx++
        }
        offsetAccum += c.count
      })
      posAttr.needsUpdate = true
    }

    // 3. Pulse Phytoplankton Bloom
    if (phytoParticlesRef.current && showBiology) {
      const scale = 1.0 + Math.sin(t * 1.5) * 0.03
      phytoParticlesRef.current.scale.set(scale, scale, scale)
    }

    // 4. Swim Fish Shoals
    if (fishGroupRef.current && showBiology) {
      fishGroupRef.current.position.x = Math.sin(t * 0.8) * 0.6 - 0.2
      fishGroupRef.current.position.z = Math.cos(t * 0.8) * 0.6 + 0.1
      fishGroupRef.current.rotation.y = t * 0.8 + Math.PI / 2
    }

    // 5. Navigate Glider along Sawtooth Flight Path
    if (gliderRef.current && showInSituDevices) {
      const gliderProgress = (t * 0.08) % 1.0
      const pt = gliderSawtoothCurve.getPoint(gliderProgress)
      const tangent = gliderSawtoothCurve.getTangent(gliderProgress)

      gliderRef.current.position.copy(pt)
      gliderRef.current.lookAt(pt.clone().add(tangent))
    }

    // 6. Pulse Argo Float Beacon
    if (argoBeaconRef.current && showInSituDevices) {
      const s = 1.0 + Math.sin(t * 4) * 0.25
      argoBeaconRef.current.scale.set(s, s, s)
    }
  })

  // Materials
  const topMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ map: topTexture, roughness: 0.2, metalness: 0.15, transparent: true, opacity: Math.max(0.2, transparency), side: THREE.DoubleSide }),
    [topTexture, transparency]
  )

  const wallMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.35, metalness: 0.1, transparent: true, opacity: Math.max(0.2, transparency), side: THREE.DoubleSide }),
    [wallTexture, transparency]
  )

  const bottomMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.8, transparent: true, opacity: Math.max(0.3, transparency), side: THREE.DoubleSide }),
    [transparency]
  )

  // Internal horizontal slice position
  const sliceY = height / 2 - yClippingFraction * height
  const probedDepthMeters = Math.round(yClippingFraction * maxDepth)

  const isArgoHovered = internalHoverId === 'argo-2901452' || selectedDeviceId === 'argo-2901452'
  const isGliderHovered = internalHoverId === 'glider-sg152' || selectedDeviceId === 'glider-sg152'
  const isMooringHovered = internalHoverId === 'mooring-omni-bd08' || selectedDeviceId === 'mooring-omni-bd08'
  const isFishHovered = internalHoverId === 'biology-pfz-fish' || selectedDeviceId === 'biology-pfz-fish'
  const isPhytoHovered = internalHoverId === 'biology-phytoplankton' || selectedDeviceId === 'biology-phytoplankton'

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── 1. Volumetric Cuboid Shell ────────────────────────────────────── */}
      <mesh position={[0, height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} material={topMaterial}>
        <planeGeometry args={[width, length]} />
      </mesh>
      <mesh position={[0, 0, length / 2]} material={wallMaterial}>
        <planeGeometry args={[width, height]} />
      </mesh>
      <mesh position={[0, 0, -length / 2]} rotation={[0, Math.PI, 0]} material={wallMaterial}>
        <planeGeometry args={[width, height]} />
      </mesh>
      <mesh position={[width / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial}>
        <planeGeometry args={[length, height]} />
      </mesh>
      <mesh position={[-width / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={wallMaterial}>
        <planeGeometry args={[length, height]} />
      </mesh>
      <mesh position={[0, -height / 2, 0]} rotation={[Math.PI / 2, 0, 0]} material={bottomMaterial}>
        <planeGeometry args={[width, length]} />
      </mesh>

      {/* ── 2. Current Streamlines ────────────────────────── */}
      {showCurrents && (
        <group name="VolumetricCurrents">
          {currentCurves.map((c, i) => {
            const pts = c.curve.getPoints(40)
            const geo = new THREE.BufferGeometry().setFromPoints(pts)
            return (
              // @ts-expect-error R3F line
              <line key={i} geometry={geo}>
                <lineBasicMaterial color={c.color} transparent opacity={0.35} linewidth={1.5} />
              </line>
            )
          })}
          <points ref={currentParticlesRef} geometry={currentParticleBuffer}>
            <pointsMaterial size={0.055} vertexColors transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
          </points>
        </group>
      )}

      {/* ── 3. Biological Living Layers ──────── */}
      {showBiology && (
        <group name="VolumetricBiology">
          {/* Phytoplankton Bloom */}
          <group
            onClick={(e) => handleClickDevice(phytoData, e)}
            onPointerOver={(e) => handlePointerOver('biology-phytoplankton', e)}
            onPointerOut={handlePointerOut}
          >
            <points ref={phytoParticlesRef} geometry={phytoBuffer}>
              <pointsMaterial
                size={isPhytoHovered ? 0.085 : 0.065}
                vertexColors
                transparent
                opacity={isPhytoHovered ? 0.95 : 0.78}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </points>
            {isPhytoHovered && (
              <Html position={[0, height * 0.4, 0]} distanceFactor={5.5} center occlude zIndexRange={[1, 0]}>
                <div className="px-2.5 py-1.5 rounded-xl bg-black/90 border border-emerald-400 text-[9px] font-mono text-emerald-200 shadow-2xl backdrop-blur-md cursor-pointer animate-fade-in pointer-events-auto">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>🌿 Phytoplankton Bloom (0-150m)</span>
                  </div>
                  <div className="text-[8px] text-slate-300 mt-0.5">Chlorophyll-a: <strong className="text-emerald-300">1.45 mg/m³</strong> | PAR: 185 µmol</div>
                  <div className="text-[7.5px] text-emerald-400 font-bold mt-1 underline">Click to view full bio-optic telemetry</div>
                </div>
              </Html>
            )}
          </group>

          {/* PFZ Fish Shoals */}
          <group
            ref={fishGroupRef}
            position={[-0.2, height * 0.35, 0]}
            onClick={(e) => handleClickDevice(fishData, e)}
            onPointerOver={(e) => handlePointerOver('biology-pfz-fish', e)}
            onPointerOut={handlePointerOut}
          >
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.038, 0.13, 5]} />
              <meshStandardMaterial
                color={isFishHovered ? '#fef08a' : '#fbbf24'}
                emissive={isFishHovered ? '#eab308' : '#d97706'}
                emissiveIntensity={isFishHovered ? 1.4 : 0.8}
              />
            </mesh>
            <mesh position={[0.08, 0.02, -0.06]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.025, 0.08, 4]} />
              <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[-0.07, -0.02, 0.06]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.022, 0.07, 4]} />
              <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.6} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.14, 0.18, 24]} />
              <meshBasicMaterial
                color={isFishHovered ? '#ffffff' : '#fbbf24'}
                side={THREE.DoubleSide}
                transparent
                opacity={isFishHovered ? 0.8 : 0.4}
              />
            </mesh>
            <Html distanceFactor={6} center occlude zIndexRange={[1, 0]}>
              <div
                className={`px-2 py-1 rounded-lg border text-[8.5px] font-mono whitespace-nowrap shadow-xl flex items-center gap-1.5 transition-all cursor-pointer pointer-events-auto ${
                  isFishHovered
                    ? 'bg-[#0f172a] border-amber-400 text-amber-200 scale-105 ring-2 ring-amber-400/40'
                    : 'bg-black/85 border-amber-400/40 text-amber-300'
                }`}
              >
                <span>🐟</span>
                <span>PFZ Pelagic Fish Shoal (Yellowfin Tuna)</span>
                {isFishHovered && <span className="text-[7.5px] text-amber-400 font-bold ml-1">● Click to Inspect</span>}
              </div>
            </Html>
          </group>
        </group>
      )}

      {/* ── 4. In-Situ Observational Platforms ─────────────────────────────── */}
      {showInSituDevices && (
        <group name="VolumetricInSituDevices">
          {/* A. Argo Float */}
          <group position={[0, 0, 0]}>
            <mesh
              geometry={argoTubeGeometry}
              onClick={(e) => handleClickDevice(argoData, e)}
              onPointerOver={(e) => handlePointerOver('argo-2901452', e)}
              onPointerOut={handlePointerOut}
            >
              <meshStandardMaterial
                color={isArgoHovered ? '#38bdf8' : '#00f5d4'}
                emissive={isArgoHovered ? '#0284c7' : '#0891b2'}
                emissiveIntensity={isArgoHovered ? 1.2 : 0.65}
                transparent
                opacity={isArgoHovered ? 0.98 : 0.88}
                roughness={0.2}
              />
            </mesh>
            <group
              position={[width * 0.25, height / 2, -length * 0.25]}
              onClick={(e) => handleClickDevice(argoData, e)}
              onPointerOver={(e) => handlePointerOver('argo-2901452', e)}
              onPointerOut={handlePointerOut}
            >
              <mesh>
                <sphereGeometry args={[isArgoHovered ? 0.08 : 0.065, 16, 16]} />
                <meshStandardMaterial
                  color={isArgoHovered ? '#67e8f9' : '#38bdf8'}
                  emissive={isArgoHovered ? '#06b6d4' : '#0284c7'}
                  emissiveIntensity={isArgoHovered ? 1.4 : 0.8}
                  roughness={0.2}
                />
              </mesh>
              <mesh position={[0, 0.09, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 0.1, 8]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
              </mesh>
              <mesh ref={argoBeaconRef} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.09, 0.13, 24]} />
                <meshBasicMaterial color={isArgoHovered ? '#ffffff' : '#38bdf8'} side={THREE.DoubleSide} transparent opacity={isArgoHovered ? 0.95 : 0.75} />
              </mesh>
              <Html position={[0, 0.18, 0]} distanceFactor={5.5} center occlude zIndexRange={[1, 0]}>
                <div
                  className={`px-2.5 py-1.5 rounded-xl border shadow-2xl font-mono text-[9px] whitespace-nowrap transition-all cursor-pointer pointer-events-auto ${
                    isArgoHovered
                      ? 'bg-[#020b18] border-cyan-400 text-cyan-200 scale-105 ring-2 ring-cyan-400/50'
                      : 'bg-[#020b18]/90 border-cyan-400/60 text-cyan-200'
                  }`}
                >
                  <div className="font-bold text-white flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>Argo Float #2901452</span>
                    </span>
                    <span className="text-[7.5px] bg-cyan-500/20 text-cyan-300 px-1 rounded">INCOIS</span>
                  </div>
                  <div className="text-[8px] text-slate-300 mt-0.5 flex items-center gap-2">
                    <span>Depth: <strong className="text-cyan-300">842m</strong></span>
                    <span>Temp: <strong className="text-amber-300">9.84°C</strong></span>
                    <span>Sal: <strong className="text-blue-300">34.9 PSU</strong></span>
                  </div>
                  <div className="text-[7.5px] text-cyan-400 font-bold mt-1 flex items-center justify-between">
                    <span>Dive: 0m → 2000m</span>
                    <span className="underline">Click to Inspect</span>
                  </div>
                </div>
              </Html>
            </group>

            {/* Parking Drift Sensor at 1000m */}
            <group
              position={[width * 0.22, 0, -length * 0.28]}
              onClick={(e) => handleClickDevice(argoData, e)}
              onPointerOver={(e) => handlePointerOver('argo-2901452', e)}
              onPointerOut={handlePointerOut}
            >
              <mesh>
                <sphereGeometry args={[0.045, 12, 12]} />
                <meshStandardMaterial
                  color="#0284c7"
                  emissive="#0369a1"
                  emissiveIntensity={isArgoHovered ? 1.5 : 0.9}
                />
              </mesh>
              <Html distanceFactor={6} center occlude zIndexRange={[1, 0]}>
                <div className="px-1.5 py-0.5 rounded bg-black/80 border border-cyan-500/40 text-[7px] font-mono text-cyan-300 whitespace-nowrap cursor-pointer pointer-events-auto">
                  Argo Park Depth: 1000m
                </div>
              </Html>
            </group>
          </group>

          {/* B. Autonomous Glider */}
          <group position={[0, 0, 0]}>
            {/* @ts-expect-error R3F line element */}
            <line geometry={gliderPathGeometry}>
              <lineBasicMaterial color={isGliderHovered ? '#fbbf24' : '#f59e0b'} transparent opacity={isGliderHovered ? 0.95 : 0.7} linewidth={2} />
            </line>
            <group
              ref={gliderRef}
              onClick={(e) => handleClickDevice(gliderData, e)}
              onPointerOver={(e) => handlePointerOver('glider-sg152', e)}
              onPointerOut={handlePointerOut}
            >
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.026, 0.026, 0.13, 12]} />
                <meshStandardMaterial
                  color={isGliderHovered ? '#fbbf24' : '#f59e0b'}
                  emissive={isGliderHovered ? '#eab308' : '#d97706'}
                  emissiveIntensity={isGliderHovered ? 1.2 : 0.6}
                />
              </mesh>
              <mesh position={[0.075, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.026, 0.038, 12]} />
                <meshStandardMaterial color="#ef4444" />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.032, 0.005, 0.19]} />
                <meshStandardMaterial color="#d97706" metalness={0.5} />
              </mesh>
              <mesh position={[-0.055, 0.032, 0]}>
                <boxGeometry args={[0.026, 0.038, 0.005]} />
                <meshStandardMaterial color="#d97706" metalness={0.5} />
              </mesh>
              <Html distanceFactor={5.5} center occlude zIndexRange={[1, 0]}>
                <div
                  className={`px-2.5 py-1.5 rounded-xl border shadow-2xl font-mono text-[9px] whitespace-nowrap transition-all cursor-pointer pointer-events-auto ${
                    isGliderHovered
                      ? 'bg-[#0b1019] border-amber-400 text-amber-200 scale-105 ring-2 ring-amber-400/50'
                      : 'bg-[#0b1019]/90 border-amber-400/50 text-amber-300'
                  }`}
                >
                  <div className="font-bold text-white flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5"><span>✈️</span><span>Glider SG-152 "Nautilus"</span></span>
                    <span className="text-[7.5px] bg-amber-500/20 text-amber-300 px-1 rounded">NIOT</span>
                  </div>
                  <div className="text-[8px] text-slate-300 mt-0.5 flex items-center gap-2">
                    <span>Depth: <strong className="text-cyan-300">420m</strong></span>
                    <span>Pitch: <strong className="text-amber-300">-18.5°</strong></span>
                    <span>Speed: <strong className="text-emerald-300">0.38 m/s</strong></span>
                  </div>
                  <div className="text-[7.5px] text-amber-400 font-bold mt-1 flex items-center justify-between">
                    <span>Sawtooth: 0m ➔ 1000m</span>
                    <span className="underline">Click to Inspect</span>
                  </div>
                </div>
              </Html>
            </group>
          </group>

          {/* C. Moored CTD Rosette */}
          <group
            position={[-width * 0.3, 0, -length * 0.2]}
            onClick={(e) => handleClickDevice(mooringData, e)}
            onPointerOver={(e) => handlePointerOver('mooring-omni-bd08', e)}
            onPointerOut={handlePointerOut}
          >
            <mesh>
              <cylinderGeometry args={[0.005, 0.005, height, 6]} />
              <meshStandardMaterial
                color={isMooringHovered ? '#38bdf8' : '#94a3b8'}
                metalness={0.8}
                emissive={isMooringHovered ? '#0284c7' : '#000000'}
                emissiveIntensity={isMooringHovered ? 0.8 : 0}
              />
            </mesh>
            <mesh position={[0, height / 2, 0]}>
              <cylinderGeometry args={[0.06, 0.04, 0.05, 12]} />
              <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.8} />
            </mesh>
            {[
              { y: height * 0.35 }, { y: height * 0.1 }, { y: -height * 0.15 }, { y: -height * 0.32 }, { y: -height * 0.46 }
            ].map((cage, idx) => (
              <group key={idx} position={[0, cage.y, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.038, 0.038, 0.045, 8]} />
                  <meshStandardMaterial
                    color={isMooringHovered ? '#facc15' : '#eab308'}
                    emissive={isMooringHovered ? '#ca8a04' : '#a16207'}
                    emissiveIntensity={isMooringHovered ? 1.0 : 0.6}
                    wireframe
                  />
                </mesh>
                <mesh position={[0.038, 0, 0]}>
                  <sphereGeometry args={[0.009, 8, 8]} />
                  <meshBasicMaterial color={isMooringHovered ? '#ffffff' : '#22c55e'} />
                </mesh>
              </group>
            ))}
            <Html position={[0, height * 0.22, 0]} distanceFactor={5.5} center occlude zIndexRange={[1, 0]}>
              <div
                className={`px-2.5 py-1.5 rounded-xl border shadow-2xl font-mono text-[9px] whitespace-nowrap transition-all cursor-pointer pointer-events-auto ${
                  isMooringHovered
                    ? 'bg-[#0b1320] border-emerald-400 text-emerald-200 scale-105 ring-2 ring-emerald-400/50'
                    : 'bg-[#0b1320]/90 border-emerald-400/50 text-emerald-300'
                }`}
              >
                <div className="font-bold text-white flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5"><span>⚓</span><span>Moored CTD Array (OMNI BD-08)</span></span>
                  <span className="text-[7.5px] bg-emerald-500/20 text-emerald-300 px-1 rounded">RAMA</span>
                </div>
                <div className="text-[8px] text-slate-300 mt-0.5 flex items-center gap-2">
                  <span>5-Level Sensors: <strong className="text-emerald-300">50m ➔ 2000m</strong></span>
                  <span>ADCP: <strong className="text-cyan-300">0.48 m/s</strong></span>
                </div>
                <div className="text-[7.5px] text-emerald-400 font-bold mt-1 flex items-center justify-between">
                  <span>Taut-Wire Moored</span>
                  <span className="underline">Click to Inspect</span>
                </div>
              </div>
            </Html>
          </group>
        </group>
      )}

      {/* ── 5. Horizontal Depth Slicing Plane & Probe ────────────────── */}
      {showDepthSlice && yClippingFraction > 0.02 && yClippingFraction < 0.98 && (
        <group position={[0, sliceY, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width * 0.99, length * 0.99]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.65} side={THREE.DoubleSide} roughness={0.15} />
          </mesh>
          <group position={[0, 0.05, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.08, 0.11, 24]} />
              <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
            </mesh>
            <Html distanceFactor={5.5} center occlude zIndexRange={[1, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <div className="px-2.5 py-1.5 rounded-xl bg-black/90 border border-cyan-400 shadow-2xl font-mono text-[9px] text-white whitespace-nowrap flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-3 text-cyan-300 font-bold border-b border-white/15 pb-0.5">
                  <span>Depth Slice: {probedDepthMeters}m</span>
                  <span className="text-[8px] bg-cyan-500/20 px-1 py-0.2 rounded">PROBE ACTIVE</span>
                </div>
                <div className="text-[8px] text-slate-300 flex items-center gap-2">
                  <span>Temp: <strong className="text-amber-300">{(29.4 - (yClippingFraction * 24.5)).toFixed(1)}°C</strong></span>
                  <span>Sal: <strong className="text-cyan-300">{(34.2 + (yClippingFraction * 1.8)).toFixed(1)} PSU</strong></span>
                  <span>Vel: <strong className="text-emerald-300">{(1.1 - (yClippingFraction * 0.9)).toFixed(2)} m/s</strong></span>
                </div>
              </div>
            </Html>
          </group>
        </group>
      )}

      {/* ── 6. Wireframe Bounding Box ─────────────────────────────────────── */}
      {showBoundingBox && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, length)]} />
          <lineBasicMaterial color="#38bdf8" linewidth={1.5} transparent opacity={0.7} />
        </lineSegments>
      )}

      {/* ── 7. Vertical Depth Graduation Ruler ─────────────── */}
      {showDepthRuler && (
        <group position={[-width / 2 - 0.15, 0, length / 2 + 0.15]}>
          {/* @ts-expect-error R3F line */}
          <line geometry={new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, height / 2, 0), new THREE.Vector3(0, -height / 2, 0)])}>
            <lineBasicMaterial color="#38bdf8" transparent opacity={0.8} />
          </line>
          {[
            { frac: 0.0, label: '0m (Surface)' },
            { frac: 0.1, label: '200m (Euphotic)' },
            { frac: 0.25, label: '500m (Thermocline)' },
            { frac: 0.5, label: '1000m (Glider Max)' },
            { frac: 0.75, label: '1500m' },
            { frac: 1.0, label: `${maxDepth}m (Abyssal)` },
          ].map((m, idx) => {
            const y = height / 2 - m.frac * height
            return (
              <group key={idx} position={[0, y, 0]}>
                <mesh position={[0.04, 0, 0]}>
                  <boxGeometry args={[0.08, 0.006, 0.006]} />
                  <meshBasicMaterial color="#38bdf8" />
                </mesh>
                <Html position={[-0.1, 0, 0]} distanceFactor={6} center occlude zIndexRange={[1, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  <div className="text-[8px] font-mono text-cyan-300 whitespace-nowrap font-bold bg-black/60 px-1 rounded">{m.label}</div>
                </Html>
              </group>
            )
          })}
        </group>
      )}

      {/* ── Subtle Studio Floor Shadow / Ambient Plane ─────────────────────── */}
      <mesh position={[0, -height / 2 - 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 2.2, length * 2.2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.45} />
      </mesh>
    </group>
  )
}
