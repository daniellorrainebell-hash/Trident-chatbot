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
    cta: 'Initialise Nexus Intelligence',
    secondary: 'Explore interactively',
  },
  workflowOpen: 'One connected system',
  workflowClose: 'Working when your team logs off',
  // Matches the wording on the business card rather than my own phrasing —
  // "Custom built AI systems" is how the brand already says it.
  statement: 'Custom built AI systems.\nDesigned around your business.',
  end: {
    person: 'Daniel Bell',
    role: 'Founder, Nexus IQ Systems',
    /**
     * Any empty field is skipped rather than rendered as a placeholder, so
     * the frame stays composed whatever it's given.
     *
     * Numbers are spaced for legibility at a glance — the end frame gets
     * read off a moving story, not studied. The `tel:` links strip the
     * spaces automatically, so dialling is unaffected.
     */
    mobile: '07858 188645',
    office: '0800 193 5055',
    /** Display text. `websiteUrl` is what the link actually points at. */
    website: 'nexus-iq.co.uk',
    websiteUrl: 'https://www.nexus-iq.co.uk',
  },
}
