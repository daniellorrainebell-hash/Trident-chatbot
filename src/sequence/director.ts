import gsap from 'gsap'
import { SERVICES, COPY } from '../config/brand'
import { CUTS, type Beats, type CutId } from '../config/timeline'
import { WORKFLOW_STOPS, WORKFLOW_STOP_T } from '../scene/layout'
import { S, resetStageState } from './stageState'
import { useExperience, type Caption } from '../state/useExperience'

/**
 * THE DIRECTOR
 * ------------------------------------------------------------------
 * Builds the entire cinematic as one GSAP timeline over the stage state.
 *
 * One clock is the whole architecture. Because every value in the piece is
 * a tween on this timeline, the sequence can be scrubbed, restarted,
 * paused, or rebuilt at a completely different tempo (the 22s cut) without
 * a single component knowing that anything changed.
 */

const setCaption = (c: Caption | null) => useExperience.getState().setCaption(c)

/** Captions appear and clear on the timeline, never on a stray timeout. */
function caption(tl: gsap.core.Timeline, at: number, hold: number, c: Caption) {
  tl.call(() => setCaption(c), undefined, at)
  tl.call(() => {
    // Only clear if we're still showing this one — protects against a
    // later caption that has already replaced it.
    if (useExperience.getState().caption?.key === c.key) setCaption(null)
  }, undefined, at + hold)
}

export interface DirectorHandle {
  timeline: gsap.core.Timeline
  destroy: () => void
}

export function buildCinematic(cut: CutId): DirectorHandle {
  const B: Beats = CUTS[cut]
  const store = useExperience.getState()

  resetStageState()
  setCaption(null)
  store.setControlsVisible(false)
  store.setEndFrameVisible(false)
  store.setFocused(null)

  const tl = gsap.timeline({ paused: true })

  /* ══════════════════════════════════════════════════════════════
     SEQUENCE A — BRAND ACTIVATION
     Darkness, a current of light, the mark, and its collapse into
     the point that becomes the core.
     ══════════════════════════════════════════════════════════════ */

  tl.to(S, { motes: 1, duration: B.motesIn.dur, ease: 'power2.out' }, B.motesIn.at)
  tl.to(S, { envIntensity: 0.35, duration: B.motesIn.dur * 1.4, ease: 'power2.out' }, B.motesIn.at)

  // The mark resolves out of the converging light rather than fading in on
  // top of it — it arrives from blur and settles, the way a lens focuses.
  tl.to(
    S.logo,
    { opacity: 1, scale: 1, blur: 0, duration: B.logoIn.dur, ease: 'power2.out' },
    B.logoIn.at,
  )

  // The specular pass. This is the one moment the real chrome logo gets to
  // behave like the material it is.
  tl.fromTo(
    S.logo,
    { sweep: 0 },
    { sweep: 1, duration: B.logoSweep.dur, ease: 'power2.inOut' },
    B.logoSweep.at,
  )

  // Then it collapses inward, its light becoming the ignition point.
  tl.to(
    S.logo,
    { opacity: 0, scale: 0.82, blur: 9, duration: B.logoOut.dur, ease: 'power2.in' },
    B.logoOut.at,
  )

  // The camera drifts through the dark before there is anything to look at.
  tl.to(
    S.cam,
    { radius: 2.6, theta: -0.2, phi: 0.06, duration: B.logoOut.at - B.motesIn.at, ease: 'none' },
    B.motesIn.at,
  )

  /* ══════════════════════════════════════════════════════════════
     SEQUENCE B — INTELLIGENCE CORE REVEAL
     ══════════════════════════════════════════════════════════════ */

  tl.to(S, { ignition: 1, duration: B.ignite.dur, ease: 'power3.out' }, B.ignite.at)
  tl.to(S, { envIntensity: 1, duration: B.ignite.dur * 2, ease: 'power2.out' }, B.ignite.at)

  // Facet tracery draws first, then the solid glass fills between it.
  tl.to(S, { shellEdges: 1, duration: B.shellEdges.dur, ease: 'power2.inOut' }, B.shellEdges.at)
  tl.to(
    S,
    { shellSolid: 1, duration: B.shellSolid.dur, ease: 'power3.out' },
    B.shellSolid.at,
  )

  tl.to(S, { lattice: 1, duration: B.lattice.dur, ease: 'power2.out' }, B.lattice.at)
  tl.to(S, { rings: 1, duration: B.rings.dur, ease: 'power2.out' }, B.rings.at)
  tl.to(S, { ringSpeed: 1, duration: B.rings.dur * 1.6, ease: 'power1.inOut' }, B.rings.at)

  // The pull-back that turns a close-up into an object.
  tl.to(
    S.cam,
    {
      radius: 4.3,
      theta: 0.42,
      phi: 0.16,
      duration: B.coreCaption.at - B.ignite.at,
      ease: 'power2.inOut',
    },
    B.ignite.at,
  )

  pulse(tl, B.firstPulse.at, B.firstPulse.dur, 1)

  caption(tl, B.coreCaption.at, B.coreCaption.dur, {
    key: 'core',
    text: COPY.coreReveal,
    variant: 'title',
  })

  /* ══════════════════════════════════════════════════════════════
     SEQUENCE C — SERVICE SYSTEMS ACTIVATE
     ══════════════════════════════════════════════════════════════ */

  tl.to(S, { systems: 1, duration: B.systemsReveal.dur, ease: 'power2.out' }, B.systemsReveal.at)
  tl.to(
    S.cam,
    { radius: 7.6, phi: 0.3, duration: B.systemsReveal.dur * 1.6, ease: 'power2.inOut' },
    B.systemsReveal.at,
  )

  const lastSubEnd = B.subFirst + (SERVICES.length - 1) * B.subStride + B.subDur

  // A continuous lateral orbit through the whole activation run. Each
  // capsule swings through the compositional sweet spot exactly as it
  // lights, which is why this reads as choreography rather than a queue.
  tl.to(
    S.cam,
    {
      theta: `+=${Math.PI * 0.62}`,
      duration: lastSubEnd - B.subFirst + 1.2,
      ease: 'sine.inOut',
    },
    B.subFirst - 0.4,
  )

  SERVICES.forEach((service, i) => {
    const at = B.subFirst + i * B.subStride

    tl.to(
      S.sub,
      { [i]: 1, duration: B.subDur, ease: 'power2.out' },
      at,
    )
    tl.to(
      S.thread,
      { [i]: 1, duration: B.threadDur, ease: 'power2.out' },
      at + B.threadOffset,
    )

    caption(tl, at + 0.35, B.captionHold, {
      key: `svc-${service.id}`,
      text: service.label,
      variant: 'service',
      index: i,
    })
  })

  // Everything alive at once — the first time it reads as one machine.
  pulse(tl, B.systemPulse.at, B.systemPulse.dur, 1.15)

  /* ══════════════════════════════════════════════════════════════
     SEQUENCE D — WORKFLOW
     A real enquiry travelling a real route.
     ══════════════════════════════════════════════════════════════ */

  caption(tl, B.workflowCaption.at, B.workflowCaption.dur, {
    key: 'flow-1',
    text: COPY.workflowOpen,
    variant: 'title',
  })

  // Push in and drop toward the ring plane to follow the packet.
  tl.to(
    S.cam,
    {
      radius: 7.2,
      phi: 0.2,
      fov: 27,
      duration: B.packet.dur * 0.55,
      ease: 'power2.inOut',
    },
    B.packet.at,
  )
  tl.to(
    S.cam,
    { radius: 7.8, phi: 0.28, fov: 30, duration: B.packet.dur * 0.5, ease: 'power2.inOut' },
    B.packet.at + B.packet.dur * 0.55,
  )

  S.packet = 0
  tl.fromTo(
    S,
    { packet: 0 },
    { packet: 1, duration: B.packet.dur, ease: 'power1.inOut' },
    B.packet.at,
  )

  // The enquiry gains structure as it qualifies.
  tl.to(
    S,
    { packetGain: 1, duration: B.packet.dur * 0.45, ease: 'power2.out' },
    B.packet.at + B.packet.dur * 0.2,
  )

  // Flare each subsystem as the packet actually reaches it.
  WORKFLOW_STOPS.forEach((stop, i) => {
    const t = B.packet.at + WORKFLOW_STOP_T[i] * B.packet.dur
    if (stop === -1) return
    tl.to(S.flare, { [stop]: 1, duration: 0.28, ease: 'power2.out' }, t - 0.14)
    tl.to(S.flare, { [stop]: 0, duration: 0.9, ease: 'power2.in' }, t + 0.14)
  })

  // System memory updates — the core absorbs and re-emits, brighter.
  pulse(tl, B.memoryPulse.at, B.memoryPulse.dur, 1.4)

  // Confirmation: the aperture locks.
  const confirmAt = B.packet.at + B.packet.dur * 0.78
  tl.fromTo(
    S,
    { confirm: 0 },
    { confirm: 1, duration: 0.9, ease: 'power3.out' },
    confirmAt,
  )
  tl.to(S, { confirm: 0, duration: 0.7, ease: 'power2.in' }, confirmAt + 1.1)

  caption(tl, B.workflowCaption2.at, B.workflowCaption2.dur, {
    key: 'flow-2',
    text: COPY.workflowClose,
    variant: 'title',
  })

  // Reset the packet cleanly once it has landed.
  tl.call(() => {
    S.packet = -1
    S.packetGain = 0
  }, undefined, B.packet.at + B.packet.dur + 0.2)

  /* ══════════════════════════════════════════════════════════════
     SEQUENCE E — BRAND PAYOFF
     ══════════════════════════════════════════════════════════════ */

  tl.to(S, { recede: 1, duration: B.recede.dur, ease: 'power2.inOut' }, B.recede.at)
  tl.to(S, { bloom: 0.42, duration: B.recede.dur, ease: 'power2.inOut' }, B.recede.at)
  tl.to(S, { vignette: 1.05, duration: B.recede.dur * 1.3, ease: 'power2.inOut' }, B.recede.at)
  // Dim the world right down. The object has to stop competing with the
  // lockup — on the payoff frame the type is the subject, not the core.
  tl.to(S, { envIntensity: 0.16, duration: B.recede.dur, ease: 'power2.inOut' }, B.recede.at)
  tl.to(S, { ignition: 0.24, duration: B.recede.dur, ease: 'power2.inOut' }, B.recede.at)

  // The object withdraws into depth and drops out of the type's way.
  // Raising the look-at target pushes it into the lower third rather than
  // leaving it sitting behind the contact details.
  tl.to(
    S.cam,
    {
      radius: 16,
      phi: 0.1,
      targetY: 0.9,
      theta: `+=${Math.PI * 0.1}`,
      fov: 26,
      handheld: 0.3,
      duration: B.recede.dur * 1.5,
      ease: 'power2.inOut',
    },
    B.recede.at,
  )

  tl.call(() => useExperience.getState().setEndFrameVisible(true), undefined, B.endLogo.at)
  tl.call(() => useExperience.getState().setControlsVisible(true), undefined, B.controls)
  tl.call(() => useExperience.getState().setPhase('ended'), undefined, B.total)

  // Hold. The end frame stays put until the viewer chooses otherwise —
  // which is exactly what screen-recording a story needs.
  tl.to({}, { duration: 2 }, B.controls)

  return {
    timeline: tl,
    destroy: () => {
      tl.kill()
    },
  }
}

/** A system pulse — the object drawing breath. */
function pulse(tl: gsap.core.Timeline, at: number, dur: number, strength: number) {
  tl.to(S, { pulse: strength, duration: dur * 0.28, ease: 'power2.out' }, at)
  tl.to(S, { pulse: 0, duration: dur * 0.72, ease: 'power2.inOut' }, at + dur * 0.28)
}

/**
 * Interactive mode: a calm, indefinite resting state. Everything is already
 * online, the camera holds a good angle, and the viewer is free to explore.
 */
export function enterInteractive() {
  gsap.killTweensOf([S, S.cam, S.sub, S.thread, S.flare])

  setCaption(null)
  useExperience.getState().setEndFrameVisible(false)
  useExperience.getState().setControlsVisible(true)

  S.packet = -1
  S.packetGain = 0
  S.confirm = 0

  gsap.to(S, {
    motes: 1,
    ignition: 1,
    shellEdges: 1,
    shellSolid: 1,
    lattice: 1,
    rings: 1,
    ringSpeed: 1,
    systems: 1,
    recede: 0,
    bloom: 0.75,
    vignette: 0.62,
    envIntensity: 1,
    duration: 1.4,
    ease: 'power2.out',
  })

  SERVICES.forEach((_, i) => {
    gsap.to(S.sub, { [i]: 1, duration: 1.1, delay: i * 0.06, ease: 'power2.out' })
    gsap.to(S.thread, { [i]: 0.85, duration: 1.1, delay: i * 0.06, ease: 'power2.out' })
    gsap.to(S.flare, { [i]: 0, duration: 0.5 })
  })

  gsap.to(S.cam, {
    radius: 7.6,
    theta: 0.5,
    phi: 0.26,
    fov: 30,
    handheld: 0.55,
    targetY: 0,
    duration: 1.6,
    ease: 'power2.inOut',
  })
}

/** Runs the workflow on demand from interactive mode. */
export function playWorkflowOnce(): gsap.core.Timeline {
  const tl = gsap.timeline()
  const DUR = 8.4

  setCaption({ key: 'flow-demo', text: COPY.workflowOpen, variant: 'title' })
  tl.call(() => {
    if (useExperience.getState().caption?.key === 'flow-demo') setCaption(null)
  }, undefined, 3.0)

  S.packet = 0
  tl.fromTo(S, { packet: 0 }, { packet: 1, duration: DUR, ease: 'power1.inOut' }, 0)
  tl.to(S, { packetGain: 1, duration: DUR * 0.45, ease: 'power2.out' }, DUR * 0.2)

  WORKFLOW_STOPS.forEach((stop, i) => {
    const t = WORKFLOW_STOP_T[i] * DUR
    if (stop === -1) return
    tl.to(S.flare, { [stop]: 1, duration: 0.28, ease: 'power2.out' }, t - 0.14)
    tl.to(S.flare, { [stop]: 0, duration: 0.9, ease: 'power2.in' }, t + 0.14)
  })

  pulse(tl, DUR * 0.45, 1.4, 1.4)

  tl.fromTo(S, { confirm: 0 }, { confirm: 1, duration: 0.9, ease: 'power3.out' }, DUR * 0.78)
  tl.to(S, { confirm: 0, duration: 0.7, ease: 'power2.in' }, DUR * 0.78 + 1.1)

  tl.call(() => {
    S.packet = -1
    S.packetGain = 0
  }, undefined, DUR + 0.2)

  return tl
}
