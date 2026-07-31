import * as THREE from 'three'
import { SERVICES } from '../config/brand'

/**
 * Spatial layout of the core.
 *
 * The object is a stack of glass circuit wafers with a die at its heart —
 * one layer per service system. That mapping is the point: a service coming
 * online is a layer of the object lighting up, not a separate thing
 * appearing beside it. Five layers, one machine.
 */

/** Wafer edge length. Sized so the stack fills ~65% of a 9:16 frame. */
export const WAFER_SIZE = 1.5
export const WAFER_CORNER = 0.12

/** Vertical gap between layers. Wide enough to read as separate plates. */
export const LAYER_GAP = 0.25

/** The die at the centre of the stack. */
export const DIE_SIZE = 0.3

/** Which layer each service occupies, top to bottom. */
export const LAYER_Y = SERVICES.map(
  (_, i) => (i - (SERVICES.length - 1) / 2) * -LAYER_GAP,
)

/** Total height of the assembled stack. */
export const STACK_HEIGHT = (SERVICES.length - 1) * LAYER_GAP

/**
 * The die sits *on top of* the stack, the way a processor is mounted on a
 * board, rather than buried in the middle of it. At the raised camera
 * angles this piece uses, a die inside the stack is permanently occluded by
 * the layers above it — and it is meant to be the hero of the frame.
 */
export const DIE_Y = LAYER_Y[0] + 0.055

/**
 * The workflow path — the route a real enquiry travels.
 *
 * It arrives at the edge of the top layer, routes inward across the copper,
 * drops through a via to the layer below, and repeats until it reaches the
 * die. Descending through the stack is what makes the process legible: you
 * can see the enquiry getting deeper into the system.
 */
export function buildWorkflowCurve() {
  const pts: THREE.Vector3[] = []
  const reach = WAFER_SIZE * 0.42

  // Arrives from beyond the board and lands on the processor.
  pts.push(new THREE.Vector3(-reach * 2.4, DIE_Y + 0.55, reach * 1.1))
  pts.push(new THREE.Vector3(-reach * 0.5, DIE_Y + 0.12, reach * 0.3))
  pts.push(new THREE.Vector3(0, DIE_Y + 0.02, 0))

  // Then propagates down through every layer in turn.
  LAYER_Y.forEach((y, i) => {
    // Alternate which side each layer is entered from, so the descent reads
    // as routing rather than a straight drop.
    const side = i % 2 === 0 ? 1 : -1
    const lift = 0.012

    pts.push(new THREE.Vector3(-reach * side, y + lift, reach * 0.55 * side))
    pts.push(new THREE.Vector3(-reach * 0.25 * side, y + lift, reach * 0.2 * side))
    // The via: straight down into the next layer.
    pts.push(new THREE.Vector3(reach * 0.18 * side, y + lift, -reach * 0.12 * side))
  })

  // Settles at the base of the stack.
  pts.push(new THREE.Vector3(0, LAYER_Y[LAYER_Y.length - 1] - 0.04, 0))

  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.12)
}

/**
 * Normalised progress at which the packet is over each layer, so the
 * director can flare the right service at the moment the signal reaches it.
 */
export const WORKFLOW_LAYER_T = LAYER_Y.map((_, i) => {
  const perLayer = 1 / (LAYER_Y.length + 1)
  return perLayer * (i + 0.75)
})
