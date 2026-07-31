import { useRef } from 'react'
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
import {
  BlendFunction,
  KernelSize,
  type BloomEffect,
  type VignetteEffect,
} from 'postprocessing'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../sequence/stageState'
import { useExperience } from '../state/useExperience'

/**
 * Post pipeline.
 *
 * The bloom threshold is set high on purpose. Global bloom over everything
 * is exactly what makes these pieces look cheap — it smears the whole frame
 * and destroys the blacks. At 0.72 only the genuinely emissive elements
 * (the plasma core, the threads, the packet) bloom, and the machined metal
 * and glass stay crisp. It behaves like selective bloom without the cost or
 * the ref plumbing.
 *
 * Grain is doing quiet work too: a little noise over near-black stops the
 * gradients banding on OLED phone screens, which is where this will
 * actually be watched.
 */
export function PostFX() {
  const tier = useExperience((s) => s.tier)
  // The drei wrappers type their refs as `typeof Effect` rather than an
  // instance, so the ref has to be cast at the JSX site. The useRef
  // generics below are the types that actually arrive at runtime.
  const bloom = useRef<BloomEffect>(null)
  const vignette = useRef<VignetteEffect>(null)

  useFrame(() => {
    if (bloom.current) bloom.current.intensity = S.bloom
    // Closing in slightly on the payoff frame concentrates attention on the
    // lockup without anyone consciously noticing the frame tightened.
    if (vignette.current) vignette.current.darkness = S.vignette
  })

  return (
    /* Hardware MSAA rather than an SMAA pass. SMAA was intermittently
       leaking its edge-detection buffer through as the final image; MSAA is
       one buffer setting and cannot fail that way. */
    <EffectComposer multisampling={tier.msaa}>
      {/* Depth of field. The single strongest cue separating a cinematic
          render from a 1990s one: old hardware could not defocus, so
          everything-in-focus reads as retro no matter what is being drawn.
          Focus is pinned to the die, so the near and far layers of the stack
          fall away and the object gains real physical depth. */}
      {tier.dof ? (
        <DepthOfField
          target={[0, 0, 0]}
          focalLength={0.055}
          bokehScale={1.9}
          height={tier.id === 'A' ? 700 : 440}
        />
      ) : (
        <></>
      )}

      <Bloom
        ref={bloom as never}
        intensity={0.5}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.22}
        mipmapBlur
        kernelSize={KernelSize.MEDIUM}
      />

      {tier.chromaticAberration ? (
        <ChromaticAberration
          offset={new THREE.Vector2(0.00035, 0.00045)}
          radialModulation
          modulationOffset={0.35}
          blendFunction={BlendFunction.NORMAL}
        />
      ) : (
        <></>
      )}

      {tier.grain ? (
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.055} />
      ) : (
        <></>
      )}

      <Vignette ref={vignette as never} eskil={false} offset={0.28} darkness={0.72} />
    </EffectComposer>
  )
}
