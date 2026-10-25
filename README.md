# Solar Sound

Travel the solar system in your browser: click a planet or moon, fly to it, learn what it's like there, and (soon) hear what sound would be like in its atmosphere.

## Run it

```bash
npm install
npm run dev
```

Requires Node.js 18+.

## Stack
React + TypeScript + Vite, React Three Fiber / drei (3D), Zustand (state).

## Project structure
```
src/
  data/bodies.ts        every planet & moon: numbers, atmosphere, display sizes
  data/content.ts       the words on each card (Ahmed & Noah edit this)
  physics.ts            speed of sound, density, weight (sound model lives here)
  visuals.ts            painted surfaces, rings, sun glow, atmosphere halos, tilts
  store.ts              shared app state
  components/
    Scene.tsx           lights, stars, controls
    CelestialBody.tsx   one body + its moons (recursive)
    CameraRig.tsx       cinematic flights + follow camera
    AsteroidBelt.tsx    the asteroid belt
    InfoCard.tsx        the text card for the current body
docs/LEARNING.md        build log + explanations of how everything works
```

## Adding text (for Ahmed & Noah)
Open `src/data/content.ts`, find the planet, and replace `PLACEHOLDER` with your text in quotes:
```ts
mars: {
  overview: 'Mars is a cold desert world about half the size of Earth.',
  ...
```

## Team
- Ari (computer science): app and 3D
- Ahmed & Noah: physics, sound model, content, sources, mission history
