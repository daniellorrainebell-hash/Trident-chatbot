import { useEffect, useRef, useState } from 'react'
import { useExperience } from '../state/useExperience'

/**
 * The single text layer.
 *
 * One caption at a time, always in the same place, always leaving the way
 * it came. Restraint here is the whole difference between a brand film and
 * a slide deck — there is never a second piece of copy fighting it.
 *
 * Captions animate out before they unmount, so a service name never snaps
 * off screen mid-recording.
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
      }, 500)
    }

    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
    // `shown` is intentionally omitted: reacting to it would restart the
    // exit timer every time it settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caption])

  if (!shown || uiHidden) return null

  return (
    <div className={`caption${leaving ? ' caption--out' : ''}`} key={shown.key}>
      {shown.variant === 'service' && typeof shown.index === 'number' && (
        <div className="caption__text caption__index">
          {String(shown.index + 1).padStart(2, '0')}
        </div>
      )}
      <div className="caption__rule" />
      <div className={`caption__text ${shown.variant === 'statement' ? 'statement' : 'title'}`}>
        {shown.text}
      </div>
    </div>
  )
}
