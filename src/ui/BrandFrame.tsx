import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { COPY, LOGO_SRC } from '../config/brand'
import { useExperience } from '../state/useExperience'

/**
 * The persistent brand frame.
 *
 * A small mark top-left, the positioning line top-right, and a progress bar
 * along the top edge — held for the entire film.
 *
 * This is the difference between a brand film and a 3D scene with titles on
 * it. Showing the logo only at the open and close means most of the running
 * time carries no brand at all, which is exactly the footage that gets
 * clipped and reshared. The frame also gives the composition an anchor: the
 * eye has somewhere to rest that isn't the moving object.
 *
 * The progress bar is driven straight from the director's timeline through
 * gsap.ticker, so it never re-renders React and stays perfectly in step with
 * the sequence rather than running its own clock.
 */
export function BrandFrame({ getProgress }: { getProgress: () => number }) {
  const bar = useRef<HTMLDivElement>(null)
  const phase = useExperience((s) => s.phase)
  const uiHidden = useExperience((s) => s.uiHidden)

  useEffect(() => {
    const apply = () => {
      if (!bar.current) return
      bar.current.style.transform = `scaleX(${getProgress()})`
    }
    gsap.ticker.add(apply)
    return () => gsap.ticker.remove(apply)
  }, [getProgress])

  // Absent on the start screen, where the full lockup is the whole point.
  if (phase === 'boot' || phase === 'ready') return null

  return (
    <div className="brandframe" data-hidden={uiHidden} aria-hidden="true">
      <div className="brandframe__progress">
        <div className="brandframe__progress-fill" ref={bar} />
      </div>
      <div className="brandframe__row">
        <img className="brandframe__mark" src={LOGO_SRC} alt="" draggable={false} />
        <div className="brandframe__tagline">{COPY.tagline}</div>
      </div>
    </div>
  )
}
