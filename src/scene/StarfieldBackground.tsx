import { useEffect, useRef } from 'react'
import { useExperience } from '../state/useExperience'

/**
 * STARFIELD BACKGROUND
 * ------------------------------------------------------------------
 * A 2D canvas environment sitting behind the WebGL scene: parallax star
 * layers, a baked nebula, and a constellation of connecting lines with
 * travelling pulses.
 *
 * Three things had to change from a standalone drop-in to make it work
 * here, and each one matters:
 *
 * 1. It is sized to the 9:16 stage, not to the window. Fixed-to-viewport
 *    would spill outside the frame on desktop and — more importantly —
 *    wouldn't be part of what a screen recording captures.
 *
 * 2. Star sprites are baked once instead of built per frame. The original
 *    called createRadialGradient for every star every frame plus shadowBlur
 *    on the near layer, which is a few hundred gradient allocations and
 *    dozens of blur passes at 60fps. That is survivable on its own, but
 *    this canvas runs *alongside* a WebGL scene doing transmission, depth
 *    of field and bloom, and the two compete for the same frame budget.
 *    Baked sprites turn all of it into drawImage calls.
 *
 * 3. Resolution and star count follow the quality tier, and the canvas
 *    renders below the scene's DPR. It is a soft background — nobody will
 *    ever notice it is not pixel-sharp, and on a phone those pixels are
 *    better spent on the object.
 */

// ─── Constants ────────────────────────────────────────────────────────────────
const STAR_COUNT_DESKTOP = 220
const STAR_COUNT_MOBILE = 120
const MOBILE_BREAKPOINT = 768
/** Deliberately below the scene's DPR — see note 3 above. */
const MAX_DPR = 1.5
const NEBULA_COUNT = 6
const CONNECT_DIST = 0.24 // fraction of min(W,H) for neural-network lines

/**
 * Halo multipliers are kept moderate. Pushed higher the near layer stops
 * reading as stars and becomes a field of soft smudges — the sprite has no
 * hard core left at that scale.
 */
const LAYERS = [
  { share: 0.5, speed: 0.01, sizeMin: 0.35, sizeMax: 1.0, alpha: 0.46, halo: 2.2 }, // far
  { share: 0.3, speed: 0.02, sizeMin: 0.9, sizeMax: 1.7, alpha: 0.77, halo: 3.0 }, // mid
  { share: 0.2, speed: 0.032, sizeMin: 1.5, sizeMax: 2.4, alpha: 1.0, halo: 3.6 }, // near
] as const

const STAR_COLORS = ['255,255,255', '120,200,255', '180,220,255'] as const

// ─── Types ────────────────────────────────────────────────────────────────────
interface Star {
  x: number
  y: number
  vx: number
  vy: number
  layer: number
  size: number
  colorIndex: number
  twinklePhase: number
  twinkleSpeed: number
}

interface NebulaBlob {
  x: number
  y: number
  r: number
  alpha: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildStars(count: number): Star[] {
  const stars: Star[] = []
  LAYERS.forEach((L, li) => {
    const n = li === LAYERS.length - 1 ? count - stars.length : Math.round(count * L.share)
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2
      stars.push({
        x: Math.random(),
        y: Math.random(),
        vx: Math.cos(angle) * L.speed,
        vy: Math.sin(angle) * L.speed,
        layer: li,
        size: L.sizeMin + Math.random() * (L.sizeMax - L.sizeMin),
        colorIndex: Math.random() < 0.3 ? 1 : Math.random() < 0.55 ? 2 : 0,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.3 + Math.random() * 0.8,
      })
    }
  })
  return stars
}

function buildNebula(): NebulaBlob[] {
  return Array.from({ length: NEBULA_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.22 + Math.random() * 0.24,
    alpha: 0.015 + Math.random() * 0.035,
  }))
}

/**
 * One baked sprite per (layer, colour): halo gradient with a bright core.
 * Drawn with globalAlpha for the twinkle, so nothing is allocated per frame.
 */
const SPRITE_PX = 64

function buildSprites(): HTMLCanvasElement[][] {
  return LAYERS.map((_, li) =>
    STAR_COLORS.map((rgb) => {
      const c = document.createElement('canvas')
      c.width = c.height = SPRITE_PX
      const g = c.getContext('2d')!
      const mid = SPRITE_PX / 2

      const grd = g.createRadialGradient(mid, mid, 0, mid, mid, mid)
      // The near layer carries a broader, brighter falloff — this is what
      // the original achieved with shadowBlur, baked in for free.
      const lift = li === 2 ? 1 : li === 1 ? 0.85 : 0.6
      grd.addColorStop(0, `rgba(${rgb},${lift})`)
      grd.addColorStop(0.3, `rgba(${rgb},${lift * 0.55})`)
      grd.addColorStop(1, `rgba(${rgb},0)`)
      g.fillStyle = grd
      g.fillRect(0, 0, SPRITE_PX, SPRITE_PX)

      // Solid core, sized relative to the halo so it survives scaling.
      const coreR = mid / LAYERS[li].halo
      g.fillStyle = `rgba(${rgb},1)`
      g.beginPath()
      g.arc(mid, mid, coreR, 0, Math.PI * 2)
      g.fill()

      return c
    }),
  )
}

/** Baked pulse dot for the connection lines. */
function buildPulseSprite(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = 32
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16)
  grd.addColorStop(0, 'rgba(160,210,255,1)')
  grd.addColorStop(1, 'rgba(160,210,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 32, 32)
  return c
}

function paintNebula(
  ctx: CanvasRenderingContext2D,
  blobs: NebulaBlob[],
  W: number,
  H: number,
): void {
  ctx.clearRect(0, 0, W, H)
  const base = Math.min(W, H)

  blobs.forEach((n) => {
    const r = n.r * base
    const grd = ctx.createRadialGradient(n.x * W, n.y * H, 0, n.x * W, n.y * H, r)
    grd.addColorStop(0, `rgba(30,70,190,${n.alpha})`)
    grd.addColorStop(0.5, `rgba(8,28,95,${n.alpha * 0.5})`)
    grd.addColorStop(1, 'rgba(8,28,95,0)')
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(n.x * W, n.y * H, r, 0, Math.PI * 2)
    ctx.fill()
  })

  // A pool of light where the object sits, baked into the same layer. The
  // subject needs something behind it or it reads as a cutout on a flat
  // field rather than an object in a space.
  const poolR = base * 0.85
  const pool = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, poolR)
  pool.addColorStop(0, 'rgba(26,86,156,0.16)')
  pool.addColorStop(0.45, 'rgba(14,48,96,0.08)')
  pool.addColorStop(1, 'rgba(8,28,95,0)')
  ctx.fillStyle = pool
  ctx.beginPath()
  ctx.arc(W * 0.5, H * 0.42, poolR, 0, Math.PI * 2)
  ctx.fill()
}

// ─── Component ────────────────────────────────────────────────────────────────
export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const tierId = useExperience((s) => s.tier.id)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const host = canvas.parentElement
    if (!host) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const nebulaCanvas = document.createElement('canvas')
    const nebulaCtx = nebulaCanvas.getContext('2d')!
    const blobs = buildNebula()
    const sprites = buildSprites()
    const pulseSprite = buildPulseSprite()

    // Tier C is already struggling for frame budget, so it gets the mobile
    // count and no connection pass at all.
    const budget = tierId === 'A' ? 1 : tierId === 'B' ? 0.75 : 0.5
    const connect = tierId !== 'C'

    let mobile = host.clientWidth < MOBILE_BREAKPOINT
    let stars = buildStars(
      Math.round((mobile ? STAR_COUNT_MOBILE : STAR_COUNT_DESKTOP) * budget),
    )
    let dpr = 1

    const resize = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (w <= 0 || h <= 0) return

      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      nebulaCanvas.width = canvas.width
      nebulaCanvas.height = canvas.height
      paintNebula(nebulaCtx, blobs, nebulaCanvas.width, nebulaCanvas.height)

      const nowMobile = w < MOBILE_BREAKPOINT
      if (nowMobile !== mobile) {
        mobile = nowMobile
        stars = buildStars(
          Math.round((mobile ? STAR_COUNT_MOBILE : STAR_COUNT_DESKTOP) * budget),
        )
      }
    }

    resize()
    // Observes the stage, not the window: the stage can change size without
    // the window doing so (browser chrome collapsing, orientation).
    const observer = new ResizeObserver(resize)
    observer.observe(host)

    const drawFrame = (t: number, dt: number) => {
      const W = canvas.width
      const H = canvas.height
      if (W === 0 || H === 0) return

      // Opaque base, then the baked nebula and pool.
      ctx.fillStyle = '#020818'
      ctx.fillRect(0, 0, W, H)
      if (nebulaCanvas.width > 0 && nebulaCanvas.height > 0) {
        ctx.drawImage(nebulaCanvas, 0, 0)
      }

      const base = Math.min(W, H)
      const connectPx = CONNECT_DIST * base

      // Move stars, wrap at edges.
      for (const s of stars) {
        s.x += s.vx * dt
        s.y += s.vy * dt
        if (s.x < -0.03) s.x = 1.03
        if (s.x > 1.03) s.x = -0.03
        if (s.y < -0.03) s.y = 1.03
        if (s.y > 1.03) s.y = -0.03
      }

      // Neural-network connecting lines with travelling pulses.
      if (connect) {
        const linkable = stars.filter((s) => s.layer >= 1) // mid + near connect
        for (let i = 0; i < linkable.length; i++) {
          const a = linkable[i]
          const ax = a.x * W
          const ay = a.y * H
          for (let j = i + 1; j < linkable.length; j++) {
            const b = linkable[j]
            const bx = b.x * W
            const by = b.y * H
            const dx = ax - bx
            const dy = ay - by
            const distSq = dx * dx + dy * dy
            // Compared squared — the square root was the single hottest
            // operation in the inner loop and it is not needed to reject.
            if (distSq >= connectPx * connectPx) continue

            const proximity = 1 - Math.sqrt(distSq) / connectPx
            const alpha = proximity * proximity * 0.28
            ctx.strokeStyle = `rgba(130,195,255,${alpha})`
            ctx.lineWidth = Math.max(0.8, proximity * 1.2) * dpr
            ctx.beginPath()
            ctx.moveTo(ax, ay)
            ctx.lineTo(bx, by)
            ctx.stroke()

            if (proximity > 0.4) {
              const pulseT = (t * 0.3 + i * 0.13 + j * 0.07) % 1
              const px = ax + (bx - ax) * pulseT
              const py = ay + (by - ay) * pulseT
              const r = 3 * dpr
              ctx.globalAlpha = Math.min(1, alpha * 2)
              ctx.drawImage(pulseSprite, px - r, py - r, r * 2, r * 2)
              ctx.globalAlpha = 1
            }
          }
        }
      }

      // Stars, drawn from baked sprites.
      for (const s of stars) {
        const L = LAYERS[s.layer]
        const twinkle = 0.65 + 0.35 * Math.sin(t * s.twinkleSpeed + s.twinklePhase)
        const alpha = Math.min(L.alpha * twinkle * 1.1, 1)
        const haloR = s.size * dpr * L.halo

        ctx.globalAlpha = alpha
        ctx.drawImage(
          sprites[s.layer][s.colorIndex],
          s.x * W - haloR,
          s.y * H - haloR,
          haloR * 2,
          haloR * 2,
        )
      }
      ctx.globalAlpha = 1
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0

    if (reducedMotion) {
      drawFrame(0, 0)
    } else {
      let last = performance.now()
      const loop = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now
        drawFrame(now / 1000, dt)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [tierId])

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />
}
