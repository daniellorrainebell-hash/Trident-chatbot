import * as THREE from 'three'

/**
 * PROCEDURAL CIRCUITRY
 * ------------------------------------------------------------------
 * Generates the copper layer for one glass wafer as a canvas texture.
 *
 * The routing is real Manhattan/45° PCB routing — orthogonal runs with
 * chamfered corners, pads at the terminations, vias where a net drops to
 * the layer below. That constraint is the whole reason this reads as
 * engineered rather than decorative: random curves look generative, right
 * angles and 45s look designed.
 *
 * Three channels do three jobs, which is what lets one cheap texture drive
 * everything the shader needs:
 *   R — copper mask (is this pixel a trace?)
 *   G — normalised distance along the net, offset per net, so a shader can
 *       run a pulse *along the actual route* instead of across the plane
 *   B — pads and vias, so terminations can burn brighter than the runs
 */

export interface TraceOptions {
  size?: number
  /** Grid divisions across the wafer. Higher = finer, busier circuitry. */
  grid?: number
  nets?: number
  seed?: number
  /** Radius of the clear zone at the centre, where the die sits. */
  coreRadius?: number
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Pt = { x: number; y: number }

/**
 * Routes one net from an edge toward the die.
 *
 * Alternates axis-aligned runs with 45° chamfers, which is exactly how a
 * real board is routed and why the result reads as engineered.
 */
function routeNet(
  start: Pt,
  target: Pt,
  cell: number,
  rand: () => number,
  coreRadius: number,
): Pt[] {
  const pts: Pt[] = [{ ...start }]
  let cur = { ...start }
  let guard = 0

  while (guard++ < 40) {
    const dx = target.x - cur.x
    const dy = target.y - cur.y
    const dist = Math.hypot(dx, dy)
    if (dist <= coreRadius) break

    // Chamfer: a short 45° step, the signature move of hand-routed copper.
    if (rand() < 0.42 && Math.abs(dx) > cell && Math.abs(dy) > cell) {
      const step = cell * (1 + Math.floor(rand() * 2))
      const s = Math.min(step, Math.abs(dx), Math.abs(dy))
      cur = { x: cur.x + Math.sign(dx) * s, y: cur.y + Math.sign(dy) * s }
      pts.push({ ...cur })
      continue
    }

    // Otherwise a straight run along whichever axis is furthest out.
    const horizontal = Math.abs(dx) > Math.abs(dy)
    const span = horizontal ? Math.abs(dx) : Math.abs(dy)
    const run = Math.min(span, cell * (1 + Math.floor(rand() * 4)))
    cur = horizontal
      ? { x: cur.x + Math.sign(dx) * run, y: cur.y }
      : { x: cur.x, y: cur.y + Math.sign(dy) * run }
    pts.push({ ...cur })
  }

  return pts
}

function polylineLength(pts: Pt[]) {
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  }
  return total
}

export function createTraceTexture(opts: TraceOptions = {}): THREE.CanvasTexture {
  const size = opts.size ?? 1024
  const grid = opts.grid ?? 40
  const netCount = opts.nets ?? 26
  const rand = mulberry32(opts.seed ?? 1)
  const cell = size / grid
  const coreRadius = (opts.coreRadius ?? 0.14) * size

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, size, size)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const centre = { x: size / 2, y: size / 2 }
  const margin = cell * 2

  for (let n = 0; n < netCount; n++) {
    // Enter from a random edge, snapped to the routing grid.
    const edge = Math.floor(rand() * 4)
    const along = margin + rand() * (size - margin * 2)
    const snap = (v: number) => Math.round(v / cell) * cell
    const start: Pt =
      edge === 0
        ? { x: snap(along), y: margin }
        : edge === 1
          ? { x: size - margin, y: snap(along) }
          : edge === 2
            ? { x: snap(along), y: size - margin }
            : { x: margin, y: snap(along) }

    // Aim at a point just off the die so nets fan in rather than converging
    // on one pixel — a real board never has 26 traces meeting at a point.
    const angle = rand() * Math.PI * 2
    const spread = coreRadius * (0.85 + rand() * 0.5)
    const target: Pt = {
      x: centre.x + Math.cos(angle) * spread,
      y: centre.y + Math.sin(angle) * spread,
    }

    const pts = routeNet(start, target, cell, rand, coreRadius * 0.9)
    if (pts.length < 2) continue

    const total = polylineLength(pts)
    if (total < cell * 3) continue

    // Per-net phase offset, so pulses on different nets never march in step.
    const phase = rand()
    const width = rand() < 0.22 ? 5.5 : 3.2

    let travelled = 0
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      const segLen = Math.hypot(b.x - a.x, b.y - a.y)

      // Subdivide so the progress channel varies smoothly along the run.
      const steps = Math.max(2, Math.ceil(segLen / 12))
      for (let s = 0; s < steps; s++) {
        const t0 = s / steps
        const t1 = (s + 1) / steps
        const p0 = { x: a.x + (b.x - a.x) * t0, y: a.y + (b.y - a.y) * t0 }
        const p1 = { x: a.x + (b.x - a.x) * t1, y: a.y + (b.y - a.y) * t1 }

        const progress = (travelled + segLen * t1) / total
        const g = Math.round((((progress + phase) % 1) * 255))

        ctx.strokeStyle = `rgb(255, ${g}, 0)`
        ctx.lineWidth = width
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.stroke()
      }
      travelled += segLen
    }

    // Termination pad at the edge, and a via where the net reaches the die.
    const drawNode = (p: Pt, r: number) => {
      ctx.fillStyle = 'rgb(255,255,255)'
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    drawNode(pts[0], width * 1.9)
    drawNode(pts[pts.length - 1], width * 1.5)

    // Occasional inline via — the detail that says "this board has layers".
    if (rand() < 0.5 && pts.length > 3) {
      const idx = 1 + Math.floor(rand() * (pts.length - 2))
      drawNode(pts[idx], width * 1.3)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.NoColorSpace
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}
