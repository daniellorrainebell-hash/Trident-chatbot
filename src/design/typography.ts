/**
 * Type system.
 *
 * Two families, no more:
 *   display — Barlow Condensed. Headings, numerals, tab labels, anything shouted.
 *             Condensed and industrial without being a novelty face (spec §2).
 *   ui      — Inter. Body copy, form labels, long-form legal text. Optimised for
 *             small sizes and high x-height legibility.
 *
 * Both are SIL Open Font Licence and bundled in the binary via @expo-google-fonts,
 * so there is no runtime font fetch and no licensing cost at launch.
 *
 * Big numerals matter here: a set of 120 kg x 5 should read from arm's length with
 * a phone on a bench. That is what `metric*` is for.
 */

export const fontFamily = {
  display: 'BarlowCondensed_700Bold',
  displayMedium: 'BarlowCondensed_600SemiBold',
  displayBlack: 'BarlowCondensed_800ExtraBold',
  ui: 'Inter_400Regular',
  uiMedium: 'Inter_500Medium',
  uiSemiBold: 'Inter_600SemiBold',
  uiBold: 'Inter_700Bold',
} as const;

export type FontFamily = (typeof fontFamily)[keyof typeof fontFamily];

/** Maps the loader keys to the packages the root layout imports. */
export const fontAssets = [
  'BarlowCondensed_600SemiBold',
  'BarlowCondensed_700Bold',
  'BarlowCondensed_800ExtraBold',
  'Inter_400Regular',
  'Inter_500Medium',
  'Inter_600SemiBold',
  'Inter_700Bold',
] as const;

type TextStyleToken = {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textTransform?: 'uppercase';
};

export const type = {
  /** Splash / brand only. */
  brand: {
    fontFamily: fontFamily.displayBlack,
    fontSize: 44,
    lineHeight: 44,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  /** Screen titles. */
  h1: {
    fontFamily: fontFamily.display,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  h2: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    lineHeight: 27,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  h3: {
    fontFamily: fontFamily.display,
    fontSize: 19,
    lineHeight: 23,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  /** Section rules above a group of cards. */
  overline: {
    fontFamily: fontFamily.uiSemiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },

  /** Hero numbers: streak count, session volume, calorie target. */
  metricXL: {
    fontFamily: fontFamily.displayBlack,
    fontSize: 60,
    lineHeight: 60,
    letterSpacing: -0.5,
  },
  metricL: {
    fontFamily: fontFamily.displayBlack,
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -0.3,
  },
  metricM: {
    fontFamily: fontFamily.display,
    fontSize: 27,
    lineHeight: 29,
    letterSpacing: 0,
  },
  metricS: {
    fontFamily: fontFamily.display,
    fontSize: 19,
    lineHeight: 21,
    letterSpacing: 0.2,
  },

  body: {
    fontFamily: fontFamily.ui,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyStrong: {
    fontFamily: fontFamily.uiSemiBold,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fontFamily.ui,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fontFamily.ui,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  /** Legal, disclaimers, footnotes. Never smaller than this. */
  legal: {
    fontFamily: fontFamily.ui,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0,
  },

  button: {
    fontFamily: fontFamily.display,
    fontSize: 17,
    lineHeight: 20,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  buttonSmall: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  tabLabel: {
    fontFamily: fontFamily.display,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyleToken>;

export type TypeToken = keyof typeof type;
