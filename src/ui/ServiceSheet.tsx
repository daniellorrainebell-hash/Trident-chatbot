import { SERVICES } from '../config/brand'
import { useExperience } from '../state/useExperience'

/**
 * Interactive-mode detail. One service at a time, one sentence each.
 * Glass, not a card: it belongs to the same material world as the object
 * behind it.
 */
export function ServiceSheet() {
  const focused = useExperience((s) => s.focused)
  const setFocused = useExperience((s) => s.setFocused)
  const uiHidden = useExperience((s) => s.uiHidden)

  if (focused === null || uiHidden) return null
  const service = SERVICES[focused]
  if (!service) return null

  return (
    <div className="sheet" key={service.id}>
      <button className="sheet__close" onClick={() => setFocused(null)} aria-label="Close">
        ×
      </button>
      <div className="caption__index">{String(focused + 1).padStart(2, '0')}</div>
      <div className="sheet__label">{service.label}</div>
      <div className="sheet__summary">{service.summary}</div>
    </div>
  )
}
