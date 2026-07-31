/**
 * NEXUS IQ — DEVICE QUALITY TIERS
 * ------------------------------------------------------------------
 * Decided once at boot, readable everywhere. A runtime FPS probe can
 * demote a tier live (see useAutoQuality) so a struggling device degrades
 * gracefully instead of stuttering through the whole cinematic.
 */

export type TierId = 'A' | 'B' | 'C'

/** True when ?tier= pinned the quality, which also disables auto-demotion. */
export const TIER_FORCED =
  typeof window !== 'undefined' &&
  /^[ABC]$/.test(new URLSearchParams(window.location.search).get('tier')?.toUpperCase() ?? '')

export interface Tier {
  id: TierId
  /** Real refraction is the single most expensive thing in the scene. */
  transmission: boolean
  transmissionSamples: number
  transmissionResolution: number
  backside: boolean
  dpr: [number, number]
  motes: number
  coreShells: number
  /** Hardware MSAA sample count on the composer buffer. 0 disables it. */
  msaa: number
  dof: boolean
  chromaticAberration: boolean
  grain: boolean
  envResolution: number
}

export const TIERS: Record<TierId, Tier> = {
  A: {
    id: 'A',
    transmission: true,
    transmissionSamples: 10,
    transmissionResolution: 512,
    backside: true,
    dpr: [1, 2],
    motes: 900,
    coreShells: 3,
    msaa: 4,
    dof: true,
    chromaticAberration: true,
    grain: true,
    envResolution: 256,
  },
  B: {
    id: 'B',
    transmission: true,
    transmissionSamples: 6,
    transmissionResolution: 384,
    backside: false,
    dpr: [1, 1.75],
    motes: 420,
    coreShells: 2,
    msaa: 2,
    dof: true,
    chromaticAberration: true,
    grain: true,
    envResolution: 128,
  },
  C: {
    id: 'C',
    transmission: false,
    transmissionSamples: 0,
    transmissionResolution: 0,
    backside: false,
    dpr: [1, 1.5],
    motes: 200,
    coreShells: 2,
    msaa: 0,
    dof: false,
    chromaticAberration: false,
    grain: false,
    envResolution: 128,
  },
}

/**
 * Best-effort capability read. We deliberately start conservative on
 * mobile: a phone that can handle tier A gets promoted by the FPS probe
 * within a couple of seconds, which is far less noticeable than a
 * flagship-looking scene dropping frames on a mid-range device.
 */
export function detectTier(): TierId {
  if (typeof window === 'undefined') return 'B'

  // Explicit override, e.g. ?tier=A — useful for pinning quality on a known
  // machine, and for QA on software renderers that would otherwise be
  // detected as tier C.
  const forced = new URLSearchParams(window.location.search).get('tier')?.toUpperCase()
  if (forced === 'A' || forced === 'B' || forced === 'C') return forced

  const canvas = document.createElement('canvas')
  const gl = (canvas.getContext('webgl2') ||
    canvas.getContext('webgl')) as WebGLRenderingContext | null

  if (!gl) return 'C'

  let renderer = ''
  const dbg = gl.getExtension('WEBGL_debug_renderer_info')
  if (dbg) renderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
  renderer = renderer.toLowerCase()

  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  const cores = navigator.hardwareConcurrency ?? 4
  const mobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent)
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false

  // Known-weak software / integrated paths.
  if (/swiftshader|llvmpipe|software|mali-4|adreno \(tm\) 3/.test(renderer)) return 'C'
  if (mem <= 2 || cores <= 2) return 'C'

  if (mobile || coarse) {
    // Recent Apple silicon phones comfortably run tier A.
    const modernApple = /apple gpu|apple a1[5-9]|apple m/.test(renderer)
    if (modernApple && mem >= 4) return 'A'
    return 'B'
  }

  return mem >= 8 && cores >= 8 ? 'A' : 'B'
}
