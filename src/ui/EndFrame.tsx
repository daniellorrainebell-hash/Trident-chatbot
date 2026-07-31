import { COPY, LOGO_SRC } from '../config/brand'
import { useExperience } from '../state/useExperience'

/**
 * The payoff frame.
 *
 * Composed to hold indefinitely — this is the frame that ends up as the
 * last few seconds of a story, so nothing here moves once it has settled.
 *
 * Contact lines render only when they're filled in (see COPY.end in
 * config/brand.ts). An empty field is skipped rather than left as a
 * placeholder, so the frame stays composed whatever it's given.
 */
export function EndFrame() {
  const visible = useExperience((s) => s.endFrameVisible)
  const uiHidden = useExperience((s) => s.uiHidden)

  if (!visible) return null

  const { person, role, mobile, office, website, websiteUrl } = COPY.end
  const lines = [
    mobile && { key: 'mobile', value: mobile, href: `tel:${mobile.replace(/\s+/g, '')}` },
    office && { key: 'office', value: office, href: `tel:${office.replace(/\s+/g, '')}` },
    website && {
      key: 'web',
      value: website.replace(/^https?:\/\//, ''),
      // The displayed address stays clean; the link keeps the www host the
      // brand actually publishes, which is the one guaranteed to resolve.
      href: websiteUrl || (website.startsWith('http') ? website : `https://${website}`),
    },
  ].filter(Boolean) as { key: string; value: string; href: string }[]

  return (
    <div className="endframe chrome" data-hidden={uiHidden}>
      <img className="endframe__logo" src={LOGO_SRC} alt="Nexus IQ Systems" draggable={false} />

      <div className="endframe__statement statement">{COPY.statement}</div>

      <div className="endframe__divider" />

      <div className="endframe__contact">
        <div className="endframe__name">{person}</div>
        <div className="endframe__role">{role}</div>
        {lines.map((l) => (
          <a
            key={l.key}
            className="endframe__line"
            href={l.href}
            style={{ color: 'inherit', textDecoration: 'none', pointerEvents: 'auto' }}
          >
            {l.value}
          </a>
        ))}
      </div>
    </div>
  )
}
