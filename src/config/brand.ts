/**
 * NEXUS IQ — BRAND CONFIGURATION
 * ------------------------------------------------------------------
 * This is the single edit point for every word and asset in the
 * experience. Nothing here requires touching the 3D code.
 */

/** Swap to '/brand/nexus-iq-logo-neon.png' for the alternate mark. */
export const LOGO_SRC = '/brand/nexus-iq-logo.png'

export const BRAND = {
  name: 'NEXUS IQ',
  suffix: 'SYSTEMS',
  productTitle: 'Living Intelligence Core',
}

/**
 * The five service systems, in activation order.
 * `hue` shifts each subsystem slightly within the blue/cyan range so they
 * read as related-but-distinct. Values are small on purpose — the palette
 * stays disciplined.
 */
export const SERVICES = [
  {
    id: 'voice',
    label: 'AI Voice Receptionists',
    summary: 'Answers every call, day or night, in your brand’s voice.',
    glyph: 'voice',
    accent: '#7fdcff',
  },
  {
    id: 'speed',
    label: 'Speed to Lead Agents',
    summary: 'Responds to new enquiries in seconds, not hours.',
    glyph: 'speed',
    accent: '#5cc8ff',
  },
  {
    id: 'chat',
    label: 'Intelligent Chatbots',
    summary: 'Qualifies, books and routes without a human touch.',
    glyph: 'chat',
    accent: '#8ae8ff',
  },
  {
    id: 'reputation',
    label: 'Reputation Management',
    summary: 'Requests, monitors and protects your reviews automatically.',
    glyph: 'reputation',
    accent: '#6ad6ff',
  },
  {
    id: 'automation',
    label: 'Custom Automation',
    summary: 'Connects the systems your business already runs on.',
    glyph: 'automation',
    accent: '#4fb8ff',
  },
] as const

export type ServiceId = (typeof SERVICES)[number]['id']

/** On-screen captions. Keep these short — the restraint is the point. */
export const COPY = {
  start: {
    eyebrow: 'Nexus IQ Systems',
    title: 'Living Intelligence Core',
    cta: 'Initialise Nexus Intelligence',
    secondary: 'Explore interactively',
  },
  coreReveal: 'Living Intelligence Core',
  workflowOpen: 'One connected system',
  workflowClose: 'Working when your team logs off',
  statement: 'Custom-built AI systems.\nDesigned around your business.',
  end: {
    person: 'Daniel Bell',
    role: 'Founder, Nexus IQ Systems',
    /**
     * TODO — supply these and they appear automatically.
     * Empty strings are skipped, so the frame stays composed either way.
     */
    mobile: '',
    office: '',
    website: '',
  },
}
