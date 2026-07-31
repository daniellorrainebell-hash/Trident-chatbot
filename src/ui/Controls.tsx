import { useExperience } from '../state/useExperience'

/**
 * Controls.
 *
 * Only ever visible when the film has finished or the viewer is exploring —
 * never during the cinematic itself, and never in recording mode. Any chrome
 * on screen while someone is screen-recording is a defect.
 */
export function Controls({
  onReplay,
  onInteractive,
  onWorkflow,
  onExit,
}: {
  onReplay: () => void
  onInteractive: () => void
  onWorkflow: () => void
  onExit: () => void
}) {
  const phase = useExperience((s) => s.phase)
  const visible = useExperience((s) => s.controlsVisible)
  const uiHidden = useExperience((s) => s.uiHidden)
  const setUiHidden = useExperience((s) => s.setUiHidden)

  if (uiHidden) return null

  const ended = phase === 'ended'
  const interactive = phase === 'interactive'

  // Nothing to control during boot, the start screen or the film itself.
  // Rendering it invisible was worse than useless: an opacity-0 bar still
  // sits over the start screen and swallows taps meant for the CTA.
  if (!ended && !interactive) return null

  return (
    /* Two tiers, never more than two pills in a row. Four equal buttons
       wrapped onto two lines and collided with the caption — a control
       cluster that big stops reading as premium anyway. */
    <div className="controls" data-visible={visible}>
      <div className="controls__row">
        {ended && (
          <>
            <button className="pill pill--primary" onClick={onReplay}>
              Replay
            </button>
            <button className="pill" onClick={onInteractive}>
              Explore
            </button>
          </>
        )}

        {interactive && (
          <>
            <button className="pill pill--primary" onClick={onWorkflow}>
              Run workflow
            </button>
            <button className="pill" onClick={onReplay}>
              Replay film
            </button>
          </>
        )}
      </div>

      <div className="controls__links">
        {interactive && (
          <button className="link-button" onClick={onExit}>
            Start
          </button>
        )}
        <button className="link-button" onClick={() => setUiHidden(true)}>
          Record
        </button>
      </div>
    </div>
  )
}

/**
 * Recording mode's only on-screen element: a hint that fades itself out.
 *
 * It's purely visual — the long-press that exits recording mode is bound to
 * the stage itself, so this never intercepts a drag and the viewer can keep
 * orbiting the core while recording.
 */
export function RecordingHint() {
  const uiHidden = useExperience((s) => s.uiHidden)
  if (!uiHidden) return null
  return <div className="hint">Press and hold to show controls</div>
}
