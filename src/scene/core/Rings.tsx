import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../../sequence/stageState'

/**
 * Gyroscopic bands. Machined metal with a single hairline emissive inlay.
 *
 * The rates are deliberately incommensurable — 0.11, 0.073 and 0.049 never
 * come back into phase, so the silhouette never repeats over a recording.
 */

const BANDS = [
  { radius: 0.78, tube: 0.011, tilt: [0.32, 0, 0.14], speed: 0.11, inlay: true },
  { radius: 0.95, tube: 0.008, tilt: [-0.55, 0.4, 0], speed: -0.073, inlay: false },
  { radius: 0.66, tube: 0.0065, tilt: [1.15, 0, 0.5], speed: 0.049, inlay: true },
] as const

export function Rings() {
  const group = useRef<THREE.Group>(null)
  const bandRefs = useRef<(THREE.Group | null)[]>([])

  const inlayMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#79dcff'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const reveal = S.rings

    if (group.current) {
      group.current.visible = reveal > 0.01
      // Bands sweep out from the core rather than simply fading up.
      group.current.scale.setScalar(0.55 + reveal * 0.45)
    }

    bandRefs.current.forEach((band, i) => {
      if (!band) return
      const b = BANDS[i]
      band.rotation.y = t * b.speed * (0.35 + S.ringSpeed * 0.65) * Math.PI
    })

    inlayMaterial.opacity = reveal * (0.55 + S.pulse * 1.2) * (1 - S.recede * 0.55)
  })

  return (
    <group ref={group} visible={false}>
      {BANDS.map((b, i) => (
        <group key={i} rotation={[b.tilt[0], b.tilt[1], b.tilt[2]]}>
          <group
            ref={(el) => {
              bandRefs.current[i] = el
            }}
          >
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[b.radius, b.tube, 8, 160]} />
              <meshStandardMaterial
                color="#2a3646"
                metalness={1}
                roughness={0.15}
                envMapIntensity={2.6}
              />
            </mesh>
            {b.inlay && (
              <mesh rotation={[Math.PI / 2, 0, 0]} material={inlayMaterial}>
                <torusGeometry args={[b.radius + b.tube * 0.75, b.tube * 0.3, 5, 160]} />
              </mesh>
            )}
          </group>
        </group>
      ))}
    </group>
  )
}
