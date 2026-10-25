// CelestialBody.tsx — draws one body (and, recursively, its moons).
//
// The trick for orbits: nest groups.
//   <group pivot>               ← sits at the parent's center and ROTATES
//     <group anchor at x=r>     ← pushed out to the orbit radius
//       <group tilt>            ← leans the planet by its real axial tilt
//         <mesh sphere />       ← the planet itself, spinning on its axis
//         atmosphere + rings    ← lean with the planet
//       ...moons...             ← orbit the anchor the same way (not tilted)
// Rotating the pivot swings the anchor around in a circle. No trig needed.
import { useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { type Body, childrenOf } from '../data/bodies'
import { useStore, bodyRegistry } from '../store'
import { planetTexture, ringTexture, glowTexture, atmosphereMaterial, AXIAL_TILT_DEG, RING_INNER, RING_OUTER, ATMOSPHERE_SCALE } from '../visuals'

// Real periods range from 1.8 days (Io) to 90,560 days (Pluto). Using the
// square root squashes that range so inner bodies don't blur and outer ones
// still visibly move. Speed is in radians per second.
function orbitSpeed(periodDays: number) {
  return periodDays > 0 ? 1 / Math.sqrt(periodDays) : 0
}

function spinSpeed(dayHours: number) {
  return 0.6 / Math.sqrt(dayHours / 24)
}

// Decorations (glow, rings, halos) shouldn't catch mouse clicks.
const noRaycast = () => null

export function CelestialBody({ body }: { body: Body }) {
  const pivot = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)
  // Start each body at a random spot on its orbit so they don't all line up.
  const angle = useRef(Math.random() * Math.PI * 2)
  const [hovered, setHovered] = useState(false)
  const select = useStore((s) => s.select)
  const isSelected = useStore((s) => s.selectedId === body.id)

  // useMemo = "compute once and remember", so we don't repaint every render.
  const texture = useMemo(() => planetTexture(body), [body])
  const atmosphere = useMemo(() => atmosphereMaterial(body), [body])
  const moons = childrenOf(body.id)
  const isStar = body.type === 'star'
  const r = body.displayRadius
  const tilt = THREE.MathUtils.degToRad(AXIAL_TILT_DEG[body.id] ?? 0)

  // 160 points around a circle, flat on the orbit plane.
  const orbitPoints = useMemo(() => {
    if (body.orbitRadius <= 0) return null
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * body.orbitRadius, 0, Math.sin(a) * body.orbitRadius))
    }
    return pts
  }, [body.orbitRadius])

  // useFrame runs every frame (~60×/sec). `delta` = seconds since last frame,
  // so motion is the same speed on fast and slow computers.
  useFrame((_, delta) => {
    // getState() reads the store without causing a re-render every frame.
    const { paused, speed } = useStore.getState()
    if (!paused) {
      angle.current += delta * speed * orbitSpeed(body.orbitalPeriodDays)
      if (mesh.current) mesh.current.rotation.y += delta * speed * spinSpeed(body.dayLengthHours)
    }
    if (pivot.current) pivot.current.rotation.y = angle.current
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation() // don't also select the planet *behind* this moon
    select(body.id)
  }

  return (
    <>
      {/* The orbit path, drawn in the parent's space so it doesn't rotate.
          BUG FIX: this used to be a thin ring mesh, which turned into a thick
          gray stripe up close. <Line> is measured in screen pixels, so it's
          always a crisp 1px line no matter how far you zoom. */}
      {orbitPoints && (
        <Line
          points={orbitPoints}
          color="#ffffff"
          lineWidth={1}
          transparent
          opacity={isSelected ? 0.35 : body.type === 'moon' ? 0.1 : 0.16}
          raycast={noRaycast}
        />
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
          <group rotation-z={tilt}>
            <mesh
              ref={mesh}
              onClick={onClick}
              onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
              onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
            >
              <sphereGeometry args={[r, 64, 64]} />
              {isStar ? (
                // The Sun makes its own light, so it ignores lighting.
                // toneMapped={false} keeps it at full brightness.
                <meshBasicMaterial map={texture} toneMapped={false} />
              ) : (
                <meshStandardMaterial
                  map={texture}
                  roughness={1}
                  metalness={0}
                  // On hover, the texture also "glows" a little.
                  emissive="#ffffff"
                  emissiveMap={texture}
                  emissiveIntensity={hovered ? 0.25 : 0}
                />
              )}
            </mesh>

            {atmosphere && (
              <mesh raycast={noRaycast} material={atmosphere}>
                <sphereGeometry args={[r * ATMOSPHERE_SCALE, 64, 64]} />
              </mesh>
            )}

            {body.rings && (
              // Flat in the planet's equator, so it leans with the tilt group.
              <mesh rotation-x={-Math.PI / 2} raycast={noRaycast}>
                <ringGeometry args={[r * RING_INNER, r * RING_OUTER, 160]} />
                <meshStandardMaterial map={ringTexture()} transparent side={THREE.DoubleSide} depthWrite={false} roughness={1} />
              </mesh>
            )}
          </group>

          {isStar && (
            // Two glowing sprites (flat images that always face the camera).
            <>
              <sprite scale={[r * 4, r * 4, 1]} raycast={noRaycast}>
                <spriteMaterial map={glowTexture()} blending={THREE.AdditiveBlending} depthWrite={false} transparent toneMapped={false} />
              </sprite>
              <sprite scale={[r * 10, r * 10, 1]} raycast={noRaycast}>
                <spriteMaterial map={glowTexture()} blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0.35} toneMapped={false} />
              </sprite>
            </>
          )}

          {hovered && !isSelected && (
            <Html position={[0, r + 0.4, 0]} center style={{ pointerEvents: 'none' }}>
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
