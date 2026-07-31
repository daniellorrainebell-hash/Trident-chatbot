import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { SERVICES } from '../../config/brand'
import { S } from '../../sequence/stageState'
import { useExperience } from '../../state/useExperience'
import {
  CAPSULE_FOOT_Y,
  CAPSULE_HALF_HEIGHT,
  CAPSULE_SCALE,
  orbitAngle,
  RING_RADIUS,
  RING_TILT,
  SUBSYSTEM_POSITIONS,
} from '../layout'
import { GLYPHS, type GlyphId } from './Glyphs'

/**
 * The five service systems as suspended glass capsules on a tilted orbital
 * ring — precision instruments, not cards.
 *
 * The capsules deliberately do *not* use real transmission. Five more
 * refraction passes would cost more than the hero object itself, and at
 * this size a polished physical material riding the studio reflections is
 * indistinguishable. The one object that earns real glass is the core.
 */

/** A slender tapered vessel — lathed rather than a pill, which reads as
 *  machined instead of moulded. */
function useCapsuleGeometry() {
  return useMemo(() => {
    const profile: THREE.Vector2[] = []
    const H = 0.2
    const steps = 24
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const y = -H + t * H * 2
      // A soft ogive: full at the waist, drawn to a point at both ends.
      const r = Math.sin(t * Math.PI) ** 0.62 * 0.078
      profile.push(new THREE.Vector2(Math.max(r, 0.0004), y))
    }
    return new THREE.LatheGeometry(profile, 40)
  }, [])
}

function Capsule({ index }: { index: number }) {
  const service = SERVICES[index]
  const Glyph = GLYPHS[service.glyph as GlyphId]

  const geometry = useCapsuleGeometry()
  const setFocused = useExperience((s) => s.setFocused)
  const phase = useExperience((s) => s.phase)

  const group = useRef<THREE.Group>(null)
  const shell = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Mesh>(null)

  const shellMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#070c16'),
        metalness: 0.15,
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        transparent: true,
        opacity: 0,
        envMapIntensity: 1.4,
        depthWrite: false,
      }),
    [],
  )

  const haloMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(service.accent),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [service.accent],
  )

  const base = SUBSYSTEM_POSITIONS[index]

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const reveal = S.systems
    const energy = S.sub[index]
    const flare = S.flare[index]

    if (group.current) {
      group.current.visible = reveal > 0.01
      // Capsules rise into the ring plane and drift on their own phase.
      const bob = Math.sin(t * 0.62 + index * 1.7) * 0.018
      group.current.position.set(base.x, base.y + bob - (1 - reveal) * 0.35, base.z)
      group.current.scale.setScalar(reveal * CAPSULE_SCALE)
      // Face outward from the core, so a capsule is square-on to the lens
      // exactly as it swings through the front of the ring.
      group.current.rotation.y = Math.atan2(base.x, base.z)
    }

    // The glass clarifies as the subsystem comes online.
    shellMaterial.opacity = reveal * (0.1 + energy * 0.22)
    shellMaterial.envMapIntensity = 1.4 + energy * 2.6 + flare * 2

    if (halo.current) {
      haloMaterial.opacity = energy * (0.22 + flare * 0.5) * reveal
      const s = 1 + energy * 0.12 + flare * 0.25
      halo.current.scale.setScalar(s)
    }

    if (shell.current) {
      shell.current.scale.setScalar(1 + flare * 0.04)
    }
  })

  const handleTap = (e: ThreeEvent<MouseEvent>) => {
    if (phase !== 'interactive') return
    e.stopPropagation()
    setFocused(index)
  }

  return (
    <group ref={group} visible={false}>
      <mesh
        ref={shell}
        geometry={geometry}
        material={shellMaterial}
        onClick={handleTap}
        onPointerDown={handleTap}
      />

      {/* Base halo — the capsule's footing in the ring plane. */}
      <mesh ref={halo} material={haloMaterial} position={[0, -CAPSULE_HALF_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.0022, 5, 48]} />
      </mesh>

      <Glyph index={index} accent={service.accent} />
    </group>
  )
}

export function OrbitalRing() {
  const ring = useRef<THREE.Group>(null)
  const guide = useRef<THREE.Mesh>(null)

  const guideMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#2a6f9e'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (ring.current) ring.current.rotation.y = orbitAngle(t)
    guideMaterial.opacity = S.systems * 0.16 * (1 - S.recede * 0.7)
    if (guide.current) guide.current.visible = S.systems > 0.01
  })

  return (
    <group rotation={[RING_TILT, 0, 0.06]}>
      <group ref={ring}>
        {SERVICES.map((_, i) => (
          <Capsule key={SERVICES[i].id} index={i} />
        ))}
        {/* The orbital plane, stated with a single hairline. */}
        <mesh
          ref={guide}
          material={guideMaterial}
          rotation={[Math.PI / 2, 0, 0]}
          /* Sits level with the capsule footings, not the capsule centres. */
          position={[0, CAPSULE_FOOT_Y, 0]}
          visible={false}
        >
          <torusGeometry args={[RING_RADIUS, 0.0016, 4, 220]} />
        </mesh>
      </group>
    </group>
  )
}
