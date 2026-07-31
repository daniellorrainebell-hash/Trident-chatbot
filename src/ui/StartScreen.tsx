import { useState } from 'react'
import { COPY, LOGO_SRC } from '../config/brand'
import type { CutId } from '../config/timeline'
import { useExperience } from '../state/useExperience'

/**
 * The start screen.
 *
 * One button, one decision. The cut selector is present but quiet — the
 * default is the full 60s film, and the 22s Stories cut is there for
 * someone who already knows they want it.
 */
export function StartScreen({
  onStart,
  onInteractive,
}: {
  onStart: (cut: CutId) => void
  onInteractive: () => void
}) {
  const cut = useExperience((s) => s.cut)
  const setCut = useExperience((s) => s.setCut)
  const [leaving, setLeaving] = useState(false)

  const start = () => {
    setLeaving(true)
    // Let the screen clear before the first frame of the film.
    window.setTimeout(() => onStart(cut), 620)
  }

  const explore = () => {
    setLeaving(true)
    window.setTimeout(onInteractive, 620)
  }

  return (
    <div className="start layer--interactive" data-leaving={leaving}>
      <div />

      <div className="start__mark">
        <img className="start__logo" src={LOGO_SRC} alt="Nexus IQ Systems" draggable={false} />
        <div className="eyebrow">{COPY.start.title}</div>
      </div>

      <div className="start__actions">
        <div className="cuts">
          {(
            [
              { id: 'full' as CutId, label: '60s film' },
              { id: 'short' as CutId, label: '22s story' },
            ]
          ).map((c) => (
            <button key={c.id} data-active={cut === c.id} onClick={() => setCut(c.id)}>
              {c.label}
            </button>
          ))}
        </div>

        <button className="cta" onClick={start}>
          {COPY.start.cta}
        </button>

        <button className="link-button" onClick={explore}>
          {COPY.start.secondary}
        </button>
      </div>
    </div>
  )
}
