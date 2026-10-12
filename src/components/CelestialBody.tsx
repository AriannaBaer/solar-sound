// CelestialBody.tsx — draws one body (and, recursively, its moons).
//
// The trick for orbits: nest two groups.
//   <group pivot>            ← sits at the parent's center and ROTATES
//     <group anchor at x=r>  ← pushed out to the orbit radius
//       <mesh sphere />      ← the planet itself, spinning on its axis
//       ...moons...          ← children orbit the anchor the same way
// Rotating the pivot swings the anchor around in a circle. No trig needed.
import { useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { type Body, childrenOf } from '../data/bodies'
import { useStore, bodyRegistry } from '../store'

// Real periods range from 1.8 days (Io) to 90,560 days (Pluto). Using the
// square root squashes that range so inner bodies don't blur and outer ones
// still visibly move. Speed is in radians per second.
function orbitSpeed(periodDays: number) {
  return periodDays > 0 ? 1 / Math.sqrt(periodDays) : 0
}

function spinSpeed(dayHours: number) {
  return 0.6 / Math.sqrt(dayHours / 24)
}

export function CelestialBody({ body }: { body: Body }) {
  const pivot = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)
  // Start each body at a random spot on its orbit so they don't all line up.
  const angle = useRef(Math.random() * Math.PI * 2)
  const [hovered, setHovered] = useState(false)
  const select = useStore((s) => s.select)
  const moons = childrenOf(body.id)
  const isStar = body.type === 'star'

  // useFrame runs every frame (~60×/sec). `delta` = seconds since last frame,
  // so motion is the same speed on fast and slow computers.
  useFrame((_, delta) => {
    // getState() reads the store without causing a re-render every frame.
    if (!useStore.getState().paused) {
      angle.current += delta * orbitSpeed(body.orbitalPeriodDays)
      if (mesh.current) mesh.current.rotation.y += delta * spinSpeed(body.dayLengthHours)
    }
    if (pivot.current) pivot.current.rotation.y = angle.current
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation() // don't also select the planet *behind* this moon
    select(body.id)
  }

  return (
    <>
      {/* The orbit path, drawn in the parent's space so it doesn't rotate. */}
      {body.orbitRadius > 0 && (
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[body.orbitRadius - 0.015, body.orbitRadius + 0.015, 128]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={body.type === 'moon' ? 0.08 : 0.15} side={THREE.DoubleSide} />
        </mesh>
      )}

      <group ref={pivot}>
        <group
          position={[body.orbitRadius, 0, 0]}
          // A "ref callback": runs when the object is created/removed,
          // so the camera can find this body later.
          ref={(obj) => {
            if (obj) bodyRegistry.set(body.id, obj)
            else bodyRegistry.delete(body.id)
          }}
        >
          <mesh
            ref={mesh}
            onClick={onClick}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
          >
            <sphereGeometry args={[body.displayRadius, 48, 48]} />
            {isStar ? (
              // The Sun makes its own light, so it ignores lighting.
              <meshBasicMaterial color={body.color} />
            ) : (
              <meshStandardMaterial color={body.color} roughness={0.9} emissive={body.color} emissiveIntensity={hovered ? 0.25 : 0.04} />
            )}
          </mesh>

          {body.rings && (
            <mesh rotation-x={-Math.PI / 2 + 0.47}>
              <ringGeometry args={[body.displayRadius * 1.3, body.displayRadius * 2.2, 96]} />
              <meshStandardMaterial color="#cdb98a" transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
          )}

          {hovered && (
            <Html position={[0, body.displayRadius + 0.4, 0]} center style={{ pointerEvents: 'none' }}>
              <div className="hover-label">{body.name}</div>
            </Html>
          )}

          {moons.map((m) => (
            <CelestialBody key={m.id} body={m} />
          ))}
        </group>
      </group>
    </>
  )
}
