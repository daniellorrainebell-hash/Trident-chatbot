import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { S } from '../sequence/stageState'
import { useExperience } from '../state/useExperience'

const DRAG_THRESHOLD = 6
const LONG_PRESS_MS = 700

/**
 * Stage gestures.
 *
 * Two jobs, both bound to the stage element rather than an overlay so they
 * never block the canvas:
 *
 *  1. Orbit — drag to rotate, but only in interactive mode. The film is
 *     choreographed; letting someone drag the camera mid-take would wreck
 *     the composition it was built for.
 *  2. Long-press to leave recording mode. A tap is far too easy to trigger
 *     by accident while holding a phone steady.
 *
 * Orbit is clamped and eased back toward centre afterwards, so the object
 * can never be left at an angle that doesn't hold up.
 */
export function useStageGestures(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    let pointerId: number | null = null
    let startX = 0
    let startY = 0
    let baseTheta = 0
    let basePhi = 0
    let dragging = false
    let longPress: number | null = null

    const clearLongPress = () => {
      if (longPress !== null) {
        window.clearTimeout(longPress)
        longPress = null
      }
    }

    const onDown = (e: PointerEvent) => {
      if (pointerId !== null) return
      pointerId = e.pointerId
      startX = e.clientX
      startY = e.clientY
      baseTheta = S.cam.userTheta
      basePhi = S.cam.userPhi
      dragging = false

      if (useExperience.getState().uiHidden) {
        longPress = window.setTimeout(() => {
          useExperience.getState().setUiHidden(false)
          longPress = null
        }, LONG_PRESS_MS)
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return

      const dx = e.clientX - startX
      const dy = e.clientY - startY

      if (!dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        dragging = true
        // Any real movement means this was never a press-and-hold.
        clearLongPress()
      }
      if (!dragging) return
      if (useExperience.getState().phase !== 'interactive') return

      const w = el.clientWidth || 1
      gsap.killTweensOf(S.cam)
      S.cam.userTheta = baseTheta - (dx / w) * 2.4
      S.cam.userPhi = Math.max(-0.45, Math.min(0.7, basePhi + (dy / w) * 1.6))
    }

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      pointerId = null
      clearLongPress()

      if (dragging && useExperience.getState().phase === 'interactive') {
        // Settle back toward the designed angle rather than holding wherever
        // the finger happened to stop.
        gsap.to(S.cam, {
          userTheta: S.cam.userTheta * 0.35,
          userPhi: S.cam.userPhi * 0.3,
          duration: 2.4,
          ease: 'power2.out',
        })
      }
      dragging = false
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      clearLongPress()
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [ref])
}
