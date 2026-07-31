import * as THREE from 'three'
import { SERVICES } from '../config/brand'

/**
 * Spatial layout of the system. Kept in one place so the core, the
 * capsules, the threads and the workflow path can never disagree about
 * where anything is.
 */

export const CORE_RADIUS = 0.5
export const SHELL_SCALE_Y = 1.22

/**
 * The subsystem ring sits below the core's equator and is tilted, so the
 * camera reads it as a plane in space rather than a flat circle.
 *
 * The radius is a framing decision, not an arbitrary one. A 9:16 frame is
 * narrow: at the distance where the core still reads as a hero object, a
 * wider ring simply falls out of shot on both sides. This is the largest
 * radius that keeps all five capsules in frame with margin to spare.
 */
export const RING_RADIUS = 0.95
export const RING_Y = -0.16
export const RING_TILT = 0.26

/**
 * Capsule scale — a legibility decision. At the distance that frames the
 * whole ring, a capsule at its modelled size is under 10% of frame height
 * and its glyph is unreadable. The glyph has to carry meaning on a phone.
 */
export const CAPSULE_SCALE = 1.9
/** Half-height of the capsule body, before scaling. */
export const CAPSULE_HALF_HEIGHT = 0.2
/** Where the capsule footings sit, and therefore where the guide ring goes. */
export const CAPSULE_FOOT_Y = RING_Y - CAPSULE_HALF_HEIGHT * CAPSULE_SCALE

/**
 * Orbit rate, radians/sec. Shared by the capsules, the threads and the
 * workflow packet — they all live in the same rotating frame, so this has
 * to be one number rather than three that happen to agree.
 * Slow enough to read as orbit rather than spin.
 */
export const ORBIT_SPEED = 0.038
export const orbitAngle = (t: number) => t * ORBIT_SPEED

/** Local (untilted) position of subsystem i on the ring. */
export function subsystemLocalPosition(i: number, count = SERVICES.length) {
  // Offset so the first subsystem to activate is already swinging toward
  // the camera's opening angle rather than hidden behind the core.
  const a = (i / count) * Math.PI * 2 - Math.PI * 0.35
  return new THREE.Vector3(Math.cos(a) * RING_RADIUS, RING_Y, Math.sin(a) * RING_RADIUS)
}

export const SUBSYSTEM_POSITIONS = SERVICES.map((_, i) => subsystemLocalPosition(i))

/**
 * The workflow path — the route the enquiry packet actually travels.
 * It enters from off-frame, meets first contact, qualifies, reaches the
 * core, triggers follow-up, confirms, then schedules reputation.
 *
 * Indices refer to SERVICES order:
 *   0 voice · 1 speed · 2 chat · 3 reputation · 4 automation
 */
export const WORKFLOW_STOPS = [2, 0, -1, 1, 4, 3] as const

/** Builds a smooth curve through the workflow stops (-1 means the core). */
export function buildWorkflowCurve() {
  const pts: THREE.Vector3[] = []

  // Entry from beyond the frame edge, slightly above the ring plane.
  const first = SUBSYSTEM_POSITIONS[WORKFLOW_STOPS[0]].clone()
  pts.push(first.clone().multiplyScalar(2.9).setY(0.9))

  for (const stop of WORKFLOW_STOPS) {
    if (stop === -1) {
      pts.push(new THREE.Vector3(0, 0.02, 0))
    } else {
      const p = SUBSYSTEM_POSITIONS[stop].clone()
      // Lift slightly so the packet arcs over the capsules instead of
      // clipping straight through them.
      pts.push(p.clone().multiplyScalar(0.99).setY(p.y + 0.06))
    }
  }

  // Settle back toward the core rather than flying out of frame.
  pts.push(new THREE.Vector3(0, 0.05, 0).lerp(SUBSYSTEM_POSITIONS[3], 0.35))

  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35)
  return curve
}

/** Normalised progress along the workflow curve at which each stop lands. */
export const WORKFLOW_STOP_T = WORKFLOW_STOPS.map(
  (_, i) => (i + 1) / (WORKFLOW_STOPS.length + 1),
)
