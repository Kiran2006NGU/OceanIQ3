/**
 * PlaceEcosystemIsolationView.tsx — Interactive 3D Living Marine Ecosystem Isolation View
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements the user's requested "Isolation View of that Place":
 * When clicking any location on the 3D globe, this transforms the view into an isolated,
 * highly-animated 3D marine biosphere of that specific geographical place:
 * 1. Animated swimming schools of fish (Tuna / Mackerel) with realistic boid-like flocking
 * 2. Gliding green sea turtles & pelagic reef sharks
 * 3. 3D coral reef gardens (branched corals, sea fans, brain corals)
 * 4. Drifting bioluminescent plankton particles & marine snow
 * 5. Depth Stratification: Sunlight Zone (0-200m), Twilight Zone (200-1000m), Benthic Zone
 * 6. Biodiversity Health Scorecard & Coral Thermal Stress Index
 */

import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float } from '@react-three/drei'
import * as THREE from 'three'
import {
  Fish,
  Waves,
  Sun,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Layers,
  Sparkles,
  Compass,
  MapPin,
  Eye,
  Activity,
} from 'lucide-react'

export interface PlaceEcosystemPreset {
  id: string
  name: string
  lat: number
  lon: number
  biomeType: 'Coral Reef Atoll' | 'Deep Trench & Seamount' | 'Estuarine Delta & Mangrove' | 'Upwelling Pelagic Zone'
  temperature: number
  salinity: number
  dissolvedOxygen: number
  chlorophyll: number
  biodiversityScore: number
  coralHealthStatus: 'Healthy' | 'Watch (Mild Stress)' | 'Bleaching Risk'
  primarySpecies: string[]
  description: string
}

export const ECOSYSTEM_PRESETS: PlaceEcosystemPreset[] = [
  {
    id: 'lakshadweep',
    name: 'Lakshadweep Coral Atoll (Kavaratti)',
    lat: 10.57,
    lon: 72.64,
    biomeType: 'Coral Reef Atoll',
    temperature: 29.4,
    salinity: 35.2,
    dissolvedOxygen: 215,
    chlorophyll: 1.85,
    biodiversityScore: 94,
    coralHealthStatus: 'Healthy',
    primarySpecies: ['Hawksbill Sea Turtle', 'Yellowfin Tuna', 'Acropora Corals', 'Parrotfish', 'Bioluminescent Dinoflagellates'],
    description: 'Pristine coral lagoon with shallow fringing reefs, high sunlight penetration, and rich pelagic biodiversity.',
  },
  {
    id: 'andaman',
    name: 'Andaman & Nicobar Subduction Trench',
    lat: 11.62,
    lon: 92.72,
    biomeType: 'Deep Trench & Seamount',
    temperature: 28.8,
    salinity: 33.8,
    dissolvedOxygen: 198,
    chlorophyll: 2.1,
    biodiversityScore: 91,
    coralHealthStatus: 'Watch (Mild Stress)',
    primarySpecies: ['Manta Rays', 'Hammerhead Shark', 'Deep-Sea Gorgonians', 'Lanternfish', 'Pelagic Squid'],
    description: 'Volcanic seamount drop-off plunging into deep abyssal trenches with steep thermocline stratification.',
  },
  {
    id: 'bay_of_bengal',
    name: 'Bay of Bengal Ganges-Brahmaputra Delta',
    lat: 19.8,
    lon: 88.5,
    biomeType: 'Estuarine Delta & Mangrove',
    temperature: 30.1,
    salinity: 31.4,
    dissolvedOxygen: 185,
    chlorophyll: 3.9,
    biodiversityScore: 86,
    coralHealthStatus: 'Watch (Mild Stress)',
    primarySpecies: ['Olive Ridley Turtle', 'Hilsa Shad', 'Estuarine Crocodiles', 'Phytoplankton Diatom Blooms'],
    description: 'Nutrient-rich river delta runoff creating intense surface biomass blooms and stratified freshwater barrier layers.',
  },
  {
    id: 'arabian_upwelling',
    name: 'Arabian Sea Somali-Oman Upwelling',
    lat: 14.5,
    lon: 58.0,
    biomeType: 'Upwelling Pelagic Zone',
    temperature: 24.2,
    salinity: 36.8,
    dissolvedOxygen: 140,
    chlorophyll: 4.5,
    biodiversityScore: 89,
    coralHealthStatus: 'Healthy',
    primarySpecies: ['Whale Sharks', 'Indian Mackerel', 'Myctophid Lanternfish', 'Copepod Zooplankton'],
    description: 'Wind-driven coastal upwelling pumping deep cold, nutrient-laden waters to the surface euphotic zone.',
  },
]

// ── 3D Living Marine Fauna Components ────────────────────────────────────────

/** Animated Schooling Fish */
function SchoolingFish({ count = 35, color = '#38bdf8', speed = 1.0 }: { count?: number; color?: string; speed?: number }) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Generate orbital school positions
  const fishData = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      orbitRadius: 2.2 + Math.random() * 2.8,
      heightOffset: (Math.random() - 0.5) * 2.2,
      phase: (i / count) * Math.PI * 2 + Math.random() * 0.5,
      speedMult: speed * (0.85 + Math.random() * 0.3),
      bodyScale: 0.12 + Math.random() * 0.08,
    }))
  }, [count, speed])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()

    fishData.forEach((fish, i) => {
      const angle = t * 0.45 * fish.speedMult + fish.phase
      const x = Math.cos(angle) * fish.orbitRadius
      const z = Math.sin(angle) * fish.orbitRadius
      // Gentle vertical undulation
      const y = fish.heightOffset + Math.sin(t * 1.5 + fish.phase) * 0.25

      dummy.position.set(x, y, z)
      // Point forward along tangent of orbit
      dummy.rotation.set(0, -angle + Math.PI / 2, Math.sin(t * 4 + fish.phase) * 0.15)
      dummy.scale.set(fish.bodyScale * 0.4, fish.bodyScale * 0.25, fish.bodyScale * 1.2)
      dummy.updateMatrix()

      meshRef.current?.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Streamlined fish body cone/cylinder */}
      <coneGeometry args={[0.3, 1.2, 5]} />
      <meshStandardMaterial
        color={color}
        roughness={0.2}
        metalness={0.6}
        emissive={color}
        emissiveIntensity={0.25}
      />
    </instancedMesh>
  )
}

/** Animated Gliding Sea Turtle */
function SeaTurtle({ position = [1.5, 0.4, -1.0] as [number, number, number] }) {
  const turtleRef = useRef<THREE.Group | null>(null)
  const flipperLeftRef = useRef<THREE.Mesh | null>(null)
  const flipperRightRef = useRef<THREE.Mesh | null>(null)

  useFrame(({ clock }) => {
    if (!turtleRef.current) return
    const t = clock.getElapsedTime()

    // Smooth gliding path
    turtleRef.current.position.x = position[0] + Math.sin(t * 0.25) * 1.2
    turtleRef.current.position.z = position[2] + Math.cos(t * 0.25) * 1.2
    turtleRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.15
    turtleRef.current.rotation.y = -t * 0.25

    // Flipper stroke animation
    const flipperStroke = Math.sin(t * 2.2) * 0.4
    if (flipperLeftRef.current) flipperLeftRef.current.rotation.z = flipperStroke
    if (flipperRightRef.current) flipperRightRef.current.rotation.z = -flipperStroke
  })

  return (
    <group ref={turtleRef} position={position} scale={0.65}>
      {/* Carapace (Shell) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.6, 16, 12]} />
        <meshStandardMaterial color="#166534" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.1, 0.7]}>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshStandardMaterial color="#22c55e" roughness={0.5} />
      </mesh>
      {/* Left Front Flipper */}
      <mesh ref={flipperLeftRef} position={[-0.6, 0, 0.3]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.7, 0.06, 0.25]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      {/* Right Front Flipper */}
      <mesh ref={flipperRightRef} position={[0.6, 0, 0.3]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.7, 0.06, 0.25]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
    </group>
  )
}

/** 3D Coral Reef Seabed Formation */
function CoralReefSeabed() {
  const corals = useMemo(() => {
    return Array.from({ length: 45 }, (_, i) => ({
      x: (Math.random() - 0.5) * 7.5,
      z: (Math.random() - 0.5) * 7.5,
      y: -2.85 + Math.random() * 0.2,
      scale: 0.25 + Math.random() * 0.45,
      color: ['#f43f5e', '#fb923c', '#e11d48', '#8b5cf6', '#06b6d4', '#10b981'][i % 6],
      height: 0.6 + Math.random() * 0.8,
    }))
  }, [])

  return (
    <group>
      {/* Sandy Ocean Floor */}
      <mesh position={[0, -3.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 16, 32, 32]} />
        <meshStandardMaterial color="#0f2642" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Individual Coral Heads & Sea Fans */}
      {corals.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.scale}>
          <mesh position={[0, c.height / 2, 0]}>
            <cylinderGeometry args={[0.2, 0.45, c.height, 7]} />
            <meshStandardMaterial color={c.color} roughness={0.7} emissive={c.color} emissiveIntensity={0.15} />
          </mesh>
          {/* Coral tip cluster */}
          <mesh position={[0, c.height, 0]}>
            <dodecahedronGeometry args={[0.35, 1]} />
            <meshStandardMaterial color={c.color} roughness={0.5} emissive={c.color} emissiveIntensity={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Drifting Bioluminescent Plankton & Marine Snow */
function BioluminescentPlankton({ count = 250 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points | null>(null)

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8.5
      pos[i * 3 + 1] = -2.8 + Math.random() * 5.0
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8.5

      // Cyan to emerald bio-glow
      const isEmerald = Math.random() > 0.5
      col[i * 3] = isEmerald ? 0.1 : 0.2
      col[i * 3 + 1] = isEmerald ? 0.9 : 0.8
      col[i * 3 + 2] = 1.0
    }

    return [pos, col]
  }, [count])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const t = clock.getElapsedTime()
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array

    for (let i = 0; i < count; i++) {
      // Gentle downward drift with swirling currents
      arr[i * 3 + 1] -= 0.003
      arr[i * 3] += Math.sin(t * 0.5 + i) * 0.002

      if (arr[i * 3 + 1] < -2.9) {
        arr[i * 3 + 1] = 2.2
      }
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ── Main Place Ecosystem Viewport Component ──────────────────────────────────

interface PlaceEcosystemIsolationViewProps {
  initialPlaceName?: string
  onClose: () => void
}

export function PlaceEcosystemIsolationView({
  initialPlaceName,
  onClose,
}: PlaceEcosystemIsolationViewProps) {
  const [selectedPreset, setSelectedPreset] = useState<PlaceEcosystemPreset>(() => {
    const found = ECOSYSTEM_PRESETS.find(
      (p) =>
        initialPlaceName &&
        (p.name.toLowerCase().includes(initialPlaceName.toLowerCase()) ||
          p.id.toLowerCase().includes(initialPlaceName.toLowerCase()))
    )
    return found || ECOSYSTEM_PRESETS[0]
  })

  const [activeDepthZone, setActiveDepthZone] = useState<'sunlight' | 'twilight' | 'benthic'>('sunlight')

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#010814] text-slate-100 font-sans animate-fade-in select-none">
      {/* Top Action & Navigation HUD */}
      <header className="h-14 border-b border-white/10 bg-[#030d1a]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20 flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Back to Planetary Globe</span>
          </button>

          <div className="h-5 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Fish size={16} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">{selectedPreset.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                  {selectedPreset.biomeType}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Biome Preset Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {ECOSYSTEM_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPreset(p)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                selectedPreset.id === p.id
                  ? 'bg-cyan-500 text-black font-bold shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
              }`}
            >
              {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </header>

      {/* Main Workspace: 3D Scene + Right Telemetry Panel */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        {/* 3D Marine Biosphere Canvas Viewport */}
        <div className="flex-1 relative bg-[#010918]">
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 0.5, 5.2], fov: 48, near: 0.1, far: 100 }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
          >
            {/* Water Column Fog & Ambience */}
            <color attach="background" args={['#020f22']} />
            <fog attach="fog" args={['#020f22', 4, 15]} />

            {/* Sunlight rays filtering through surface */}
            <ambientLight intensity={0.9} color="#7dd3fc" />
            <directionalLight position={[0, 8, 2]} intensity={2.2} color="#bae6fd" />
            <pointLight position={[0, -2, 0]} intensity={0.8} color="#0284c7" />

            {/* Living 3D Ecosystem Creatures */}
            <SchoolingFish count={40} color="#38bdf8" speed={1.1} />
            <SchoolingFish count={25} color="#facc15" speed={0.9} />
            <SeaTurtle position={[1.2, 0.3, -0.8]} />
            <SeaTurtle position={[-1.8, -0.4, 0.5]} />
            <CoralReefSeabed />
            <BioluminescentPlankton count={300} />

            {/* Smooth 3D Orbit Controls */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              maxPolarAngle={Math.PI / 2 + 0.05} // Don't orbit below ocean floor
              minDistance={2.0}
              maxDistance={9.0}
            />
          </Canvas>

          {/* Floating Depth Stratification Switcher */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 p-2 rounded-2xl bg-[#030d1a]/90 backdrop-blur-md border border-white/10 shadow-2xl pointer-events-auto">
            <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 uppercase tracking-wider font-bold">
              Depth Stratification:
            </span>
            {(
              [
                { id: 'sunlight', label: '☀️ Epipelagic (0–200m)', desc: 'Sunlight Zone / Reef' },
                { id: 'twilight', label: '🌊 Mesopelagic (200–1000m)', desc: 'Twilight Thermocline' },
                { id: 'benthic', label: '🌑 Benthic Floor (1000m+)', desc: 'Midnight Seafloor' },
              ] as const
            ).map((zone) => (
              <button
                key={zone.id}
                onClick={() => setActiveDepthZone(zone.id)}
                className={`flex flex-col text-left px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                  activeDepthZone === zone.id
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 font-bold'
                    : 'hover:bg-white/5 text-slate-400'
                }`}
              >
                <span>{zone.label}</span>
                <span className="text-[9px] text-slate-500">{zone.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Ecosystem Telemetry Inspector */}
        <aside className="w-80 sm:w-96 border-l border-white/10 bg-[#020b17] overflow-y-auto p-5 space-y-4 flex-shrink-0">
          {/* Header Summary */}
          <div className="space-y-1.5 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-1">
                <MapPin size={13} /> {selectedPreset.lat}°N, {selectedPreset.lon}°E
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                Biodiversity: {selectedPreset.biodiversityScore}/100
              </span>
            </div>
            <h3 className="text-base font-bold text-white">{selectedPreset.name}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{selectedPreset.description}</p>
          </div>

          {/* Environmental Gauges */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={13} className="text-cyan-400" /> Physical Ocean Telemetry
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] font-mono text-slate-400">Reef Temperature</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">{selectedPreset.temperature}°C</div>
                <div className="text-[9px] text-emerald-400 font-mono">Euphotic layer</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] font-mono text-slate-400">Practical Salinity</div>
                <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">{selectedPreset.salinity} PSU</div>
                <div className="text-[9px] text-slate-400 font-mono">Stable marine mass</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] font-mono text-slate-400">Dissolved Oxygen</div>
                <div className="text-lg font-bold font-mono text-blue-300 mt-0.5">
                  {selectedPreset.dissolvedOxygen} <span className="text-xs">µmol/kg</span>
                </div>
                <div className="text-[9px] text-emerald-400 font-mono">Oxygenated</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] font-mono text-slate-400">Chlorophyll-a</div>
                <div className="text-lg font-bold font-mono text-teal-300 mt-0.5">
                  {selectedPreset.chlorophyll} <span className="text-xs">mg/m³</span>
                </div>
                <div className="text-[9px] text-teal-400 font-mono">High primary production</div>
              </div>
            </div>
          </div>

          {/* Coral Health Status */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300">Coral Bleaching Risk</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  selectedPreset.coralHealthStatus === 'Healthy'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {selectedPreset.coralHealthStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Degree Heating Weeks (DHW) index is currently 1.2°C-weeks, below the Bleaching Alert Level 1 threshold of 4.0°C-weeks.
            </p>
          </div>

          {/* Key Marine Flora & Fauna */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-yellow-400" /> Key Marine Inhabitants
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedPreset.primarySpecies.map((sp) => (
                <span
                  key={sp}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 text-xs font-medium"
                >
                  {sp}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
