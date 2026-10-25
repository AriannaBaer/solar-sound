// App.tsx — the page layout: 3D canvas behind, a little HTML navigation on top.
import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './components/Scene'
import { InfoCard } from './components/InfoCard'
import { BODIES, BODY_BY_ID, childrenOf } from './data/bodies'
import { useStore } from './store'

// The main stops: the Sun plus everything orbiting it directly.
const NAV_BODIES = BODIES.filter((b) => b.parentId === 'sun' || b.type === 'star')

// Time speed slider: the slider goes -2..3 and we use 2^value, so it
// covers ¼× to 8× with "1×" right in a comfortable spot.
const SPEED_MIN = -2
const SPEED_MAX = 3

export default function App() {
  const selectedId = useStore((s) => s.selectedId)
  const select = useStore((s) => s.select)
  const paused = useStore((s) => s.paused)
  const togglePaused = useStore((s) => s.togglePaused)
  const speed = useStore((s) => s.speed)
  const setSpeed = useStore((s) => s.setSpeed)

  const selected = selectedId ? BODY_BY_ID[selectedId] : null
  // The planet we're "at": the selected planet, or a selected moon's planet.
  const system = selected?.type === 'moon' && selected.parentId ? BODY_BY_ID[selected.parentId] : selected
  // BUG FIX: everything orbits the Sun, so "moons of the Sun" listed every
  // planet a second time. Only planets and dwarf planets show moons.
  const moons = system && system.type !== 'star' ? childrenOf(system.id) : []

  // On narrow screens the bar scrolls sideways; keep the current stop visible.
  useEffect(() => {
    document.querySelector('.bodybar .active')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  // Keyboard: ← → hop between planets, Esc zooms back out.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      const { selectedId, select } = useStore.getState()
      if (e.key === 'Escape') select(null)
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      const step = e.key === 'ArrowRight' ? 1 : -1
      // If a moon is selected, step from its planet.
      const current = selectedId ? BODY_BY_ID[selectedId] : null
      const fromId = current?.type === 'moon' ? current.parentId : selectedId
      const i = NAV_BODIES.findIndex((b) => b.id === fromId)
      const next = i < 0 ? (step > 0 ? 0 : NAV_BODIES.length - 1) : (i + step + NAV_BODIES.length) % NAV_BODIES.length
      select(NAV_BODIES[next].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey) // cleanup when the app unmounts
  }, [])

  return (
    <div className="app">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 32, 58], fov: 50, near: 0.05, far: 2000 }}>
        <color attach="background" args={['#030409']} />
        <Scene />
      </Canvas>

      <header className="topbar">
        <span className="logo">Solar Sound</span>
        <div className="controls">
          <label className="speed">
            <span>{speed < 1 ? speed.toFixed(2) : speed}×</span>
            <input
              type="range"
              min={SPEED_MIN}
              max={SPEED_MAX}
              step={1}
              value={Math.log2(speed)}
              onChange={(e) => setSpeed(2 ** Number(e.target.value))}
              aria-label="Time speed"
            />
          </label>
          <button onClick={togglePaused}>{paused ? 'Play' : 'Pause'}</button>
          {selected && <button onClick={() => select(null)}>Overview</button>}
        </div>
      </header>

      {/* Left column: the name, then the text card. `key` makes React rebuild
          it for each new body, which replays the fade-in animation. */}
      {selected && (
        <aside className="side" key={selected.id}>
          <div className="title">
            <p>{selected.type === 'moon' && system ? `Moon of ${system.name}` : selected.type}</p>
            <h1>{selected.name}</h1>
          </div>
          <InfoCard bodyId={selected.id} />
        </aside>
      )}

      {/* ONE navigation bar. The current planet's moons appear right after it,
          as smaller chips, instead of in a second bar. */}
      <nav className="bodybar" aria-label="Travel to">
        {NAV_BODIES.map((b) => (
          <span key={b.id} className="navgroup">
            <button className={b.id === selectedId ? 'active' : system?.id === b.id ? 'current' : ''} onClick={() => select(b.id)}>
              <span className="dot" style={{ background: b.color }} />
              {b.name.replace('The ', '')}
            </button>
            {system?.id === b.id &&
              moons.map((m) => (
                <button key={m.id} className={m.id === selectedId ? 'moon active' : 'moon'} onClick={() => select(m.id)}>
                  {m.name.replace('The ', '')}
                </button>
              ))}
          </span>
        ))}
      </nav>

      <p className="hint">← → travel · Esc overview · drag to look · scroll to zoom</p>
    </div>
  )
}
