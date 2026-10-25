// AsteroidBelt.tsx — thousands of dots between Mars and Jupiter.
// Drawn as ONE object (a "points" cloud), which is far faster than
// thousands of separate meshes: the graphics card gets one list of positions.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

const COUNT = 2500
const INNER = 17 // Mars orbits at 15, Jupiter at 22 (scene units)
const OUTER = 19.5

export function AsteroidBelt() {
  const ref = useRef<THREE.Points>(null)

  // A Float32Array holds x,y,z for every asteroid, back to back.
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = INNER + Math.random() * (OUTER - INNER)
      arr[i * 3] = Math.cos(angle) * radius
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.6 // a little thickness
      arr[i * 3 + 2] = Math.sin(angle) * radius
    }
    return arr
  }, [])

  // BUG FIX: points are drawn as squares by default, which look like pixels
  // up close. A soft round dot image makes each one a little rock.
  const dot = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 32
    const ctx = canvas.getContext('2d')!
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.5, 'rgba(255,255,255,0.8)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 32, 32)
    return new THREE.CanvasTexture(canvas)
  }, [])

  useFrame((_, delta) => {
    const { paused, speed } = useStore.getState()
    if (ref.current && !paused) ref.current.rotation.y += delta * speed * 0.012
  })

  return (
    <points ref={ref} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial map={dot} size={0.06} color="#a39785" sizeAttenuation transparent opacity={0.85} depthWrite={false} />
    </points>
  )
}
