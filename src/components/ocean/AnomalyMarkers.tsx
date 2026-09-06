/**
 * AnomalyMarkers.tsx — 3D Pulsating Aura Markers for AI Detected Threats
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Mesh } from 'three'
import { MOCK_ANOMALIES, type OceanAnomaly } from '../ai/AnomalyDetectionPanel'
import { latLonToVec3, GLOBE_RADIUS } from '@/utils/geoUtils'

interface AnomalyMarkersProps {
  anomalies?: OceanAnomaly[]
  onSelectAnomaly: (anomaly: OceanAnomaly) => void
}

function SingleAnomalyRing({
  anomaly,
  onSelect,
}: {
  anomaly: OceanAnomaly
  onSelect: (anom: OceanAnomaly) => void
}) {
  const meshRef = useRef<Mesh>(null!)
  const [isHovered, setIsHovered] = useState(false)
  const [x, y, z] = latLonToVec3(anomaly.lat, anomaly.lon, GLOBE_RADIUS + 0.025)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const s = 1 + 0.25 * Math.sin(clock.getElapsedTime() * 3.5)
      meshRef.current.scale.set(s, s, s)
    }
  })

  const isCritical = anomaly.severity === 'CRITICAL'
  const color = isCritical ? '#ef4444' : '#f59e0b'

  return (
    <group position={[x, y, z]}>
      {/* Outer Pulsing Mesh Ring */}
      <mesh ref={meshRef}>
        <ringGeometry args={[0.025, 0.045, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.65}
          side={2} // DoubleSide
        />
      </mesh>

      {/* Occluded Compact HTML Threat Pin */}
      <Html
        center
        occlude
        zIndexRange={[2, 0]}
        style={{ pointerEvents: 'auto', userSelect: 'none' }}
      >
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative flex items-center justify-center"
        >
          <button
            onClick={() => onSelect(anomaly)}
            title={`${anomaly.region} — ${anomaly.category} (${anomaly.anomalyValue})\nClick to focus`}
            className={`group flex items-center gap-1 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md rounded-full border ${
              isHovered
                ? 'px-2 py-0.5 bg-red-950/90 border-red-400 text-red-100 scale-110'
                : 'px-1.5 py-0.5 bg-red-950/75 border-red-500/50 text-red-200'
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
            </span>
            <span className="text-[9px] font-mono font-bold leading-none">
              {isHovered ? `⚠️ ${anomaly.region} (${anomaly.anomalyValue})` : anomaly.anomalyValue}
            </span>
          </button>
        </div>
      </Html>
    </group>
  )
}

export function AnomalyMarkers({ anomalies, onSelectAnomaly }: AnomalyMarkersProps) {
  const list = anomalies && anomalies.length > 0 ? anomalies : MOCK_ANOMALIES

  return (
    <group name="AnomalyMarkersGroup">
      {list.map((anom) => (
        <SingleAnomalyRing key={anom.id} anomaly={anom} onSelect={onSelectAnomaly} />
      ))}
    </group>
  )
}

