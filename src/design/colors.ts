/**
 * RABID: THE KENNEL — colour tokens.
 *
 * Spec §78: near-black, white, charcoal, steel, muted grey, restrained deep red,
 * very limited glow. The palette is deliberately narrow. Red is a signal colour,
 * not decoration — it marks live state, failure and destructive intent, nothing else.
 *
 * Never hardcode a hex value in a component. Add it here first.
 */

export const palette = {
  // Surfaces, darkest to lightest.
  void: '#08080A',
  base: '#0C0C0E',
  raised: '#131316',
  panel: '#1A1A1E',
  elevated: '#212127',

  // Hairlines and dividers.
  lineSubtle: '#26262C',
  line: '#32323A',
  lineStrong: '#43434D',

  // Type.
  bone: '#F4F3F1',
  ash: '#A8A8B0',
  smoke: '#74747E',
  ghost: '#4A4A54',

  // Steel / gunmetal accents.
  steel: '#8895A3',
  steelDim: '#5C6673',
  steelBright: '#B4C0CC',

  // Restrained deep red.
  blood: '#A81D1A',
  bloodBright: '#C9302C',
  bloodDim: '#6B1614',

  // Status. Muted on purpose — no neon.
  //
  // There is no amber and there is no green. The brand is black, bone and
  // blood, and a status palette that reached outside it was the one part of
  // the app that looked borrowed.
  //
  // Success is not a hue here, it is a state: done is filled, pending is an
  // outline, failed is an outline in blood. That survives a greyscale
  // screenshot and a colourblind reader, which a green chip never did.
} as const;

export const colors = {
  bg: {
    /** App background. Everything sits on this. */
    base: palette.base,
    /** Behind modals and the splash. */
    void: palette.void,
    /** Cards and list surfaces. */
    raised: palette.raised,
    /** Nested panels inside a card. */
    panel: palette.panel,
    /** Pressed states, inputs, chips. */
    elevated: palette.elevated,
  },

  border: {
    subtle: palette.lineSubtle,
    default: palette.line,
    strong: palette.lineStrong,
    /** Only for the active set row / live timer. */
    live: palette.bloodDim,
  },

  text: {
    primary: palette.bone,
    secondary: palette.ash,
    tertiary: palette.smoke,
    /** Disabled, or a placeholder awaiting input. */
    disabled: palette.ghost,
    /** Text on a bone-coloured button. */
    inverse: palette.void,
    accent: palette.steelBright,
    danger: palette.bloodBright,
    success: palette.bone,
    warning: palette.bloodBright,
  },

  accent: {
    steel: palette.steel,
    steelDim: palette.steelDim,
    steelBright: palette.steelBright,
  },

  /**
   * Brand red, for structure only — never for text or fills.
   *
   * Red still means live, failed or destructive everywhere it lands on a word
   * or a surface. That meaning is worth keeping, so the brand accent is
   * confined to hairlines and markers: the tab rule, the tick beside a section
   * title, the rules flanking the mark. A red line is Rabid. A red word is a
   * warning. Keeping those apart is what stops either from going quiet.
   *
   * Not used on the landing screen, which stays black and white.
   */
  brand: {
    edge: palette.blood,
    edgeBright: palette.bloodBright,
  },

  /** Reserved for live/destructive/failed. Do not use as a brand wash. */
  signal: {
    default: palette.blood,
    bright: palette.bloodBright,
    dim: palette.bloodDim,
  },

  status: {
    success: palette.bone,
    successBright: palette.bone,
    warning: palette.blood,
    warningBright: palette.bloodBright,
    danger: palette.blood,
    dangerBright: palette.bloodBright,
    neutral: palette.smoke,
  },

  /** Fills for the primary CTA — bone on black is the loudest thing in the app. */
  action: {
    primaryBg: palette.bone,
    primaryText: palette.void,
    primaryPressed: '#D9D8D5',
    secondaryBg: palette.elevated,
    secondaryText: palette.bone,
    secondaryPressed: '#2B2B32',
    destructiveBg: palette.blood,
    destructiveText: palette.bone,
    destructivePressed: '#8C1815',
  },
} as const;

export type ColorTokens = typeof colors;
