import { useEffect, useRef, useState } from 'react'
import { useExperience } from '../state/useExperience'

/**
 * The caption layer.
 *
 * Three tiers rather than one line: a small tracked eyebrow, a large
 * mixed-case name, and a status line stating what the system just did.
 *
 * Set to the lower left, not centred. Centred small tracked uppercase is a
 * safe choice and it reads as timid at phone size — it neither commands the
 * frame nor tells you anything. The hierarchy here does the work that the
 * restraint was failing to do: you can read the name at a glance while
 * scrolling, and the status line is what actually communicates that a
 * business process completed.
 *
 * Captions animate out before they unmount, so nothing ever snaps off
 * screen mid-recording.
 */
export function Caption() {
  const caption = useExperience((s) => s.caption)
  const uiHidden = useExperience((s) => s.uiHidden)

  const [shown, setShown] = useState(caption)
  const [leaving, setLeaving] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current)

    if (caption) {
      setShown(caption)
      setLeaving(false)
    } else if (shown) {
      setLeaving(true)
      timer.current = window.setTimeout(() => {
        setShown(null)
        setLeaving(false)
      }, 480)
    }

    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
    // `shown` is intentionally omitted: reacting to it would restart the
    // exit timer every time it settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caption])

  if (!shown || uiHidden) return null

  const isService = shown.variant === 'service'

  return (
    <div className={`caption${leaving ? ' caption--out' : ''}`} key={shown.key}>
      {isService && typeof shown.index === 'number' && (
        <div className="caption__step">
          {String(shown.index + 1).padStart(2, '0')}
          <span className="caption__step-total"> / 05</span>
        </div>
      )}

      <div className="caption__body">
        {shown.eyebrow && <div className="caption__eyebrow">{shown.eyebrow}</div>}
        <div className={isService ? 'caption__name' : 'caption__headline'}>{shown.text}</div>
        {shown.status && <div className="caption__status">{shown.status}</div>}
      </div>
    </div>
  )
}
