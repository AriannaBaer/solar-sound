// visuals.ts — everything that makes the bodies look good, generated in code.
//
// We PAINT each planet's surface onto an invisible <canvas> (a 2D drawing
// surface, like MS Paint in memory) and wrap that picture around the sphere.
// No image downloads needed. Later we can swap in real NASA photo maps.
import * as THREE from 'three'
import type { Body } from './data/bodies'

// ── Small helpers ───────────────────────────────────────────────────────────

/** Seeded random numbers: the same seed gives the same "random" sequence,
 *  so Mars looks identical every time you reload instead of reshuffling. */
function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** Turn a string like "mars" into a number we can use as a seed. */
function hashString(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Lighten (amount > 0) or darken (amount < 0) a "#rrggbb" color. amount: -1..1 */
export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount)),
  )
  return `rgb(${r},${g},${b})`
}

/** Paint an ellipse. Drawn 3 times (shifted left/right by the full width) so
 *  blobs near the edge wrap around the sphere without a visible seam. */
function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, alpha: number) {
  const W = ctx.canvas.width
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  for (const dx of [-W, 0, W]) {
    ctx.beginPath()
    ctx.ellipse(x + dx, y, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** Draw some shapes on a separate layer, then paste it on blurred. Blurring
 *  ONE finished layer is fast; blurring thousands of shapes one by one
 *  froze the page. */
function blurredLayer(ctx: CanvasRenderingContext2D, px: number, draw: (layer: CanvasRenderingContext2D) => void) {
  const { ctx: layer } = makeCanvas(ctx.canvas.width, ctx.canvas.height)
  draw(layer)
  ctx.filter = `blur(${px}px)`
  ctx.drawImage(layer.canvas, 0, 0)
  ctx.filter = 'none'
}

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d')! }
}

function toTexture(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace // tell three.js these are normal screen colors
  tex.anisotropy = 8 // keeps the texture sharp when seen at an angle
  return tex
}

// ── Surface painters ────────────────────────────────────────────────────────

// Bodies drawn as horizontal cloud bands, and how strong the stripes are.
const BANDED: Record<string, number> = {
  jupiter: 0.35, saturn: 0.18, neptune: 0.12, uranus: 0.05, venus: 0.08, titan: 0.05,
}

function paintBands(ctx: CanvasRenderingContext2D, color: string, contrast: number, rand: () => number) {
  const { width: W, height: H } = ctx.canvas
  // Adding three sine waves with random frequencies gives irregular stripes.
  const f = [0.02 + rand() * 0.06, 0.05 + rand() * 0.15, 0.2 + rand() * 0.4]
  const p = [rand() * 6, rand() * 6, rand() * 6]
  for (let y = 0; y < H; y++) {
    const v = Math.sin(y * f[0] + p[0]) * 0.5 + Math.sin(y * f[1] + p[1]) * 0.3 + Math.sin(y * f[2] + p[2]) * 0.2
    const fromEquator = Math.abs(y / H - 0.5) * 2 // 0 at equator, 1 at poles
    ctx.fillStyle = shade(color, v * contrast - fromEquator ** 2 * 0.2)
    ctx.fillRect(0, y, W, 1)
  }
  // Long thin streaks = storms being stretched out by fast winds.
  for (let i = 0; i < 300; i++) {
    blob(ctx, rand() * W, rand() * H, 10 + rand() * 50, 1 + rand() * 3, shade(color, (rand() - 0.5) * contrast * 1.5), 0.25)
  }
}

function paintRocky(ctx: CanvasRenderingContext2D, color: string, rand: () => number) {
  const { width: W, height: H } = ctx.canvas
  ctx.fillStyle = color
  ctx.fillRect(0, 0, W, H)
  // Thousands of soft blotches; rand()**3 makes most small and a few large.
  for (let i = 0; i < 1400; i++) {
    const r = 1 + rand() ** 3 * 28
    blob(ctx, rand() * W, rand() * H, r, r * (0.6 + rand() * 0.4), shade(color, (rand() - 0.5) * 0.5), 0.15 + rand() * 0.25)
  }
}

function paintEarth(ctx: CanvasRenderingContext2D, rand: () => number) {
  const { width: W, height: H } = ctx.canvas
  ctx.fillStyle = '#1f4f9e'
  ctx.fillRect(0, 0, W, H)
  // Continents: clusters of overlapping green/brown blobs.
  const land = ['#3c7a3a', '#56803c', '#8a7d52']
  for (let c = 0; c < 9; c++) {
    const cx = rand() * W
    const cy = H * (0.2 + rand() * 0.6)
    for (let i = 0; i < 45; i++) {
      blob(ctx, cx + (rand() - 0.5) * 90, cy + (rand() - 0.5) * 50, 4 + rand() * 14, 3 + rand() * 10, land[Math.floor(rand() * 3)], 0.9)
    }
  }
  paintIceCaps(ctx, 22, 26, rand)
  // Clouds: many faint streaks, blurred so they look wispy instead of like stickers.
  blurredLayer(ctx, 3, (layer) => {
    for (let i = 0; i < 450; i++) blob(layer, rand() * W, H * (0.1 + rand() * 0.8), 8 + rand() * 34, 2 + rand() * 5, '#ffffff', 0.18)
  })
}

/** Polar ice. A flat-map row at the very top/bottom squeezes into a single
 *  point on the sphere, so blobs there made a "starburst". Instead: a solid
 *  band, with a wobbly edge drawn a little lower down. */
function paintIceCaps(ctx: CanvasRenderingContext2D, north: number, south: number, rand: () => number) {
  const { width: W, height: H } = ctx.canvas
  ctx.fillStyle = '#f2f6fa'
  ctx.fillRect(0, 0, W, north)
  ctx.fillRect(0, H - south, W, south)
  for (let x = 0; x < W; x += 10) {
    blob(ctx, x, north, 9, 3 + rand() * 6, '#f2f6fa', 1)
    blob(ctx, x, H - south, 9, 3 + rand() * 6, '#f2f6fa', 1)
  }
}

function paintSun(ctx: CanvasRenderingContext2D, rand: () => number) {
  const { width: W, height: H } = ctx.canvas
  ctx.fillStyle = '#ffb43c'
  ctx.fillRect(0, 0, W, H)
  // "Granulation": the bubbling look of the Sun's boiling surface.
  // Small and faint, then blurred, so it reads as texture, not spots.
  blurredLayer(ctx, 1.5, (layer) => {
    for (let i = 0; i < 6000; i++) {
      const r = 0.8 + rand() * 2.2
      blob(layer, rand() * W, rand() * H, r, r, rand() > 0.5 ? '#ffd27a' : '#f59a2a', 0.22)
    }
  })
  // A few dark sunspots near the equator.
  for (let i = 0; i < 6; i++) blob(ctx, rand() * W, H * (0.38 + rand() * 0.24), 3 + rand() * 4, 2 + rand() * 3, '#b4520f', 0.7)
}

const textureCache = new Map<string, THREE.Texture>()

/** The painted surface for any body (made once, then reused). */
export function planetTexture(body: Body): THREE.Texture {
  const cached = textureCache.get(body.id)
  if (cached) return cached

  const { canvas, ctx } = makeCanvas(1024, 512) // 2:1 = how a globe unrolls flat
  const rand = seeded(hashString(body.id))

  if (body.type === 'star') paintSun(ctx, rand)
  else if (body.id === 'earth') paintEarth(ctx, rand)
  else if (body.id in BANDED) paintBands(ctx, body.color, BANDED[body.id], rand)
  else paintRocky(ctx, body.color, rand)

  // A few signature features.
  if (body.id === 'jupiter') {
    blob(ctx, 300, 330, 46, 22, '#b8573a', 0.9) // the Great Red Spot
    blob(ctx, 300, 330, 28, 12, '#d47a55', 0.8)
  }
  if (body.id === 'neptune') blob(ctx, 600, 200, 30, 16, '#24357f', 0.8) // the Great Dark Spot
  if (body.id === 'mars') paintIceCaps(ctx, 16, 12, rand)

  const tex = toTexture(canvas)
  textureCache.set(body.id, tex)
  return tex
}

// ── Saturn's rings ──────────────────────────────────────────────────────────

/** Ring size as multiples of the planet's radius. */
export const RING_INNER = 1.25
export const RING_OUTER = 2.3

let ringTex: THREE.Texture | null = null

/** three.js's RingGeometry maps its texture across a square as wide as the
 *  ring, so drawing circles centered on a square canvas lines up perfectly. */
export function ringTexture() {
  if (ringTex) return ringTex
  const S = 1024
  const c = S / 2
  const { canvas, ctx } = makeCanvas(S, S)
  const rand = seeded(42)
  const inner = (RING_INNER / RING_OUTER) * c
  ctx.lineWidth = 1.5
  for (let r = inner; r < c; r += 1) {
    const f = (r - inner) / (c - inner) // 0 at the inner edge, 1 at the outer
    let alpha = 0.35 + rand() * 0.5
    if (f > 0.56 && f < 0.62) alpha *= 0.06 // the Cassini Division (a real gap)
    if (f > 0.93) alpha *= (1 - f) / 0.07 // fade out at the edge
    ctx.globalAlpha = alpha
    ctx.strokeStyle = shade('#cdb98a', rand() * 0.35 - 0.1)
    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ringTex = toTexture(canvas)
  return ringTex
}

// ── The Sun's glow ──────────────────────────────────────────────────────────

let glowTex: THREE.Texture | null = null

/** A soft radial gradient: bright center fading to transparent. */
export function glowTexture() {
  if (glowTex) return glowTex
  const S = 256
  const { canvas, ctx } = makeCanvas(S, S)
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(255,245,210,1)')
  g.addColorStop(0.2, 'rgba(255,205,100,0.6)')
  g.addColorStop(0.5, 'rgba(255,150,40,0.15)')
  g.addColorStop(1, 'rgba(255,120,20,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  glowTex = toTexture(canvas)
  return glowTex
}

// ── Atmosphere halos ────────────────────────────────────────────────────────

const ATMOSPHERE_COLOR: Record<string, string> = {
  earth: '#6fb6ff', venus: '#ffdca0', mars: '#ff9a6a', titan: '#ffb347',
  jupiter: '#ffe2b8', saturn: '#fff0c0', uranus: '#b8f4ff', neptune: '#7fa6ff',
}

/** How much bigger the glow shell is than the planet. */
export const ATMOSPHERE_SCALE = 1.15

/** A soft haze around bodies with real air. Uses a tiny custom SHADER:
 *  a program that runs on the graphics card for every pixel.
 *
 *  We draw the INSIDE (back faces) of a sphere slightly bigger than the
 *  planet. The planet hides the middle, so only a ring around the edge shows.
 *  The shader makes that ring brightest right at the planet's edge (where you
 *  look through the most air) and fade to nothing at the shell's edge, so
 *  there's no hard outline. */
export function atmosphereMaterial(body: Body): THREE.ShaderMaterial | null {
  const atm = body.atmosphere
  if (!atm || atm.pressureBar < 0.001) return null
  // Thicker air → stronger glow. log10 squashes 0.006 bar (Mars) to 92 bar (Venus).
  let strength = THREE.MathUtils.clamp(0.4 + 0.3 * Math.log10(atm.pressureBar * 1000), 0.3, 1.5)
  // Small moons are seen from far away, where a strong halo looks like an outline.
  if (body.type === 'moon') strength *= 0.5
  // Geometry: on a line of sight that just grazes the planet, this is the
  // value dot(normal, view) has on the shell. We use it to scale 0 → 1.
  const planetEdge = Math.sqrt(1 - 1 / ATMOSPHERE_SCALE ** 2)
  return new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(ATMOSPHERE_COLOR[body.id] ?? body.color) },
      strength: { value: strength },
      planetEdge: { value: planetEdge },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vToCamera;
      varying float vSunlit;
      void main() {
        vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vToCamera = normalize(-viewPos.xyz);
        // The Sun sits at the world's origin, so the direction to it from
        // this point is just -worldPosition. +1 = facing the Sun, -1 = away.
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
        vSunlit = dot(worldNormal, normalize(-worldPos));
        gl_Position = projectionMatrix * viewPos;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 glowColor;
      uniform float strength;
      uniform float planetEdge;
      varying vec3 vNormal;
      varying vec3 vToCamera;
      varying float vSunlit;
      void main() {
        // Back faces point away from us, so this is 0 at the shell's outer
        // edge and grows toward the planet.
        float facing = -dot(vNormal, vToCamera);
        float glow = clamp(facing / planetEdge, 0.0, 1.0); // 0 outer edge → 1 planet edge
        // Air glows where sunlight hits it; the night side is only faintly lit.
        float daylight = 0.15 + 0.85 * smoothstep(-0.3, 0.5, vSunlit);
        gl_FragColor = vec4(glowColor, pow(glow, 2.5) * strength * 0.8 * daylight);
      }`,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending, // light adds up, like real glow
    depthWrite: false,
  })
}

// ── Axial tilt (real values, degrees) ───────────────────────────────────────
// Uranus at 98° rolls on its side; Venus at 177° is upside down and spins backward.
export const AXIAL_TILT_DEG: Record<string, number> = {
  sun: 7.25, mercury: 0.03, venus: 177.4, earth: 23.4, moon: 6.7, mars: 25.2,
  jupiter: 3.1, saturn: 26.7, titan: 0.3, uranus: 97.8, neptune: 28.3, pluto: 122.5,
}
