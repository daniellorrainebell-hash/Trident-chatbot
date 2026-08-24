/**
 * Layout, motion and elevation tokens (spec §78).
 *
 * Spacing is a 4pt grid. Use the named steps, not raw numbers — the names carry
 * intent, so a later density change is one edit here rather than a repo sweep.
 */

export const space = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 56,
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const border = {
  hairline: 1,
  thin: 1,
  thick: 2,
  /** The left rule on a live/failed row. */
  marker: 3,
} as const;

/**
 * Minimum interactive target. Below 44pt fails both Apple's HIG and our own
 * accessibility bar (spec §73) — and a sweaty thumb mid-set is less accurate
 * than a lab test.
 */
export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const minTouchTarget = 44;

export const motion = {
  duration: {
    /** Press feedback. Anything slower feels laggy. */
    instant: 90,
    fast: 150,
    normal: 220,
    slow: 320,
    /** Splash hand-off only. */
    brand: 480,
  },
  easing: {
    standard: [0.2, 0, 0, 1] as const,
    decelerate: [0, 0, 0, 1] as const,
    accelerate: [0.3, 0, 1, 1] as const,
  },
  scale: {
    press: 0.97,
  },
} as const;

/**
 * Shadows read as mud on near-black. Depth comes from surface lightness and a
 * hairline border instead. These exist for the two cases that genuinely need
 * lift: bottom sheets and the floating active-workout bar.
 */
export const shadow = {
  none: {},
  sheet: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  float: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const layout = {
  screenPadding: space.lg,
  cardPadding: space.lg,
  gutter: space.md,
  /** Bottom padding so content clears the tab bar and home indicator. */
  tabBarClearance: 96,
  maxContentWidth: 560,
} as const;

export const opacity = {
  disabled: 0.38,
  pressed: 0.7,
  muted: 0.6,
} as const;
