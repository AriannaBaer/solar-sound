// InfoPanel.tsx — regular HTML (not 3D) drawn on top of the canvas.
import { useState } from 'react'
import { BODY_BY_ID, childrenOf } from '../data/bodies'
import { speedOfSound, density, weightHere } from '../physics'
import { useStore } from '../store'

const fmt = (n: number, digits = 0) => n.toLocaleString(undefined, { maximumFractionDigits: digits })

export function InfoPanel() {
  const selectedId = useStore((s) => s.selectedId)
  const select = useStore((s) => s.select)
  const [earthWeight, setEarthWeight] = useState(150)

  if (!selectedId) return null
  const body = BODY_BY_ID[selectedId]
  const parent = body.parentId ? BODY_BY_ID[body.parentId] : null
  const moons = childrenOf(body.id)
  const atm = body.atmosphere

  return (
    <aside className="panel">
      <p className="eyebrow">{body.type}{parent && parent.id !== 'sun' ? ` of ${parent.name}` : ''}</p>
      <h1>{body.name}</h1>
      <p className="tagline">{body.tagline}</p>

      <dl className="facts">
        <dt>Gravity</dt><dd>{fmt(body.gravity, 2)} m/s²</dd>
        <dt>Avg. temperature</dt><dd>{fmt(body.meanTempC)} °C</dd>
        <dt>Length of a day</dt><dd>{body.dayLengthHours < 48 ? `${fmt(body.dayLengthHours, 1)} hours` : `${fmt(body.dayLengthHours / 24, 1)} Earth days`}</dd>
        {body.orbitalPeriodDays > 0 && (
          <><dt>One orbit</dt><dd>{body.orbitalPeriodDays < 730 ? `${fmt(body.orbitalPeriodDays, 1)} days` : `${fmt(body.orbitalPeriodDays / 365.25, 1)} years`}</dd></>
        )}
        <dt>Surface</dt><dd>{body.hasSurface ? 'Solid ground' : 'None — you’d be floating'}</dd>
      </dl>

      <h2>Sound here</h2>
      {atm && atm.pressureBar > 0.001 ? (
        <dl className="facts">
          <dt>Air</dt><dd>{atm.composition}</dd>
          <dt>Pressure</dt><dd>{fmt(atm.pressureBar, 3)} × Earth</dd>
          <dt>Speed of sound</dt><dd>{fmt(speedOfSound(atm))} m/s <span className="muted">(Earth: 340)</span></dd>
          <dt>Air density</dt><dd>{fmt(density(atm), 3)} kg/m³ <span className="muted">(Earth: 1.2)</span></dd>
        </dl>
      ) : (
        <p className="muted">Silence. There’s too little air to carry sound.</p>
      )}

      <h2>Your weight here</h2>
      <label className="weight">
        On Earth I weigh
        <input type="number" min={1} value={earthWeight} onChange={(e) => setEarthWeight(Number(e.target.value) || 0)} />
      </label>
      <p className="big">{fmt(weightHere(earthWeight, body.gravity))} <span className="muted">here</span></p>

      {moons.length > 0 && (
        <>
          <h2>Moons to visit</h2>
          <div className="chips">
            {moons.map((m) => <button key={m.id} onClick={() => select(m.id)}>{m.name}</button>)}
          </div>
        </>
      )}

      <button className="back" onClick={() => select(parent && parent.id !== 'sun' ? parent.id : null)}>
        ← Back to {parent && parent.id !== 'sun' ? parent.name : 'the solar system'}
      </button>
    </aside>
  )
}
