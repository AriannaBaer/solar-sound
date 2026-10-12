// physics.ts — the first piece of the sound model. The mech E owns this file.
import type { Atmosphere } from './data/bodies'

const R = 8.314 // universal gas constant, J/(mol·K)

/** Speed of sound in an ideal gas: c = √(γ·R·T / M), in m/s. */
export function speedOfSound(atm: Atmosphere): number {
  return Math.sqrt((atm.gamma * R * atm.temperatureK) / atm.molarMassKgPerMol)
}

/** Gas density from the ideal gas law: ρ = P·M / (R·T), in kg/m³. */
export function density(atm: Atmosphere): number {
  const pascals = atm.pressureBar * 100_000
  return (pascals * atm.molarMassKgPerMol) / (R * atm.temperatureK)
}

/** What a person who weighs `earthWeight` on Earth would weigh here. */
export function weightHere(earthWeight: number, gravity: number): number {
  return (earthWeight * gravity) / 9.81
}
