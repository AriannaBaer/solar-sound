// InfoCard.tsx — the text card for the body you're visiting.
// The words come from data/content.ts (Ahmed & Noah's file). Any section
// still set to PLACEHOLDER is drawn with a dashed outline so it's obvious
// what still needs writing.
import { useState } from 'react'
import { contentFor, PLACEHOLDER, type CardContent } from '../data/content'

const SECTIONS: { key: keyof CardContent; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'standingHere', label: 'Standing here' },
  { key: 'funFact', label: 'Fun fact' },
  { key: 'sources', label: 'Sources' },
]

export function InfoCard({ bodyId }: { bodyId: string }) {
  const [open, setOpen] = useState(true)
  const content = contentFor(bodyId)

  if (!open) {
    return (
      <button className="card-toggle" onClick={() => setOpen(true)}>
        Show info
      </button>
    )
  }

  return (
    <section className="card">
      <button className="card-close" onClick={() => setOpen(false)} aria-label="Hide info">
        ×
      </button>
      {SECTIONS.map(({ key, label }) => {
        const text = content[key]
        const isPlaceholder = text === PLACEHOLDER
        return (
          <div key={key} className={isPlaceholder ? 'card-section placeholder' : 'card-section'}>
            <h2>{label}</h2>
            <p>{text}</p>
          </div>
        )
      })}
    </section>
  )
}
