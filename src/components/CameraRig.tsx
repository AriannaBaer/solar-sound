// CameraRig.tsx — flies the camera to the selected body, then follows it.
//
// Two phases:
//   1. FLYING (first ~2s after a click): ease the camera toward a spot just
//      in front of the body.
//   2. FOLLOWING: the body keeps orbiting, so each frame we shift the camera
//      by exactly how far the body moved. You can still drag to look around.
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { BODY_BY_ID } from '../data/bodies'
import { useStore, bodyRegistry } from '../store'

const HOME_POSITION = new THREE.Vector3(0, 32, 58)
const FLIGHT_SECONDS = 2

// Reused every frame instead of creating new vectors (less garbage = smoother).
const target = new THREE.Vector3()
const desired = new THREE.Vector3()
const lastTarget = new THREE.Vector3()
const moved = new THREE.Vector3()

// The only two parts of OrbitControls we use: where it looks, and update().
type Controls = { target: THREE.Vector3; update: () => void }

export function CameraRig() {
  const selectedId = useStore((s) => s.selectedId)
  const controls = useThree((s) => s.controls) as unknown as Controls | null
  const flightTimeLeft = useRef(FLIGHT_SECONDS)

  // Whenever the selection changes, start a new flight.
  useEffect(() => {
    flightTimeLeft.current = FLIGHT_SECONDS
  }, [selectedId])

  useFrame((state, delta) => {
    if (!controls) return
    const obj = selectedId ? bodyRegistry.get(selectedId) : undefined
    const body = selectedId ? BODY_BY_ID[selectedId] : undefined

    if (obj) obj.getWorldPosition(target)
    else target.set(0, 0, 0)

    if (flightTimeLeft.current > 0) {
      flightTimeLeft.current -= delta
      if (obj && body) {
        const r = body.displayRadius
        desired.copy(target).add(moved.set(0, r * 1.2, r * 5))
      } else {
        desired.copy(HOME_POSITION)
      }
      // Frame-rate-independent easing: closes ~90% of the gap every 0.5s.
      const t = 1 - Math.pow(0.01, delta)
      state.camera.position.lerp(desired, t)
      controls.target.lerp(target, t)
    } else if (obj) {
      moved.copy(target).sub(lastTarget)
      state.camera.position.add(moved)
      controls.target.add(moved)
    }

    lastTarget.copy(target)
    controls.update()
  })

  return null
}
