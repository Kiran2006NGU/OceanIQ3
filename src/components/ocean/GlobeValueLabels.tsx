/**
 * GlobeValueLabels.tsx — 3D Floating Numerical Parameter Badges on Globe
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements Feature 5:
 * "Globe showing all parameters with numbers of animations according to the parameters"
 *
 * Displays live, reactive numeric badges at major Indian Ocean observation stations:
 * - Central Arabian Sea
 * - Northern Bay of Bengal
 * - Equatorial Indian Ocean
 * - Sri Lanka Dome
 * - Somali Upwelling Basin
 * - Andaman Sea
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { GLOBE_RADIUS, latLonToVec3 } from '@/utils/geoUtils'
import type { OceanVariable } from '@/types/ocean'
import { getOceanValueSync } from '@/services/data/dataSource'

interface GlobeValueLabelsProps {
  selectedVariable: OceanVariable
  selectedDepth: number
  selectedTimeIso?: string
  selectedTimeIndex?: number
  visible?: boolean
}

interface StationTarget {
  id: string
  name: string
  lat: number
  lon: number
}

const OCEAN_STATIONS: StationTarget[] = [
  { id: 'st-as', name: 'Arabian Sea Center', lat: 15.5, lon: 65.0 },
  { id: 'st-bob', name: 'Bay of Bengal Basin', lat: 16.0, lon: 88.5 },
  { id: 'st-eq', name: 'Equatorial Ocean Station', lat: 0.0, lon: 78.0 },
  { id: 'st-sld', name: 'Sri Lanka Dome', lat: 7.2, lon: 83.0 },
  { id: 'st-som', name: 'Somali Current Basin', lat: 9.0, lon: 52.5 },
  { id: 'st-and', name: 'Andaman Archipelagic Station', lat: 11.8, lon: 93.2 },
]

function getStationPos(lat: number, lon: number, altitude = 0.03): THREE.Vector3 {
  const [x, y, z] = latLonToVec3(lat, lon, GLOBE_RADIUS + altitude)
  return new THREE.Vector3(x, y, z)
}

function getUnitForVariable(v: OceanVariable): string {
  switch (v) {
    case 'temperature': return '°C'
    case 'salinity': return 'PSU'
    case 'current_velocity': return 'm/s'
    case 'sea_level':
    case 'sea_surface_height': return 'cm'
    case 'chlorophyll': return 'mg/m³'
    case 'oxygen': return 'µmol/kg'
    default: return ''
  }
}

function getColorForVariable(v: OceanVariable): string {
  switch (v) {
    case 'temperature': return '#fb923c' // Orange
    case 'salinity': return '#38bdf8'    // Cyan / Sky
    case 'current_velocity': return '#818cf8' // Indigo
    case 'sea_level':
    case 'sea_surface_height': return '#06b6d4' // Marine Cyan
    case 'chlorophyll': return '#10b981' // Emerald
    case 'oxygen': return '#38bdf8'
    default: return '#a855f7'
  }
}

export function GlobeValueLabels({
  selectedVariable,
  selectedDepth,
  selectedTimeIndex = 0,
  visible = true,
}: GlobeValueLabelsProps) {
  const unit = getUnitForVariable(selectedVariable)
  const accentColor = getColorForVariable(selectedVariable)

  const stationsWithValues = useMemo(() => {
    return OCEAN_STATIONS.map((station) => {
      const val = getOceanValueSync(
        station.lat,
        station.lon,
        selectedDepth,
        selectedVariable,
        selectedTimeIndex
      )
      const pos = getStationPos(station.lat, station.lon, 0.032)

      let formattedValue = '--'
      if (typeof val === 'number') {
        if (selectedVariable === 'sea_level' || selectedVariable === 'sea_surface_height') {
          formattedValue = val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1)
        } else if (selectedVariable === 'current_velocity' || selectedVariable === 'chlorophyll') {
          formattedValue = val.toFixed(2)
        } else {
          formattedValue = val.toFixed(1)
        }
      }

      return {
        ...station,
        value: formattedValue,
        pos,
      }
    })
  }, [selectedVariable, selectedDepth, selectedTimeIndex])

  if (!visible) return null

  return (
    <group>
      {stationsWithValues.map((st) => (
        <group key={st.id} position={st.pos}>
          {/* Subtle anchor pin dot */}
          <mesh>
            <sphereGeometry args={[0.012, 12, 12]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={0.8}
            />
          </mesh>

          {/* Glowing pulse ring */}
          <mesh>
            <ringGeometry args={[0.018, 0.026, 16]} />
            <meshBasicMaterial
              color={accentColor}
              side={THREE.DoubleSide}
              transparent
              opacity={0.6}
            />
          </mesh>

          {/* Floating Numerical HUD Badge */}
          <Html distanceFactor={4.2} center zIndexRange={[1, 0]} occlude style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div
              className="pointer-events-none select-none flex flex-col items-center px-2 py-1 rounded-lg bg-black/90 backdrop-blur-md border shadow-xl transition-all duration-300 transform -translate-y-6"
              style={{ borderColor: `${accentColor}80`, boxShadow: `0 0 12px ${accentColor}33` }}
            >
              <div className="flex items-center gap-1 font-mono leading-none">
                <span className="text-xs font-black tracking-tight" style={{ color: accentColor }}>
                  {st.value}
                </span>
                <span className="text-[9px] text-slate-300 font-semibold">{unit}</span>
              </div>
              <span className="text-[8px] font-mono text-slate-400 whitespace-nowrap mt-0.5">
                {st.name}
              </span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}
