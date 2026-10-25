// store.ts — app-wide state with Zustand.
// Any component can read or change these values; React re-renders only the
// components that use the piece that changed.
import { create } from 'zustand'
import type { Object3D } from 'three'

interface AppState {
  selectedId: string | null // null = zoomed out to the whole system
  paused: boolean
  speed: number // time multiplier for orbits and spin (1 = normal)
  select: (id: string | null) => void
  togglePaused: () => void
  setSpeed: (speed: number) => void
}

export const useStore = create<AppState>((set) => ({
  selectedId: null,
  paused: false,
  speed: 1,
  select: (id) => set({ selectedId: id }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setSpeed: (speed) => set({ speed }),
}))

// The camera needs to know where each body is *right now* (they keep moving).
// Each body registers its 3D object here; the camera looks it up by id.
// This is a plain Map, not React state, because it changes every frame.
export const bodyRegistry = new Map<string, Object3D>()
