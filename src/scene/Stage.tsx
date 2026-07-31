import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { AmbientRig, Studio } from './Studio'
import { CameraRig } from './CameraRig'
import { PostFX } from './PostFX'
import { InnerCore } from './core/InnerCore'
import { GlassShell } from './core/GlassShell'
import { Lattice } from './core/Lattice'
import { Rings } from './core/Rings'
import { OrbitalRing } from './systems/OrbitalRing'
import { DataThreads } from './flow/DataThreads'
import { Packet } from './flow/Packet'
import { Confirm } from './flow/Confirm'
import { Motes } from './fx/Motes'
import { useExperience } from '../state/useExperience'
import { TIER_FORCED, type TierId } from '../config/quality'

/**
 * The 3D stage.
 *
 * Composition note: the whole scene is lifted slightly above frame centre.
 * In a 9:16 crop the optical centre sits high and the lower third has to
 * stay clear for captions — so the object is placed for the frame it will
 * actually be watched in, not for a square viewport.
 */

function Composition() {
  return (
    <group position={[0, 0.12, 0]}>
      <InnerCore />
      <GlassShell />
      <Lattice />
      <Rings />
      <OrbitalRing />
      <DataThreads />
      <Packet />
      <Confirm />
    </group>
  )
}

/**
 * Runtime quality governor.
 *
 * Boot detection is a guess; this is the measurement. If a device can't
 * hold the tier it was given, demote it once, quietly, early. A mobile tier
 * with sustained headroom gets promoted back up.
 */
function AutoQuality() {
  const tier = useExperience((s) => s.tier)
  const setTier = useExperience((s) => s.setTier)
  const acc = useRef({ frames: 0, time: 0, demotions: 0, promoted: false })

  useFrame((_, dt) => {
    if (TIER_FORCED) return
    const a = acc.current
    a.frames++
    a.time += dt
    if (a.time < 2) return

    const fps = a.frames / a.time
    a.frames = 0
    a.time = 0

    const order: TierId[] = ['A', 'B', 'C']
    const idx = order.indexOf(tier.id)

    if (fps < 40 && idx < order.length - 1 && a.demotions < 2) {
      a.demotions++
      setTier(order[idx + 1])
    } else if (fps > 58 && tier.id === 'B' && !a.promoted && a.demotions === 0) {
      a.promoted = true
      setTier('A')
    }
  })

  return null
}

/** Colour management and renderer setup R3F props don't cover. */
function RendererSetup() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.05
    gl.outputColorSpace = THREE.SRGBColorSpace
  }, [gl])
  return null
}

export function Stage() {
  const tier = useExperience((s) => s.tier)

  return (
    <Canvas
      className="stage-canvas"
      dpr={tier.dpr}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      camera={{ fov: 30, near: 0.05, far: 60, position: [0, 0, 1.4] }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color('#02040a')
        // Exponential fog does the heavy lifting on depth — it's why the
        // motes recede instead of floating on a flat black card.
        scene.fog = new THREE.FogExp2('#02040a', 0.028)
      }}
    >
      <RendererSetup />
      <CameraRig />
      <AutoQuality />

      <Suspense fallback={null}>
        <Studio />
        <AmbientRig />
        <Motes />
        <Composition />
        <PostFX />
      </Suspense>
    </Canvas>
  )
}
