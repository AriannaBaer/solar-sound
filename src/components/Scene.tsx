// Scene.tsx — everything inside the 3D canvas.
import { OrbitControls, Stars } from '@react-three/drei'
import { BODY_BY_ID } from '../data/bodies'
import { CelestialBody } from './CelestialBody'
import { CameraRig } from './CameraRig'

export function Scene() {
  return (
    <>
      {/* Faint fill light so the night side isn't pitch black. */}
      <ambientLight intensity={0.12} />
      {/* The Sun's light. decay=0 means it doesn't fade with distance —
          not realistic, but otherwise Neptune would be invisible. */}
      <pointLight position={[0, 0, 0]} intensity={2.6} decay={0} />

      <Stars radius={300} depth={80} count={6000} factor={4} fade />

      {/* Start the tree at the Sun; it renders planets, which render moons. */}
      <CelestialBody body={BODY_BY_ID.sun} />

      {/* makeDefault lets other components (CameraRig) find these controls. */}
      <OrbitControls makeDefault enablePan={false} minDistance={0.5} maxDistance={150} />
      <CameraRig />
    </>
  )
}
