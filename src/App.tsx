import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Stage } from './scene/Stage'
import { Preloader } from './ui/Preloader'
import { StartScreen } from './ui/StartScreen'
import { CinematicLogo } from './ui/CinematicLogo'
import { Caption } from './ui/Caption'
import { EndFrame } from './ui/EndFrame'
import { Controls, RecordingHint } from './ui/Controls'
import { ServiceSheet } from './ui/ServiceSheet'
import { useStageGestures } from './ui/useStageGestures'
import { useExperience } from './state/useExperience'
import { S, resetStageState } from './sequence/stageState'
import { buildCinematic, enterInteractive, playWorkflowOnce, type DirectorHandle } from './sequence/director'
import { SERVICES } from './config/brand'
import type { CutId } from './config/timeline'

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null)
  const director = useRef<DirectorHandle | null>(null)
  const workflow = useRef<gsap.core.Timeline | null>(null)

  const [booted, setBooted] = useState(false)

  const phase = useExperience((s) => s.phase)
  const setPhase = useExperience((s) => s.setPhase)
  const setCut = useExperience((s) => s.setCut)
  const setCaption = useExperience((s) => s.setCaption)
  const setControlsVisible = useExperience((s) => s.setControlsVisible)
  const setEndFrameVisible = useExperience((s) => s.setEndFrameVisible)
  const setUiHidden = useExperience((s) => s.setUiHidden)
  const focused = useExperience((s) => s.focused)
  const uiHidden = useExperience((s) => s.uiHidden)

  useStageGestures(stageRef)

  /** Tears down whatever is currently playing. */
  const clearSequences = useCallback(() => {
    director.current?.destroy()
    director.current = null
    workflow.current?.kill()
    workflow.current = null
    gsap.killTweensOf([S, S.cam, S.logo, S.sub, S.flare])
  }, [])

  const startCinematic = useCallback(
    (cut: CutId) => {
      clearSequences()
      setCut(cut)
      setUiHidden(false)
      setPhase('cinematic')
      director.current = buildCinematic(cut)
      director.current.timeline.play(0)
    },
    [clearSequences, setCut, setPhase, setUiHidden],
  )

  const goInteractive = useCallback(() => {
    clearSequences()
    resetStageState()
    setCaption(null)
    setEndFrameVisible(false)
    setPhase('interactive')
    enterInteractive()
  }, [clearSequences, setCaption, setEndFrameVisible, setPhase])

  const goStart = useCallback(() => {
    clearSequences()
    resetStageState()
    setCaption(null)
    setEndFrameVisible(false)
    setControlsVisible(false)
    setUiHidden(false)
    setPhase('ready')
  }, [clearSequences, setCaption, setControlsVisible, setEndFrameVisible, setPhase, setUiHidden])

  const runWorkflow = useCallback(() => {
    workflow.current?.kill()
    workflow.current = playWorkflowOnce()
  }, [])

  const replay = useCallback(() => {
    startCinematic(useExperience.getState().cut)
  }, [startCinematic])

  /* Focusing a subsystem lifts it out of the ensemble rather than opening a
     panel over the top of it — the object stays the subject. */
  useEffect(() => {
    if (phase !== 'interactive') return
    SERVICES.forEach((_, i) => {
      gsap.to(S.flare, {
        [i]: focused === i ? 0.75 : 0,
        duration: 0.7,
        ease: 'power2.out',
      })
      // Focusing a layer dims the others rather than opening a panel over
      // the object — the stack stays the subject.
      gsap.to(S.sub, {
        [i]: focused === null || focused === i ? 1 : 0.28,
        duration: 0.7,
        ease: 'power2.out',
      })
    })
  }, [focused, phase])

  /* QA hook (?qa=1 only).
     Exposes deterministic seeking so the sequence can be verified frame by
     frame instead of by wall clock — screenshotting a real-time timeline
     drifts by seconds and you end up reviewing the wrong moment. */
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('qa')) return

    // GSAP clamps elapsed time when a frame takes longer than 500ms, which
    // is right for real devices (a stutter shouldn't skip the film) but
    // makes headless software rendering crawl. Off for QA only.
    gsap.ticker.lagSmoothing(0)

    const api = {
      start: (cut: CutId = 'full') => startCinematic(cut),
      seek: (t: number) => {
        const tl = director.current?.timeline
        if (!tl) return false
        tl.pause()
        tl.seek(t, false)
        return true
      },
      state: () => S,
    }
    ;(window as unknown as { __nexusQA: typeof api }).__nexusQA = api
  }, [startCinematic])

  /* Pause the film if the tab is hidden — coming back to a sequence that
     ran on without you is worse than one that waited. */
  useEffect(() => {
    const onVisibility = () => {
      const tl = director.current?.timeline
      if (!tl) return
      if (document.hidden) tl.pause()
      else if (useExperience.getState().phase === 'cinematic') tl.play()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => clearSequences, [clearSequences])

  return (
    <div className="viewport">
      <div className="stage" ref={stageRef}>
        <Stage />

        <CinematicLogo />
        <Caption />
        <EndFrame />
        <ServiceSheet />
        <RecordingHint />

        {!uiHidden && (
          <Controls
            onReplay={replay}
            onInteractive={goInteractive}
            onWorkflow={runWorkflow}
            onExit={goStart}
          />
        )}

        {phase === 'ready' && <StartScreen onStart={startCinematic} onInteractive={goInteractive} />}

        {!booted && <Preloader onDone={() => { setBooted(true); setPhase('ready') }} />}
      </div>
    </div>
  )
}
