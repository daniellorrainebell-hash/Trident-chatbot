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
 * Every net is routed once in a single quadrant and then stamped four times
 * at 90° rotations. Four-fold rotational symmetry is how real dies are laid
 * out, and it is what makes the board read as deliberate rather than
 * scattered — the eye finds the centre immediately.
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
  const size = opts.size ?? 2048
  const grid = opts.grid ?? 40
  // Per quadrant — the drawn total is four times this.
  const netCount = opts.nets ?? 7
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

  const cx = size / 2
  const cy = size / 2
  /** Rotate a point about the centre by k × 90°. */
  const rot = (p: Pt, k: number): Pt => {
    let { x, y } = p
    for (let i = 0; i < k; i++) {
      const dx = x - cx
      const dy = y - cy
      x = cx + dy
      y = cy - dx
    }
    return { x, y }
  }

  for (let n = 0; n < netCount; n++) {
    // Enter from an edge of one quadrant, snapped to the routing grid.
    // The 90° stamps below fill the other three.
    const snap = (v: number) => Math.round(v / cell) * cell
    const along = margin + rand() * (size / 2 - margin)
    const start: Pt =
      rand() < 0.5
        ? { x: snap(along), y: margin } // top edge, left half
        : { x: margin, y: snap(along) } // left edge, top half

    // Aim at a point just off the die so nets fan in rather than converging
    // on one pixel — a real board never has 26 traces meeting at a point.
    const angle = -Math.PI * 0.5 + rand() * Math.PI * 0.5
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
    // Wider than a real board's ratio on purpose: a hairline trace does
    // not survive minification, and a broken-up trace reads as beads.
    const width = (rand() < 0.22 ? 5.4 : 3.4) * (size / 1024)
    const viaIndex = rand() < 0.5 && pts.length > 3
      ? 1 + Math.floor(rand() * (pts.length - 2))
      : -1

    for (let k = 0; k < 4; k++) {
      let travelled = 0

      for (let i = 1; i < pts.length; i++) {
        const a = rot(pts[i - 1], k)
        const b = rot(pts[i], k)
        const segLen = Math.hypot(b.x - a.x, b.y - a.y)
        if (segLen < 0.5) continue

        const p0 = travelled / total
        const p1 = (travelled + segLen) / total
        travelled += segLen

        /**
         * Stroke the whole run in one pass with a gradient carrying the
         * progress value, rather than as a chain of short constant-value
         * strokes.
         *
         * Short strokes fail two ways at once: with round caps, any segment
         * shorter than its own width renders as a dot, and a constant value
         * per segment quantises the progress channel into visible blocks, so
         * the charge moves along the trace in steps instead of flowing.
         */
        const drawRun = (
          from: Pt,
          to: Pt,
          gFrom: number,
          gTo: number,
        ) => {
          const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
          grad.addColorStop(0, `rgb(255, ${Math.round(gFrom * 255)}, 0)`)
          grad.addColorStop(1, `rgb(255, ${Math.round(gTo * 255)}, 0)`)
          ctx.strokeStyle = grad
          ctx.lineWidth = width
          ctx.beginPath()
          ctx.moveTo(from.x, from.y)
          ctx.lineTo(to.x, to.y)
          ctx.stroke()
        }

        const g0 = (p0 + phase) % 1
        const g1raw = p1 + phase
        const g1 = g1raw % 1

        if (g1 >= g0) {
          drawRun(a, b, g0, g1)
        } else {
          // The value wraps inside this run. Split it at the wrap point so
          // the gradient never sweeps backwards through the whole range.
          const t = (1 - g0) / (g1raw - Math.floor(g1raw) + (1 - g0))
          const mid = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
          drawRun(a, mid, g0, 1)
          drawRun(mid, b, 0, g1)
        }
      }

      // Termination pad at the edge, and a via where the net reaches the die.
      const drawNode = (p: Pt, r: number) => {
        ctx.fillStyle = 'rgb(255,255,255)'
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Pads stay close to the trace width. Oversized ones read as lumps
      // strung along the routing rather than as terminations.
      drawNode(rot(pts[0], k), width * 1.15)
      drawNode(rot(pts[pts.length - 1], k), width * 0.95)

      // Occasional inline via — the detail that says "this board has layers".
      if (viaIndex >= 0) drawNode(rot(pts[viaIndex], k), width * 0.85)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.NoColorSpace
  texture.anisotropy = 16
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}
