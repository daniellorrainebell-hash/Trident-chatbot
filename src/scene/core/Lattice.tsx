import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../../sequence/stageState'

/**
 * The suspended internal structure — the watch-movement layer.
 *
 * These filaments stay almost black. They are not there to glow; they are
 * there to catch a hard specular line and give the object precision and
 * weight. Everything premium about a real luxury product comes from
 * machined detail sitting in shadow, not from more light.
 */

const ARC_COUNT = 7

export function Lattice() {
  const group = useRef<THREE.Group>(null)
  const traceGroup = useRef<THREE.Group>(null)

  const arcs = useMemo(() => {
    const rng = mulberry32(20260731)
    return Array.from({ length: ARC_COUNT }, (_, i) => ({
      radius: 0.32 + (i / ARC_COUNT) * 0.11,
      tube: 0.0022 + rng() * 0.0016,
      arc: Math.PI * (0.7 + rng() * 0.9),
      rotation: new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
      speed: (rng() - 0.5) * 0.14,
    }))
  }, [])

  /** One shared material instance — animating four refs in lockstep would
   *  be four times the work for an identical result. */
  const traceMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#8fe4ff'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  const traces = useMemo(() => {
    const rng = mulberry32(881122)
    return Array.from({ length: 4 }, (_, i) => ({
      radius: 0.355 + i * 0.022,
      arc: Math.PI * (0.35 + rng() * 0.4),
      rotation: new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
      phase: rng() * Math.PI * 2,
    }))
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const reveal = S.lattice

    if (group.current) {
      group.current.scale.setScalar(Math.max(0.0001, reveal))
      group.current.visible = reveal > 0.01
      group.current.rotation.y = -t * 0.035
      group.current.children.forEach((child, i) => {
        const a = arcs[i]
        if (a) child.rotation.z = a.rotation.z + t * a.speed
      })
    }

    // Traces pulse against each other rather than together — a system
    // thinking, not a light blinking.
    const wave = 0.35 + Math.sin(t * 1.1) * 0.2 + Math.sin(t * 0.43) * 0.12
    traceMaterial.opacity = reveal * (wave + S.pulse * 0.8) * (1 - S.recede * 0.6)

    if (traceGroup.current) {
      traceGroup.current.scale.setScalar(Math.max(0.0001, reveal))
      traceGroup.current.visible = reveal > 0.01
      traceGroup.current.rotation.y = t * 0.09
    }
  })

  return (
    <group>
      <group ref={group}>
        {arcs.map((a, i) => (
          <mesh key={i} rotation={a.rotation}>
            <torusGeometry args={[a.radius, a.tube, 6, 90, a.arc]} />
            <meshStandardMaterial
              color="#0b1220"
              metalness={1}
              roughness={0.22}
              envMapIntensity={2.2}
            />
          </mesh>
        ))}
      </group>

      <group ref={traceGroup} visible={false}>
        {traces.map((tr, i) => (
          <mesh key={i} rotation={tr.rotation} material={traceMaterial}>
            <torusGeometry args={[tr.radius, 0.0016, 5, 70, tr.arc]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Deterministic RNG so the lattice is identical on every load and every device. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
