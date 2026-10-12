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
  data/bodies.ts        every planet & moon: facts, atmosphere, display sizes
  physics.ts            speed of sound, density, weight (sound model lives here)
  store.ts              shared app state
  components/
    Scene.tsx           lights, stars, controls
    CelestialBody.tsx   one body + its moons (recursive)
    CameraRig.tsx       fly-to and follow camera
    InfoPanel.tsx       facts panel
docs/LEARNING.md        build log + explanations of how everything works
```

## Team
- Computer science: app and 3D
- Mechanical engineering: physics and sound model
- Political science: content, sources, mission history
