// App.tsx — the page layout: 3D canvas behind, HTML UI on top.
import { Canvas } from '@react-three/fiber'
import { Scene } from './components/Scene'
import { InfoPanel } from './components/InfoPanel'
import { BODIES } from './data/bodies'
import { useStore } from './store'

export default function App() {
  const { selectedId, select, paused, togglePaused } = useStore()
  const navBodies = BODIES.filter((b) => b.parentId === 'sun' || b.type === 'star')

  return (
    <div className="app">
      <Canvas camera={{ position: [0, 32, 58], fov: 50, near: 0.05, far: 2000 }}>
        <color attach="background" args={['#05060a']} />
        <Scene />
      </Canvas>

      <header className="topbar">
        <span className="logo">Solar Sound</span>
        <button onClick={togglePaused}>{paused ? 'Play orbits' : 'Pause orbits'}</button>
      </header>

      <nav className="bodybar" aria-label="Travel to">
        {navBodies.map((b) => (
          <button key={b.id} className={b.id === selectedId ? 'active' : ''} onClick={() => select(b.id)}>
            <span className="dot" style={{ background: b.color }} />
            {b.name.replace('The ', '')}
          </button>
        ))}
      </nav>

      <InfoPanel />
    </div>
  )
}
