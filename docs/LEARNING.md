# Solar Sound — Build Log & Learning Guide

This file is our running notebook. Every step we build gets a section: **what** we did, **how** it works, and **what to try** so you actually learn it instead of just having it.

---

## Step 0 — Run it on your computer

You need **Node.js** (version 18 or newer). Check with `node -v` in a terminal. If you don't have it, install the LTS version from nodejs.org.

```bash
cd solar-sound
npm install      # downloads every library listed in package.json into node_modules/
npm run dev      # starts a local server, usually at http://localhost:5173
```

Open the link it prints. Edit any file and save: the page updates instantly. That's Vite's "hot reload."

**Put it on GitHub today** so your teammates can see it and you have history:

```bash
git init
git add .
git commit -m "Step 1: clickable solar system"
```

Then create an empty repo on GitHub and follow its "push an existing repository" instructions.

---

## Step 1 — A clickable 3D solar system ✅

### The big picture

```
index.html ──loads──▶ main.tsx ──renders──▶ App.tsx
                                              ├── <Canvas>  (3D, WebGL)
                                              │     └── Scene
                                              │           ├── lights + stars
                                              │           ├── CelestialBody(sun)
                                              │           │     └── CelestialBody(earth)
                                              │           │           └── CelestialBody(moon) ...
                                              │           ├── OrbitControls (drag to look)
                                              │           └── CameraRig (fly-to)
                                              ├── top bar + planet bar (HTML)
                                              └── InfoPanel (HTML)
```

There are **two layers** stacked on top of each other:
1. The **3D canvas** (React Three Fiber). Planets, stars, camera.
2. Normal **HTML/CSS** on top. Buttons and the fact panel.

They talk to each other through a shared **store** (`store.ts`): click a planet in 3D → the store's `selectedId` changes → the HTML panel shows that planet *and* the camera flies to it.

### The tools, in one sentence each

| Tool | What it does for us |
|---|---|
| **TypeScript** | JavaScript with types. It catches typos like `body.gravty` before you run anything. |
| **React** | You describe the UI as components (functions that return markup); React keeps the screen in sync with your data. |
| **Vite** | Dev server and bundler. Instant reloads while coding, an optimized build for deploying. |
| **Three.js** | The 3D engine on top of WebGL: meshes, materials, lights, cameras. |
| **React Three Fiber (R3F)** | Lets you write Three.js as React components: `<mesh>` instead of `new THREE.Mesh()`. |
| **drei** | Ready-made R3F helpers we'd otherwise write ourselves: `OrbitControls`, `Stars`, `Html`. |
| **Zustand** | A tiny global store so separate components share state without passing props down five levels. |

### File by file

**`src/data/bodies.ts` — the data.** Every planet and moon is one object in an array. Nothing else in the app hard-codes a planet, so adding a new moon means adding one object here and nothing else. This is the file your teammates will edit most. Notice each body has two kinds of numbers:
- **Real** values (gravity, temperature, atmosphere) for facts and the sound engine.
- **Display** values (`displayRadius`, `orbitRadius`) that are deliberately *not* to scale. At true scale, if the Sun were a beach ball, Earth would be a peppercorn 25 meters away and Neptune 750 meters away. You'd see nothing.

**`src/store.ts` — shared state.** `selectedId` is which body we're visiting (`null` = zoomed out). `bodyRegistry` is a `Map` from id → the body's live 3D object, so the camera can ask "where is Titan *right now*?"

**`src/components/CelestialBody.tsx` — one body, recursively.** This is the cleverest file. Read the comment at the top about the **pivot/anchor trick**: we never compute `x = r·cos(θ)`. We put the planet inside a group, push it out to the orbit radius, and *rotate the group*. Moons are rendered inside their planet's group, so they automatically travel with the planet while orbiting it. The component calls itself for each moon. That's **recursion**.

Things to notice:
- `useFrame((_, delta) => …)` runs every frame. Multiplying speeds by `delta` (seconds since last frame) keeps motion identical on a 60 Hz laptop and a 144 Hz monitor.
- Orbit speed uses `1/√(period)`. Real periods range from 1.8 days (Io) to 90,560 days (Pluto), and the square root squashes that range so you can see both.
- `e.stopPropagation()` on click: a moon sits in front of its planet, and without this, one click would select both.

**`src/components/CameraRig.tsx` — flying.** Two phases. For 2 seconds after a click, the camera **eases** toward a point just in front of the body using `lerp` (linear interpolation: "move a fraction of the way there"). After that, it **follows**: each frame we measure how far the body moved and shift the camera by the same amount, so you stay with it while still being able to drag around.

The easing line `1 - Math.pow(0.01, delta)` is a frame-rate-independent lerp factor: whatever the frame rate, it closes 99% of the distance per second.

**`src/components/Scene.tsx`** — lights, starfield, the Sun (which recursively draws everything else), and controls.

**`src/components/InfoPanel.tsx`** — plain React + HTML. It reads `selectedId`, looks up the body, and shows facts. If `selectedId` is `null` it returns `null` (renders nothing).

**`src/physics.ts` — the start of the sound engine.** Already working:
- Speed of sound: **c = √(γRT/M)**
- Gas density: **ρ = PM/(RT)**

Our results with the current data: Earth 340 m/s, Venus 412, Mars 228, Titan 198, Jupiter 914. Real Mars measurements are ~240 m/s and Venus ~410, so the model is in the right range. That gives us a check against reality.

### Try it yourself (do these, they're how you learn it)

1. **Change a color.** Make Mars bright green in `bodies.ts`. Save, watch it reload.
2. **Add a moon.** Add Enceladus (Saturn's moon): copy the Titan object, change `id`, `name`, `parentId: 'saturn'`, `orbitRadius: 2.4`, `displayRadius: 0.1`, gravity 0.11, period 1.37 days, day 32.9 hours, `atmosphere: null`. Notice you touched no other file.
3. **Change orbit speed.** In `CelestialBody.tsx`, change `1 / Math.sqrt(periodDays)` to `5 / periodDays`. What breaks? (Inner moons blur; outer planets freeze.) Then change it back. Now you understand why the square root is there.
4. **Read the store.** Add `console.log(selectedId)` inside `InfoPanel`, open the browser dev tools (F12 → Console), click planets.

### Known limits (on purpose, for now)
- Planets are solid colors. Real textures come in Step 2.
- Orbits are circles on one flat plane. Real orbits are slightly tilted ellipses, a stretch goal for the mech E.
- Facts need sources. TODO for the poli sci major: verify every value and add a `source` field.

---

## Coming next

- **Step 2: Surface view.** Click "Land" to stand on the body: sky color, Sun size from that distance, horizon. Real texture maps.
- **Step 3: Sound engine.** Web Audio API: ambient wind processed through each atmosphere (volume from density × speed of sound, low-pass filter for muffling).
- **Step 4: "Hear your voice here."** Live microphone through the same filters.

## Team handoff for this week
- **Mech E:** Check every `atmosphere` value in `bodies.ts`, especially `gamma` and the gas giants' 1-bar temperatures. Then research how sound loudness and absorption depend on density and gas type. That's the core of Step 3. `physics.ts` is yours.
- **Poli sci:** Verify `tagline`, gravity, temperature, day and orbit lengths, and add sources. Draft a 2–3 sentence "what it's like to stand here" paragraph for each body, plus which missions visited.
