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

## Step 2 — Better visuals & cinematic flights ✅

We removed the fact panel (`InfoPanel.tsx`) so the experience is all about the view and the motion. The facts aren't lost: they're still in `bodies.ts`, and `physics.ts` stays for the sound engine.

### What changed
| File | What it does now |
|---|---|
| `visuals.ts` *(new)* | Paints every surface in code, plus Saturn's ring bands, the Sun's glow, atmosphere halos, and real axial tilts. |
| `AsteroidBelt.tsx` *(new)* | 2,500 rocks between Mars and Jupiter. |
| `CameraRig.tsx` | Rewritten. Flights arc, ease in and out, and arrive on the sunlit side. |
| `CelestialBody.tsx` | Uses the textures, glow, tilt, and rings. Highlights the selected orbit. |
| `App.tsx` | No panel. Just the body's name, a moon bar, a time-speed slider, and keyboard controls. |
| `store.ts` | Adds `speed` (time multiplier). |

### Idea 1: painting textures with `<canvas>` (`visuals.ts`)
A **texture** is an image wrapped around a 3D shape. A sphere's texture is a 2:1 rectangle, the same way a world map unrolls a globe. Instead of downloading photos, we draw on an invisible HTML `<canvas>`:
- **Gas giants** get stripes from adding three sine waves together: `sin(y·f₁) + sin(y·f₂) + sin(y·f₃)`. Each wave alone is too regular, but the sum looks natural.
- **Rocky worlds** get about 1,400 soft blobs. `rand() ** 3` makes most blobs tiny and a few huge, which is how craters and terrain are actually distributed.
- **Seeded randomness:** `seeded(hashString('mars'))` gives the same "random" numbers every time, so Mars doesn't reshuffle on reload.
- **Seam fix:** every blob is drawn three times (shifted left, normal, shifted right) so blobs at the edge wrap around without a visible line.

### Idea 2: a shader for the atmosphere glow
A **shader** is a tiny program that runs on the graphics card, once for every pixel, in parallel. Ours checks how much each point on a slightly larger sphere faces you:
```glsl
float rim = 1.0 - dot(normal, toCamera); // 0 facing you, 1 at the edge
```
At the edge of a planet you look through the most air, so that's where it glows. Thicker air (Venus) gives a stronger glow; Mars is faint. That's real physics showing up visually.

### Idea 3: the flight path (`CameraRig.tsx`)
- **Bézier curve:** start point → raised midpoint → end point. The camera follows the curve, so it swoops over instead of flying through the Sun.
- **Easing:** `easeInOutCubic` turns steady progress (0→1) into slow → fast → slow. Compare it with the old version, which jumped off fast and crawled to a stop.
- **Look-ahead:** the camera's gaze reaches the destination at 55% of the flight (`progress * 1.8`), like turning your head before you walk.
- **Moving target:** the end point is recomputed every frame, because the planet keeps orbiting while you fly.
- **Sunlit arrival:** we point from the planet toward the Sun and rotate about 35°, so you see day, night, and the line between them.

### Idea 4: one object for 2,500 asteroids
2,500 separate meshes would mean 2,500 draw calls, which is slow. A `points` object sends all the positions to the graphics card in one `Float32Array` (x, y, z, x, y, z, …): one draw call.

### Try it yourself
1. In `CameraRig.tsx`, change `sideways * 0.25` to `sideways * 1`. Huge swoops! Then try `0`: straight lines.
2. Replace `easeInOutCubic(f.progress)` with just `f.progress`. Feel how robotic linear motion is?
3. In `visuals.ts`, change Jupiter's band contrast (`jupiter: 0.35`) to `1`.
4. Change `AXIAL_TILT_DEG.earth` to `90` and watch Earth roll like Uranus.

---

## Step 3 — Bug hunt + text cards ✅

### Bugs found and fixed
We built the app and took screenshots at every stop to find these.

| Bug | Why it happened | Fix |
|---|---|---|
| Clicking the Sun showed a 2nd bar with every planet | The moon bar shows "things orbiting the selected body". Everything orbits the Sun! | Only planets show moons, and moons now sit *inside* the one main bar. |
| Camera ended up inside Jupiter/Earth when visiting a moon | Moons orbit close to their planet, and Io laps Jupiter every ~8 s. The camera only *slid* along with the moon, so the moon swung around and left the camera inside the planet. | The camera now also *turns* with the moon around its planet (`orbitAngle` in `CameraRig.tsx`), and always starts on the outside of the orbit. |
| Atmospheres looked like glass bubbles | We drew the front of the glow sphere, which has a hard edge. | Draw the *inside* (back faces) and fade to zero at the edge. The glow is also dimmer on the night side. |
| Asteroids were big squares up close | Points draw as squares by default. | A round, soft dot image. |
| Orbit lines became thick gray stripes up close | They were thin 3D rings, so the closer you got, the thicker they looked. | drei's `<Line>`, which is always 1 screen pixel wide. |
| Page froze (found while fixing) | Blurring 6,000 shapes one at a time. | Draw them all, then blur the finished layer once. |
| Ice caps had a "starburst" at the poles | The top row of a flat map squeezes into one point on a sphere. | Solid bands with a wobbly edge lower down. |

Lesson: **look at your app**. Every one of these was obvious in a screenshot and invisible in the code.

### The text cards
- **`src/data/content.ts`**: one entry per body with four sections (Overview, Standing here, Fun fact, Sources). Every one starts as `PLACEHOLDER`. This is Ahmed and Noah's file. They only edit text between quotes.
- **`src/components/InfoCard.tsx`**: shows the card. Any section still equal to `PLACEHOLDER` gets a dashed box, so it's obvious what's left to write.
- Why a separate file? **Separation of content and code.** Writers can't break the 3D code by editing words, and you can't accidentally delete their writing while changing layouts.

---

## Coming next

- **Step 2: Surface view.** Click "Land" to stand on the body: sky color, Sun size from that distance, horizon. Real texture maps.
- **Step 3: Sound engine.** Web Audio API: ambient wind processed through each atmosphere (volume from density × speed of sound, low-pass filter for muffling).
- **Step 4: "Hear your voice here."** Live microphone through the same filters.

## Team handoff for this week
- **Mech E:** Check every `atmosphere` value in `bodies.ts`, especially `gamma` and the gas giants' 1-bar temperatures. Then research how sound loudness and absorption depend on density and gas type. That's the core of Step 3. `physics.ts` is yours.
- **Poli sci:** Verify `tagline`, gravity, temperature, day and orbit lengths, and add sources. Draft a 2–3 sentence "what it's like to stand here" paragraph for each body, plus which missions visited.
