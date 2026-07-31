/**
 * NEXUS IQ — MOTION TIMING
 * ------------------------------------------------------------------
 * Every beat in the cinematic is defined here as { at, dur } in seconds.
 * The director builds one GSAP timeline from this map, so retuning the
 * pacing never means touching a component.
 *
 * FULL  — ~62s, the primary cinematic.
 * SHORT — ~22s, the Instagram Stories cut, built from the same components.
 */

export type Beat = { at: number; dur: number }

export interface Beats {
  total: number
  /** Sequence A — brand activation */
  motesIn: Beat
  logoIn: Beat
  logoSweep: Beat
  logoOut: Beat
  /** Sequence B — core reveal */
  ignite: Beat
  shellEdges: Beat
  shellSolid: Beat
  lattice: Beat
  rings: Beat
  firstPulse: Beat
  coreCaption: Beat
  /** Sequence C — subsystem activation */
  systemsReveal: Beat
  subFirst: number
  subStride: number
  subDur: number
  threadOffset: number
  threadDur: number
  captionHold: number
  systemPulse: Beat
  /** Sequence D — workflow */
  workflowCaption: Beat
  packet: Beat
  memoryPulse: Beat
  workflowCaption2: Beat
  /** Sequence E — payoff */
  recede: Beat
  endLogo: Beat
  endStatement: Beat
  endContact: Beat
  controls: number
}

export const FULL: Beats = {
  total: 62,

  motesIn: { at: 0.6, dur: 3.4 },
  logoIn: { at: 3.0, dur: 1.8 },
  logoSweep: { at: 4.7, dur: 1.5 },
  logoOut: { at: 7.4, dur: 1.5 },

  ignite: { at: 9.3, dur: 1.0 },
  shellEdges: { at: 10.1, dur: 1.3 },
  shellSolid: { at: 11.2, dur: 1.7 },
  lattice: { at: 13.0, dur: 2.2 },
  rings: { at: 15.0, dur: 2.6 },
  firstPulse: { at: 19.0, dur: 1.6 },
  coreCaption: { at: 20.0, dur: 3.4 },

  systemsReveal: { at: 24.0, dur: 1.8 },
  subFirst: 25.6,
  subStride: 3.3,
  subDur: 1.4,
  threadOffset: 0.7,
  threadDur: 1.3,
  captionHold: 2.5,
  systemPulse: { at: 41.0, dur: 1.6 },

  workflowCaption: { at: 42.2, dur: 3.0 },
  packet: { at: 42.9, dur: 9.6 },
  memoryPulse: { at: 47.4, dur: 1.5 },
  workflowCaption2: { at: 49.2, dur: 3.2 },

  recede: { at: 54.0, dur: 3.2 },
  endLogo: { at: 56.2, dur: 1.8 },
  endStatement: { at: 57.9, dur: 1.6 },
  endContact: { at: 59.3, dur: 1.6 },
  controls: 62.4,
}

export const SHORT: Beats = {
  total: 22,

  motesIn: { at: 0.2, dur: 1.6 },
  logoIn: { at: 0.6, dur: 1.1 },
  logoSweep: { at: 1.5, dur: 1.0 },
  logoOut: { at: 3.0, dur: 0.9 },

  ignite: { at: 4.0, dur: 0.7 },
  shellEdges: { at: 4.4, dur: 0.8 },
  shellSolid: { at: 5.0, dur: 1.1 },
  lattice: { at: 5.9, dur: 1.2 },
  rings: { at: 6.4, dur: 1.4 },
  firstPulse: { at: 7.6, dur: 1.1 },
  coreCaption: { at: 7.2, dur: 2.0 },

  systemsReveal: { at: 9.0, dur: 1.0 },
  // Overlapping waves rather than a strict sequence — the compression
  // reads as intentional density instead of a rushed queue.
  subFirst: 9.6,
  subStride: 0.95,
  subDur: 1.2,
  threadOffset: 0.5,
  threadDur: 1.0,
  captionHold: 1.15,
  systemPulse: { at: 14.4, dur: 1.1 },

  workflowCaption: { at: 14.8, dur: 1.9 },
  packet: { at: 14.9, dur: 3.4 },
  memoryPulse: { at: 16.6, dur: 1.0 },
  workflowCaption2: { at: 16.9, dur: 1.9 },

  recede: { at: 18.4, dur: 2.0 },
  endLogo: { at: 19.2, dur: 1.2 },
  endStatement: { at: 20.1, dur: 1.0 },
  endContact: { at: 20.9, dur: 1.0 },
  controls: 22.4,
}

export type CutId = 'full' | 'short'
export const CUTS: Record<CutId, Beats> = { full: FULL, short: SHORT }
