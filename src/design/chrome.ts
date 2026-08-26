import { colors } from './colors';

/**
 * Chrome — the success treatment.
 *
 * Success is the one state in the app that is neither brand nor warning, and
 * every flat option for it either shouted in the wrong colour or vanished into
 * the greys. Chrome solves it by changing the *material* rather than the hue: a
 * polished edge catches a room as highlight, shadow, highlight, and the eye
 * picks that out instantly even though every stop in it is a neutral.
 *
 * The stops below are tuned for legibility rather than for maximum shine. A
 * true chrome ramp goes almost black in the shadow band, and near-black text on
 * that lands around 3.7:1 — under the 4.5:1 that small text needs. Lifting the
 * darkest stop to #8290A0 brings it to roughly 6:1 while still reading as
 * metal. The shimmer is worth having; it is not worth having at the cost of the
 * word inside it.
 */
export const CHROME_STOPS = [
  '#FFFFFF',
  '#EEF3F7',
  '#A9B6C2',
  '#8290A0',
  '#D6E0E8',
  '#FFFFFF',
] as const;

export const CHROME_LOCATIONS = [0, 0.18, 0.44, 0.58, 0.78, 1] as const;

/** Down and slightly across, the way light falls on a curved edge. */
export const CHROME_START = { x: 0.1, y: 0 } as const;
export const CHROME_END = { x: 0.9, y: 1 } as const;

/** Ink for anything sitting on chrome, with a light lift so it never sinks into the shadow band. */
export const chromeText = {
  color: colors.text.inverse,
  textShadowColor: 'rgba(255, 255, 255, 0.55)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 3,
} as const;

/** A hairline that reads as the edge of the plate rather than a border round it. */
export const CHROME_EDGE = '#C4D0DA';
