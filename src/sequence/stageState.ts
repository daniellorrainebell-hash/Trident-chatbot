/**
 * THE STAGE STATE
 * ------------------------------------------------------------------
 * A single mutable object that GSAP tweens and the 3D components read
 * inside useFrame. Deliberately *not* React state: animating 30 values at
 * 60fps through the reconciler would cost more than the rendering does.
 *
 * Discrete, low-frequency events (captions, phase changes) go through the
 * zustand store instead.
 */

export interface CameraState {
  /** Orbit radius from the core. */
  radius: number
  /** Azimuth, radians. */
  theta: number
  /** Elevation, radians (0 = equator). */
  phi: number
  /** Vertical offset of the look-at target. */
  targetY: number
  fov: number
  /** Handheld noise amplitude — 0 locks the camera off entirely. */
  handheld: number
  /** Manual orbit offsets applied in interactive mode. */
  userTheta: number
  userPhi: number
}

/**
 * The Sequence A logo lockup. Lives on the stage state rather than in React
 * so the director can treat the brand reveal as part of the same timeline
 * as everything else — the mark collapsing and the core igniting are one
 * continuous gesture, not two systems trying to stay in sync.
 */
export interface LogoState {
  opacity: number
  scale: number
  blur: number
  /** 0–1 position of the specular pass across the letterforms. */
  sweep: number
}

export interface StageState {
  logo: LogoState
  /** Sequence A */
  motes: number
  /** Sequence B */
  ignition: number
  shellEdges: number
  shellSolid: number
  lattice: number
  rings: number
  ringSpeed: number
  pulse: number
  /** Sequence C */
  systems: number
  sub: number[]
  thread: number[]
  /** Per-subsystem momentary flare, used during the workflow. */
  flare: number[]
  /** Sequence D */
  packet: number
  packetGain: number
  confirm: number
  /** Sequence E */
  recede: number
  /** Post */
  bloom: number
  vignette: number
  /** Global environment brightness — lets the whole scene breathe. */
  envIntensity: number

  cam: CameraState
}

export const createStageState = (): StageState => ({
  logo: { opacity: 0, scale: 1.06, blur: 14, sweep: 0 },
  motes: 0,
  ignition: 0,
  shellEdges: 0,
  shellSolid: 0,
  lattice: 0,
  rings: 0,
  ringSpeed: 0,
  pulse: 0,
  systems: 0,
  sub: [0, 0, 0, 0, 0],
  thread: [0, 0, 0, 0, 0],
  flare: [0, 0, 0, 0, 0],
  packet: -1,
  packetGain: 0,
  confirm: 0,
  recede: 0,
  bloom: 0.75,
  vignette: 0.55,
  envIntensity: 0,
  cam: {
    radius: 1.9,
    theta: -0.55,
    phi: 0.02,
    targetY: 0,
    fov: 30,
    handheld: 1,
    userTheta: 0,
    userPhi: 0,
  },
})

/** The live instance. Imported directly by scene components. */
export const S: StageState = createStageState()

/** Restores the opening condition without breaking the object identity. */
export function resetStageState() {
  const fresh = createStageState()
  Object.assign(S, fresh, {
    sub: [...fresh.sub],
    thread: [...fresh.thread],
    flare: [...fresh.flare],
    logo: S.logo,
    cam: S.cam,
  })
  Object.assign(S.logo, fresh.logo)
  Object.assign(S.cam, fresh.cam)
}
