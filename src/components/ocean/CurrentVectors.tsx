/**
 * CurrentVectors — 3D Instanced Arrow Vectors for Ocean Currents
 * SIH 26067 | Ocean Intelligence Platform
 *
 * Implements Concept 5: A scientifically structured vector layer.
 * Utilizes GPU-efficient THREE.InstancedMesh to render 3D arrows.
 * Supports density filtering, magnitude thresholds, and NaN filtering.
 */

import { useEffect, useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { getDataSourceCurrentVectors } from '@/services/data/dataSource'
import { currentArrowEnd, latLonToVec3, GLOBE_RADIUS } from '@/utils/geoUtils'
import { velocityToRGB } from '@/utils/oceanColorScale'
import type { ModelTime } from '@/services/data/mockOceanData'

interface CurrentVectorsProps {
  selectedDepth: number
  selectedTimeIndex: number
  selectedTime?: ModelTime
  vectorScale?: number
  arrowDensity?: number
  minMagnitude?: number
  maxDisplayed?: number
  opacity?: number
}

const TEMP_VEC3_P = new THREE.Vector3()
const TEMP_VEC3_T = new THREE.Vector3()
const TEMP_DIR = new THREE.Vector3()
const TEMP_QUAT = new THREE.Quaternion()
const TEMP_MAT4_SHAFT = new THREE.Matrix4()
const TEMP_MAT4_HEAD = new THREE.Matrix4()
const UP = new THREE.Vector3(0, 1, 0)
const TEMP_COLOR = new THREE.Color()

export function CurrentVectors({
  selectedDepth,
  selectedTimeIndex,
  selectedTime,
  vectorScale = 0.15,
  arrowDensity = 1.0,
  minMagnitude = 0.01,
  maxDisplayed = 15000,
  opacity = 0.95,
}: CurrentVectorsProps) {
  const shaftRef = useRef<THREE.InstancedMesh>(null)
  const headRef = useRef<THREE.InstancedMesh>(null)
  const [count, setCount] = useState(0)

  // Geometries for the 3D Arrows
  // Shaft is a thin cylinder, Head is a small cone.
  const shaftGeo = useMemo(() => new THREE.CylinderGeometry(0.0015, 0.0015, 1, 4), [])
  const headGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.006, 0.02, 5)
    geo.translate(0, -0.01, 0) // Shift origin to base of the cone for exact tip positioning
    return geo
  }, [])

  // Unified material for all arrows
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: opacity,
        depthWrite: false, // Prevents z-fighting with the globe/depth slices
      }),
    [opacity]
  )

  useEffect(() => {
    const timeIso =
      selectedTime?.isoString ??
      `2026-08-28T${String(selectedTimeIndex * 6).padStart(2, '0')}:00:00Z`
    let cancelled = false

    getDataSourceCurrentVectors(selectedDepth, selectedTimeIndex, timeIso)
      .then((rawVectors) => {
        if (cancelled || !shaftRef.current || !headRef.current) return

        // Filter and sample vectors based on scientific config
        const validVectors = rawVectors.filter((v) => {
          if (isNaN(v.u) || isNaN(v.v) || isNaN(v.magnitude) || !isFinite(v.magnitude))
            return false
          if (v.magnitude < minMagnitude) return false
          if (arrowDensity < 1.0 && Math.random() > arrowDensity) return false
          return true
        })

        const displayVectors = validVectors.slice(0, maxDisplayed)
        const finalCount = displayVectors.length

        // Update matrices and colors for each instance
        for (let i = 0; i < finalCount; i++) {
          const vec = displayVectors[i]

          // Calculate 3D points
          // Start slightly above the globe surface to avoid clipping
          const [px, py, pz] = latLonToVec3(vec.lat, vec.lon, GLOBE_RADIUS + 0.015)
          const [tx, ty, tz] = currentArrowEnd(vec.lat, vec.lon, vec.u, vec.v, vectorScale)

          TEMP_VEC3_P.set(px, py, pz)
          TEMP_VEC3_T.set(tx, ty, tz)

          const length = TEMP_VEC3_P.distanceTo(TEMP_VEC3_T)
          TEMP_DIR.subVectors(TEMP_VEC3_T, TEMP_VEC3_P).normalize()

          // Align Y-axis (default for Cylinder/Cone) to the direction vector
          TEMP_QUAT.setFromUnitVectors(UP, TEMP_DIR)

          // Position the shaft at the midpoint
          const shaftCenter = TEMP_VEC3_P.clone().add(
            TEMP_DIR.clone().multiplyScalar(length / 2)
          )
          TEMP_MAT4_SHAFT.compose(shaftCenter, TEMP_QUAT, new THREE.Vector3(1, length, 1))
          shaftRef.current.setMatrixAt(i, TEMP_MAT4_SHAFT)

          // Position the head at the tip
          TEMP_MAT4_HEAD.compose(TEMP_VEC3_T, TEMP_QUAT, new THREE.Vector3(1, 1, 1))
          headRef.current.setMatrixAt(i, TEMP_MAT4_HEAD)

          // Apply scientific colormap based on magnitude
          const [r, g, b] = velocityToRGB(vec.magnitude)
          TEMP_COLOR.setRGB(r, g, b)
          shaftRef.current.setColorAt(i, TEMP_COLOR)
          headRef.current.setColorAt(i, TEMP_COLOR)
        }

        // Apply updates to the GPU
        shaftRef.current.count = finalCount
        headRef.current.count = finalCount

        shaftRef.current.instanceMatrix.needsUpdate = true
        headRef.current.instanceMatrix.needsUpdate = true

        if (shaftRef.current.instanceColor) {
          shaftRef.current.instanceColor.needsUpdate = true
        }
        if (headRef.current.instanceColor) {
          headRef.current.instanceColor.needsUpdate = true
        }

        setCount(finalCount)
      })
      .catch((err) => {
        console.warn('Failed to load current vectors:', err)
      })

    return () => {
      cancelled = true
    }
  }, [
    selectedDepth,
    selectedTimeIndex,
    selectedTime,
    vectorScale,
    arrowDensity,
    minMagnitude,
    maxDisplayed,
  ])

  return (
    <group>
      <instancedMesh ref={shaftRef} args={[shaftGeo, material, maxDisplayed]} />
      <instancedMesh ref={headRef} args={[headGeo, material, maxDisplayed]} />
    </group>
  )
}
