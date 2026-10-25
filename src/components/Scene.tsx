// Scene.tsx — everything inside the 3D canvas.
import { OrbitControls, Stars } from '@react-three/drei'
import { BODY_BY_ID } from '../data/bodies'
import { CelestialBody } from './CelestialBody'
import { CameraRig } from './CameraRig'
import { AsteroidBelt } from './AsteroidBelt'

export function Scene() {
  return (
    <>
      {/* Very faint fill light so night sides are dark but not pure black. */}
      <ambientLight intensity={0.08} />
      {/* The Sun's light. decay=0 means it doesn't fade with distance —
          not realistic, but otherwise Neptune would be invisible. */}
      <pointLight position={[0, 0, 0]} intensity={3} decay={0} />

      <Stars radius={300} depth={80} count={8000} factor={4} saturation={0.3} fade speed={0.3} />

      {/* Start the tree at the Sun; it renders planets, which render moons. */}
      <CelestialBody body={BODY_BY_ID.sun} />
      <AsteroidBelt />

      {/* makeDefault lets other components (CameraRig) find these controls.
          Damping = the camera glides to a stop after you let go of a drag. */}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        minDistance={1}
        maxDistance={150}
      />
      <CameraRig />
    </>
  )
}
