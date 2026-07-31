import { useRef } from 'react'
import { Environment, Lightformer } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../sequence/stageState'
import { useExperience } from '../state/useExperience'

/**
 * The studio.
 *
 * Built entirely from lightformers — no HDRI file, nothing to download,
 * nothing to license. More importantly it's *art-directed*: the two tall
 * vertical strips either side exist specifically to be caught by the
 * shell's facets as long straight specular streaks, which is the single
 * strongest cue that a surface is real glass.
 *
 * The key is neutral white rather than blue. Lighting everything blue
 * flattens the palette; keeping the key neutral lets the cyan accents
 * actually read as accents.
 */
export function Studio() {
  const tier = useExperience((s) => s.tier)

  return (
    /**
     * Baked once. Re-rendering the cubemap every frame to animate the
     * lighting costs six extra render passes per frame and buys nothing
     * here — the shell, the rings and the capsules are all in constant slow
     * motion, so the reflections already crawl across the glass. Move the
     * object, not the world.
     */
    <Environment resolution={tier.envResolution} frames={1}>
      <group>
        {/* Key — broad, soft, above and slightly forward. */}
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#dbeaff"
          scale={[1.5, 0.8, 1]}
          position={[0, 5.5, 2.5]}
          rotation={[-Math.PI / 2.1, 0, 0]}
        />

        {/* The two specular strips. These are the ones doing the real work. */}
        <Lightformer
          form="rect"
          intensity={3.1}
          color="#cfeeff"
          scale={[0.32, 7, 1]}
          position={[-3.2, 0.4, 1.6]}
          rotation={[0, Math.PI / 2.6, 0]}
        />
        <Lightformer
          form="rect"
          intensity={2.5}
          color="#a8dcff"
          scale={[0.24, 6, 1]}
          position={[3.4, 0.2, 1.2]}
          rotation={[0, -Math.PI / 2.6, 0]}
        />

        {/* Cool rim from behind — separates the object from the void. */}
        <Lightformer
          form="ring"
          intensity={1.6}
          color="#3f9fe0"
          scale={[4, 4, 1]}
          position={[0, 0.2, -4.5]}
          rotation={[0, Math.PI, 0]}
        />

        {/* A whisper of bounce from below so the underside isn't dead black. */}
        <Lightformer
          form="rect"
          intensity={0.5}
          color="#14304d"
          scale={[6, 3, 1]}
          position={[0, -4, 1]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      </group>
    </Environment>
  )
}

/**
 * The environment is baked once, so scene brightness is ramped with real
 * lights instead — this is what makes the world "come online" behind the
 * core rather than simply being lit the whole time.
 */
export function AmbientRig() {
  const ambient = useRef<THREE.AmbientLight>(null)
  const rim = useRef<THREE.DirectionalLight>(null)

  useFrame(() => {
    const e = S.envIntensity
    if (ambient.current) ambient.current.intensity = 0.06 + e * 0.22
    if (rim.current) rim.current.intensity = e * 1.1 * (1 - S.recede * 0.5)
  })

  return (
    <>
      <ambientLight ref={ambient} color="#7fb6e0" intensity={0} />
      <directionalLight
        ref={rim}
        color="#bfe4ff"
        position={[-2.5, 1.8, -2]}
        intensity={0}
      />
    </>
  )
}
