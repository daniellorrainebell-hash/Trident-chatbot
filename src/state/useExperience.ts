import { create } from 'zustand'
import type { CutId } from '../config/timeline'
import { detectTier, TIERS, type Tier, type TierId } from '../config/quality'

export type Phase = 'boot' | 'ready' | 'cinematic' | 'ended' | 'interactive'

/** What the caption layer is currently showing. */
export interface Caption {
  key: string
  text: string
  /** 'service' captions get the small index marker; 'statement' is larger. */
  variant: 'service' | 'title' | 'statement'
  index?: number
}

interface ExperienceState {
  phase: Phase
  cut: CutId
  tier: Tier
  caption: Caption | null
  /** Recording mode — every piece of chrome hides. */
  uiHidden: boolean
  controlsVisible: boolean
  endFrameVisible: boolean
  focused: number | null
  reducedMotion: boolean
  webglFailed: boolean

  setPhase: (p: Phase) => void
  setCut: (c: CutId) => void
  setTier: (t: TierId) => void
  setCaption: (c: Caption | null) => void
  setUiHidden: (v: boolean) => void
  setControlsVisible: (v: boolean) => void
  setEndFrameVisible: (v: boolean) => void
  setFocused: (i: number | null) => void
  setWebglFailed: (v: boolean) => void
}

const prefersReduced =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

export const useExperience = create<ExperienceState>((set) => ({
  phase: 'boot',
  cut: 'full',
  tier: TIERS[detectTier()],
  caption: null,
  uiHidden: false,
  controlsVisible: false,
  endFrameVisible: false,
  focused: null,
  reducedMotion: prefersReduced,
  webglFailed: false,

  setPhase: (phase) => set({ phase }),
  setCut: (cut) => set({ cut }),
  setTier: (id) => set({ tier: TIERS[id] }),
  setCaption: (caption) => set({ caption }),
  setUiHidden: (uiHidden) => set({ uiHidden }),
  setControlsVisible: (controlsVisible) => set({ controlsVisible }),
  setEndFrameVisible: (endFrameVisible) => set({ endFrameVisible }),
  setFocused: (focused) => set({ focused }),
  setWebglFailed: (webglFailed) => set({ webglFailed }),
}))
