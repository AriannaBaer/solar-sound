// CameraRig.tsx — cinematic flights between bodies, then follows the target.
//
// A flight has three ideas working together:
//   1. ARC PATH: instead of a straight line (which can plow through the Sun),
//      the camera travels a curve that swoops up and over. We use a
//      "quadratic Bézier curve": start → a raised midpoint → end.
//   2. EASING: speed starts slow, peaks in the middle, and slows on arrival
//      (ease-in-out), like a real ship accelerating and braking.
//   3. LOOK-AHEAD: the camera turns its "head" toward the destination early
//      in the flight, so you see where you're going.
// Flight time scales with distance, so short hops are quick and long trips
// feel long. You arrive on the SUNLIT side, so the planet isn't a dark disk.
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { BODY_BY_ID, type Body } from '../data/bodies'
import { useStore, bodyRegistry } from '../store'

// The parts of OrbitControls we use.
type Controls = { target: THREE.Vector3; update: () => void; enabled: boolean; minDistance: number }

interface Flight {
  progress: number // 0 → 1
  duration: number // seconds
  fromPos: THREE.Vector3 // where the camera started
  fromTarget: THREE.Vector3 // what it was looking at
}

const HOME_POS = new THREE.Vector3(0, 32, 58)
const ORIGIN = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)

// Reused every frame instead of creating new vectors (less garbage = smoother).
const bodyPos = new THREE.Vector3()
const endPos = new THREE.Vector3()
const arcPeak = new THREE.Vector3()
const lastBodyPos = new THREE.Vector3()
const moved = new THREE.Vector3()
const toSun = new THREE.Vector3()

/** Slow → fast → slow. Input and output both go 0 → 1. */
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const parentPos = new THREE.Vector3()
const lastParentPos = new THREE.Vector3()
const outward = new THREE.Vector3()
const blended = new THREE.Vector3()
const offset = new THREE.Vector3()

/** Angle of `pos` around `center`, seen from above. */
const orbitAngle = (pos: THREE.Vector3, center: THREE.Vector3) => Math.atan2(pos.z - center.z, pos.x - center.x)

/** Where the camera should end up to view `body` (located at `pos`). */
function viewingSpot(body: Body | undefined, pos: THREE.Vector3, out: THREE.Vector3) {
  if (!body) return out.copy(HOME_POS)
  const r = body.displayRadius
  const distance = body.type === 'star' ? r * 5 : r * 4.5
  // Point from the body toward the Sun (flattened), then rotate ~35° so the
  // planet is three-quarters lit: you can see day, night, and the terminator.
  toSun.set(-pos.x, 0, -pos.z)
  if (toSun.lengthSq() < 1e-6) toSun.set(0, 0, 1) // the Sun itself
  toSun.normalize().applyAxisAngle(UP, 0.6)

  if (body.type === 'moon' && body.parentId) {
    // BUG FIX: moons orbit close to big planets. Facing the Sun could put the
    // camera INSIDE Jupiter or Earth. So we blend "toward the Sun" with
    // "outward from the planet". As long as the result still points at
    // least a little outward, the camera is farther from the planet than
    // the moon is, so it can never end up inside the planet.
    currentPosition(body.parentId, parentPos)
    outward.set(pos.x - parentPos.x, 0, pos.z - parentPos.z).normalize()
    blended.copy(outward).add(toSun).normalize()
    if (blended.dot(outward) < 0.15) {
      // The moon is behind its planet (on the night side). Look from the
      // side instead, so it's half lit, like a quarter moon.
      blended.set(-outward.z, 0, outward.x) // sideways (perpendicular)
      if (blended.dot(toSun) < 0) blended.negate() // pick the sunny side
      blended.addScaledVector(outward, 0.5).normalize()
    }
    toSun.copy(blended)
  }

  out.copy(pos).addScaledVector(toSun, distance)
  out.y += r * 1.2 // a bit above, looking slightly down
  return out
}

/** How high a flight should swoop: enough to clear the planet we're near. */
function minimumLift(body: Body | undefined) {
  if (!body) return 0
  const planet = body.type === 'moon' && body.parentId ? BODY_BY_ID[body.parentId] : body
  return planet.displayRadius * 2.5
}

/** Point on a quadratic Bézier curve at t (0 → 1). */
function bezier(a: THREE.Vector3, peak: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) {
  const u = 1 - t
  return out.set(0, 0, 0).addScaledVector(a, u * u).addScaledVector(peak, 2 * u * t).addScaledVector(b, t * t)
}

function currentPosition(id: string | null, out: THREE.Vector3) {
  const obj = id ? bodyRegistry.get(id) : undefined
  if (obj) obj.getWorldPosition(out)
  else out.copy(ORIGIN)
  return obj
}

export function CameraRig() {
  const selectedId = useStore((s) => s.selectedId)
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as unknown as Controls | null
  const flight = useRef<Flight | null>(null)

  // A new selection starts a new flight from wherever the camera is now,
  // so clicking mid-flight smoothly redirects.
  useEffect(() => {
    if (!controls) return
    const body = selectedId ? BODY_BY_ID[selectedId] : undefined
    currentPosition(selectedId, bodyPos)
    viewingSpot(body, bodyPos, endPos)
    const distance = camera.position.distanceTo(endPos)
    flight.current = {
      progress: 0,
      duration: THREE.MathUtils.clamp(1.2 + distance / 30, 1.4, 3.5),
      fromPos: camera.position.clone(),
      fromTarget: controls.target.clone(),
    }
    controls.enabled = false // no dragging mid-flight
    controls.minDistance = body ? body.displayRadius * 1.4 : 1 // can't zoom inside it
  }, [selectedId, controls, camera])

  useFrame((_, delta) => {
    if (!controls) return
    const body = selectedId ? BODY_BY_ID[selectedId] : undefined
    const obj = currentPosition(selectedId, bodyPos)
    currentPosition(body?.parentId ?? null, parentPos)
    const f = flight.current

    if (f) {
      f.progress = Math.min(f.progress + delta / f.duration, 1)
      const t = easeInOutCubic(f.progress)

      // Recompute the end every frame: the planet keeps moving while we fly.
      viewingSpot(body, bodyPos, endPos)

      // Raise the curve's midpoint by how far we travel sideways.
      arcPeak.lerpVectors(f.fromPos, endPos, 0.5)
      const sideways = Math.hypot(endPos.x - f.fromPos.x, endPos.z - f.fromPos.z)
      // Hopping between a planet and its moon is a short trip, but the planet
      // is in the way, so swoop at least high enough to clear it.
      arcPeak.y += Math.max(sideways * 0.25, sideways > 0.5 ? minimumLift(body) : 0)

      bezier(f.fromPos, arcPeak, endPos, t, camera.position)

      // Look-ahead: the gaze reaches the target at ~55% of the flight.
      controls.target.lerpVectors(f.fromTarget, bodyPos, easeInOutCubic(Math.min(f.progress * 1.8, 1)))

      if (f.progress >= 1) {
        flight.current = null
        controls.enabled = true
      }
    } else if (obj) {
      // Following, step 1: slide camera and target by however far the body moved.
      moved.subVectors(bodyPos, lastBodyPos)
      camera.position.add(moved)
      controls.target.add(moved)

      // Step 2 (BUG FIX): also TURN with the body as it circles its parent.
      // Sliding alone kept the camera at a fixed compass direction, so as Io
      // whipped around Jupiter (one lap every ~8 seconds) the camera ended up
      // inside Jupiter. Turning keeps the same side of the body in view,
      // like riding along on a merry-go-round.
      if (body?.parentId) {
        let turn = orbitAngle(bodyPos, parentPos) - orbitAngle(lastBodyPos, lastParentPos)
        if (turn > Math.PI) turn -= Math.PI * 2 // wrap so we never spin the long way
        if (turn < -Math.PI) turn += Math.PI * 2
        offset.subVectors(camera.position, bodyPos).applyAxisAngle(UP, -turn)
        camera.position.copy(bodyPos).add(offset)
      }
    }

    lastBodyPos.copy(bodyPos)
    lastParentPos.copy(parentPos)
    controls.update()
  })

  return null
}
