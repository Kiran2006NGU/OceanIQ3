/**
 * CameraController.tsx — Smooth Scientific Camera Transitions
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Coordinates smooth camera and OrbitControls target interpolation for:
 * 1. Home View — Indian Ocean overview [0.35, 0.65, 3.9]
 * 2. Reset North — Aligns camera azimuth with true North (Y-axis)
 * 3. Zoom to Region — Moves camera focus to selected Indian Ocean region
 * 4. Focus Target / Observation — Centers on clicked float/glider
 */

import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export interface CameraNavTarget {
  position: [number, number, number]
  target: [number, number, number]
  duration?: number
}

interface CameraControllerProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  navTarget: CameraNavTarget | null
  onNavComplete?: () => void
}

export const REGION_CAMERA_TARGETS: Record<string, CameraNavTarget> = {
  'Indian Ocean': {
    position: [0.35, 0.65, 3.9],
    target: [0.15, 0.1, 0],
  },
  'Bay of Bengal': {
    position: [0.85, 0.95, 2.7],
    target: [0.42, 0.42, 1.88],
  },
  'Arabian Sea': {
    position: [-0.95, 0.95, 2.65],
    target: [-0.46, 0.44, 1.86],
  },
  'Andaman Sea': {
    position: [1.35, 0.65, 2.5],
    target: [0.72, 0.28, 1.78],
  },
  'Equatorial Indian Ocean': {
    position: [0.1, -0.25, 2.9],
    target: [0.05, -0.15, 1.95],
  },
}

export function CameraController({
  controlsRef,
  navTarget,
  onNavComplete,
}: CameraControllerProps) {
  const { camera, size } = useThree()
  const isTransitioningRef = useRef(false)
  const destPosRef = useRef(new THREE.Vector3())
  const destTargetRef = useRef(new THREE.Vector3())
  const progressRef = useRef(0)

  // Mobile portrait aspect ratio adaptation
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height)
    if (camera instanceof THREE.PerspectiveCamera) {
      if (aspect < 1.0) {
        // Portrait phone: widen FOV to fit the entire globe
        camera.fov = 42 / Math.max(0.65, aspect)
      } else {
        camera.fov = 42
      }
      camera.updateProjectionMatrix()
    }
  }, [size, camera])

  useEffect(() => {
    if (!navTarget) return

    destPosRef.current.set(...navTarget.position)
    destTargetRef.current.set(...navTarget.target)
    isTransitioningRef.current = true
    progressRef.current = 0
  }, [navTarget])

  useFrame((_, delta) => {
    if (!isTransitioningRef.current || !controlsRef.current) return

    // Smooth exponential step
    const step = Math.min(1, delta * 4.5)
    camera.position.lerp(destPosRef.current, step)
    controlsRef.current.target.lerp(destTargetRef.current, step)
    controlsRef.current.update()

    const posDist = camera.position.distanceTo(destPosRef.current)
    const targetDist = controlsRef.current.target.distanceTo(destTargetRef.current)

    if (posDist < 0.02 && targetDist < 0.02) {
      camera.position.copy(destPosRef.current)
      controlsRef.current.target.copy(destTargetRef.current)
      controlsRef.current.update()
      isTransitioningRef.current = false
      onNavComplete?.()
    }
  })

  return null
}

