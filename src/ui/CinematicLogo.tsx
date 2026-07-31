import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { LOGO_SRC } from '../config/brand'
import { S } from '../sequence/stageState'

/**
 * The Sequence A brand lockup.
 *
 * A DOM overlay rather than a 3D plane, deliberately: the logo is a raster
 * chrome render, and compositing it in CSS keeps it pixel-sharp at any DPR
 * with no texture filtering, no colour-space round trip and no MSAA cost.
 *
 * The sheen is masked by the logo's own alpha, so the specular pass travels
 * across the letterforms themselves rather than a rectangle over them.
 * That masking is the entire difference between "chrome catching light" and
 * "a white bar sliding past".
 *
 * Driven off gsap.ticker so it shares the director's clock exactly.
 */
export function CinematicLogo() {
  const wrap = useRef<HTMLDivElement>(null)
  const sheen = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const apply = () => {
      const w = wrap.current
      const sh = sheen.current
      if (!w) return

      const { opacity, scale, blur, sweep } = S.logo

      w.style.opacity = String(opacity)
      w.style.transform = `scale(${scale})`
      w.style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : 'none'
      // Skip compositing entirely when the mark isn't on screen.
      w.style.visibility = opacity < 0.004 ? 'hidden' : 'visible'

      if (sh) {
        // The gradient travels; the element does not. Translating the
        // element would drag its mask along with it, and the sheen would
        // stop being clipped to the letterforms — which is the entire point.
        sh.style.backgroundPosition = `${(100 - sweep * 200).toFixed(2)}% 0`
        // Brightest through the middle of the pass, absent at either end.
        sh.style.opacity = String(Math.sin(Math.min(1, Math.max(0, sweep)) * Math.PI))
      }
    }

    gsap.ticker.add(apply)
    return () => gsap.ticker.remove(apply)
  }, [])

  return (
    <div className="cinelogo">
      <div className="cinelogo__wrap" ref={wrap}>
        <img className="cinelogo__img" src={LOGO_SRC} alt="Nexus IQ Systems" draggable={false} />
        <div
          className="cinelogo__sheen"
          ref={sheen}
          style={{
            WebkitMaskImage: `url(${LOGO_SRC})`,
            maskImage: `url(${LOGO_SRC})`,
          }}
        />
      </div>
    </div>
  )
}
