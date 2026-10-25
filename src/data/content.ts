// ─────────────────────────────────────────────────────────────────────────────
// content.ts — the words on each planet's card.
//
// 👋 AHMED & NOAH: this file is yours! You don't need to know how to code.
//   1. Find the planet below.
//   2. Replace the text between the quotes '...' with your writing.
//   3. Keep the quotes and the comma at the end of each line.
//   4. Save the file. The website updates by itself.
//
// Need an apostrophe (like "it's")? Use a curly one ’ or put a \ before it: it\'s
// Leave a line as PLACEHOLDER and it will keep showing the "add text here" note.
// ─────────────────────────────────────────────────────────────────────────────

export const PLACEHOLDER = 'Ahmed and Noah can add text here.'

export interface CardContent {
  /** 2–3 sentences: what is this place? */
  overview: string
  /** What would it look, feel, and sound like to stand (or float) here? */
  standingHere: string
  /** One surprising fact. */
  funFact: string
  /** Where the info came from (NASA page, paper, etc). */
  sources: string
}

const empty = (): CardContent => ({
  overview: PLACEHOLDER,
  standingHere: PLACEHOLDER,
  funFact: PLACEHOLDER,
  sources: PLACEHOLDER,
})

export const CONTENT: Record<string, CardContent> = {
  sun: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
  mercury: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
  venus: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
  earth: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
  moon: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
  mars: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
  jupiter: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
  io: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
  europa: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
  ganymede: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
  saturn: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
  titan: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
  uranus: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
  neptune: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
  pluto: {
    overview: PLACEHOLDER,
    standingHere: PLACEHOLDER,
    funFact: PLACEHOLDER,
    sources: PLACEHOLDER,
  },
}

/** Content for a body. A newly added body gets placeholders automatically. */
export const contentFor = (id: string): CardContent => CONTENT[id] ?? empty()
