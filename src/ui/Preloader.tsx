import { useEffect, useState } from 'react'
import { LOGO_SRC } from '../config/brand'

/**
 * Preload.
 *
 * The logo is the one asset that must be decoded before Sequence A runs —
 * a mark that pops in halfway through its own reveal ruins the take. We
 * also hold a minimum beat so the transition into the start screen is a
 * deliberate fade rather than a flash on a fast connection.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    const started = performance.now()
    const MIN_MS = 900

    const tick = window.setInterval(() => {
      if (cancelled) return
      // Ease toward 90% while we wait; the last 10% is the real completion.
      setProgress((p) => Math.min(0.9, p + (0.9 - p) * 0.16 + 0.01))
    }, 60)

    const finish = () => {
      if (cancelled) return
      const wait = Math.max(0, MIN_MS - (performance.now() - started))
      window.setTimeout(() => {
        if (cancelled) return
        setProgress(1)
        setDone(true)
        window.setTimeout(onDone, 700)
      }, wait)
    }

    const img = new Image()
    img.src = LOGO_SRC
    const settle = () =>
      'decode' in img ? img.decode().then(finish).catch(finish) : finish()

    if (img.complete) settle()
    else {
      img.onload = settle
      // A missing logo must not deadlock the experience.
      img.onerror = finish
    }

    return () => {
      cancelled = true
      window.clearInterval(tick)
    }
  }, [onDone])

  return (
    <div className="preloader" data-done={done}>
      <div className="preloader__bar">
        <div className="preloader__fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}
