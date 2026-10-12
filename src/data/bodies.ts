// ─────────────────────────────────────────────────────────────────────────────
// bodies.ts — the single source of truth for every place you can visit.
//
// Two kinds of numbers live here:
//   • REAL data (facts, atmosphere) — approximate public NASA/JPL values.
//     TODO(team): poli sci + mech E should verify each value and add a source.
//   • DISPLAY data (displayRadius, orbitRadius) — NOT to scale. If we drew the
//     real solar system, every planet would be an invisible speck. These are
//     hand-tuned so things look good on screen.
// ─────────────────────────────────────────────────────────────────────────────

export type BodyType = 'star' | 'planet' | 'dwarf planet' | 'moon'

/** Atmosphere numbers the sound engine will use (week 2–3). null = vacuum. */
export interface Atmosphere {
  pressureBar: number // surface pressure (gas giants: the 1-bar level)
  temperatureK: number // temperature at that level, in Kelvin
  molarMassKgPerMol: number // average mass of one mole of the gas mix
  gamma: number // heat capacity ratio (how "springy" the gas is)
  composition: string // human-readable
}

export interface Body {
  id: string
  name: string
  type: BodyType
  parentId: string | null // what it orbits ('sun' for planets)
  tagline: string
  color: string
  displayRadius: number // scene units, NOT to scale
  orbitRadius: number // scene units from parent, NOT to scale
  orbitalPeriodDays: number // real value (0 for the Sun)
  dayLengthHours: number // real solar day length
  gravity: number // m/s² at the surface (or 1-bar level)
  meanTempC: number
  hasSurface: boolean
  rings?: boolean
  atmosphere: Atmosphere | null
}

// Average molar masses (kg/mol) of common gas mixes, reused below.
const CO2_MIX = 0.0434 // mostly CO₂ with a little N₂ (Venus, Mars)
const N2 = 0.028
const H2_HE = 0.0023 // hydrogen + helium (gas giants)

export const BODIES: Body[] = [
  {
    id: 'sun', name: 'The Sun', type: 'star', parentId: null,
    tagline: 'A middle-aged star holding 99.8% of the solar system’s mass.',
    color: '#ffcc55', displayRadius: 3, orbitRadius: 0,
    orbitalPeriodDays: 0, dayLengthHours: 609, gravity: 274, meanTempC: 5500,
    hasSurface: false, atmosphere: null,
  },
  {
    id: 'mercury', name: 'Mercury', type: 'planet', parentId: 'sun',
    tagline: 'Scorched by day, frozen by night, and completely silent.',
    color: '#9c9389', displayRadius: 0.35, orbitRadius: 6,
    orbitalPeriodDays: 88, dayLengthHours: 4222.6, gravity: 3.7, meanTempC: 167,
    hasSurface: true, atmosphere: null,
  },
  {
    id: 'venus', name: 'Venus', type: 'planet', parentId: 'sun',
    tagline: 'Crushing pressure, acid clouds, and the loudest place to stand.',
    color: '#e3c07a', displayRadius: 0.6, orbitRadius: 9,
    orbitalPeriodDays: 224.7, dayLengthHours: 2802, gravity: 8.87, meanTempC: 464,
    hasSurface: true,
    atmosphere: { pressureBar: 92, temperatureK: 737, molarMassKgPerMol: CO2_MIX, gamma: 1.2, composition: '96.5% CO₂, 3.5% N₂' },
  },
  {
    id: 'earth', name: 'Earth', type: 'planet', parentId: 'sun',
    tagline: 'Our baseline. Every other sound is compared to this one.',
    color: '#3f7fd6', displayRadius: 0.63, orbitRadius: 12,
    orbitalPeriodDays: 365.25, dayLengthHours: 24, gravity: 9.81, meanTempC: 15,
    hasSurface: true,
    atmosphere: { pressureBar: 1.013, temperatureK: 288, molarMassKgPerMol: 0.02897, gamma: 1.4, composition: '78% N₂, 21% O₂' },
  },
  {
    id: 'moon', name: 'The Moon', type: 'moon', parentId: 'earth',
    tagline: 'Footprints from 1969 are still there — no wind to erase them.',
    color: '#bdbab3', displayRadius: 0.17, orbitRadius: 1.2,
    orbitalPeriodDays: 27.3, dayLengthHours: 708.7, gravity: 1.62, meanTempC: -20,
    hasSurface: true, atmosphere: null,
  },
  {
    id: 'mars', name: 'Mars', type: 'planet', parentId: 'sun',
    tagline: 'Thin air that muffles sound — and the only planet we’ve recorded.',
    color: '#c1502e', displayRadius: 0.45, orbitRadius: 15,
    orbitalPeriodDays: 687, dayLengthHours: 24.66, gravity: 3.71, meanTempC: -65,
    hasSurface: true,
    atmosphere: { pressureBar: 0.006, temperatureK: 210, molarMassKgPerMol: CO2_MIX, gamma: 1.29, composition: '95% CO₂, 2.8% N₂, 2% Ar' },
  },
  {
    id: 'jupiter', name: 'Jupiter', type: 'planet', parentId: 'sun',
    tagline: 'No ground at all — you’d float in clouds bigger than Earth.',
    color: '#d2a679', displayRadius: 1.6, orbitRadius: 22,
    orbitalPeriodDays: 4333, dayLengthHours: 9.93, gravity: 24.79, meanTempC: -110,
    hasSurface: false,
    atmosphere: { pressureBar: 1, temperatureK: 165, molarMassKgPerMol: H2_HE, gamma: 1.4, composition: '~90% H₂, ~10% He' },
  },
  {
    id: 'io', name: 'Io', type: 'moon', parentId: 'jupiter',
    tagline: 'The most volcanic world we know of.',
    color: '#e8d25a', displayRadius: 0.17, orbitRadius: 2.2,
    orbitalPeriodDays: 1.77, dayLengthHours: 42.5, gravity: 1.8, meanTempC: -130,
    hasSurface: true, atmosphere: null,
  },
  {
    id: 'europa', name: 'Europa', type: 'moon', parentId: 'jupiter',
    tagline: 'An ice shell over a hidden ocean.',
    color: '#d9cdb8', displayRadius: 0.15, orbitRadius: 2.6,
    orbitalPeriodDays: 3.55, dayLengthHours: 85.2, gravity: 1.31, meanTempC: -160,
    hasSurface: true, atmosphere: null,
  },
  {
    id: 'ganymede', name: 'Ganymede', type: 'moon', parentId: 'jupiter',
    tagline: 'The biggest moon in the solar system — larger than Mercury.',
    color: '#9a8f82', displayRadius: 0.22, orbitRadius: 3.1,
    orbitalPeriodDays: 7.15, dayLengthHours: 171.7, gravity: 1.43, meanTempC: -163,
    hasSurface: true, atmosphere: null,
  },
  {
    id: 'saturn', name: 'Saturn', type: 'planet', parentId: 'sun',
    tagline: 'So light for its size it would float in a big enough bathtub.',
    color: '#e3cf98', displayRadius: 1.35, orbitRadius: 30,
    orbitalPeriodDays: 10759, dayLengthHours: 10.7, gravity: 10.44, meanTempC: -140,
    hasSurface: false, rings: true,
    atmosphere: { pressureBar: 1, temperatureK: 134, molarMassKgPerMol: H2_HE, gamma: 1.4, composition: '~96% H₂, ~3% He' },
  },
  {
    id: 'titan', name: 'Titan', type: 'moon', parentId: 'saturn',
    tagline: 'Thicker air than Earth, methane rain, and lakes of liquid gas.',
    color: '#d6a24a', displayRadius: 0.22, orbitRadius: 3.2,
    orbitalPeriodDays: 15.95, dayLengthHours: 382.7, gravity: 1.35, meanTempC: -179,
    hasSurface: true,
    atmosphere: { pressureBar: 1.47, temperatureK: 94, molarMassKgPerMol: N2, gamma: 1.4, composition: '~95% N₂, ~5% CH₄' },
  },
  {
    id: 'uranus', name: 'Uranus', type: 'planet', parentId: 'sun',
    tagline: 'Tipped on its side, rolling around the Sun.',
    color: '#9fd8dc', displayRadius: 1.0, orbitRadius: 37,
    orbitalPeriodDays: 30687, dayLengthHours: 17.24, gravity: 8.69, meanTempC: -195,
    hasSurface: false,
    atmosphere: { pressureBar: 1, temperatureK: 76, molarMassKgPerMol: H2_HE, gamma: 1.45, composition: '~83% H₂, ~15% He, ~2% CH₄' },
  },
  {
    id: 'neptune', name: 'Neptune', type: 'planet', parentId: 'sun',
    tagline: 'The windiest planet — storms faster than the speed of sound on Earth.',
    color: '#4265d6', displayRadius: 0.95, orbitRadius: 42,
    orbitalPeriodDays: 60190, dayLengthHours: 16.11, gravity: 11.15, meanTempC: -200,
    hasSurface: false,
    atmosphere: { pressureBar: 1, temperatureK: 72, molarMassKgPerMol: H2_HE, gamma: 1.45, composition: '~80% H₂, ~19% He, ~1.5% CH₄' },
  },
  {
    id: 'pluto', name: 'Pluto', type: 'dwarf planet', parentId: 'sun',
    tagline: 'A heart-shaped glacier and air so thin it’s nearly a vacuum.',
    color: '#cbb59a', displayRadius: 0.22, orbitRadius: 47,
    orbitalPeriodDays: 90560, dayLengthHours: 153.3, gravity: 0.62, meanTempC: -229,
    hasSurface: true,
    atmosphere: { pressureBar: 0.00001, temperatureK: 40, molarMassKgPerMol: N2, gamma: 1.4, composition: 'Mostly N₂, very thin' },
  },
]

export const BODY_BY_ID: Record<string, Body> = Object.fromEntries(BODIES.map((b) => [b.id, b]))

export const childrenOf = (id: string) => BODIES.filter((b) => b.parentId === id)
