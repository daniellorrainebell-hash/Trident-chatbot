import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../../sequence/stageState'

/**
 * The confirmation.
 *
 * Deliberately not a tick — a checkmark would drop the whole piece into
 * generic-app territory. Instead an aperture: two arcs sweep together and
 * a ring locks closed around the core. It reads as *committed* rather than
 * *approved*, which is the truer statement about what the system just did.
 */
export function Confirm() {
  const group = useRef<THREE.Group>(null)
  const arcA = useRef<THREE.Mesh>(null)
  const arcB = useRef<THREE.Mesh>(null)
  const lock = useRef<THREE.Mesh>(null)

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#cfefff'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useFrame(() => {
    const c = S.confirm
    if (group.current) group.current.visible = c > 0.005
    if (c <= 0.005) return

    material.opacity = Math.sin(Math.min(1, c) * Math.PI) * 0.9

    // Arcs close from opposite sides; the ring contracts onto the core.
    const close = 1 - c
    if (arcA.current) arcA.current.rotation.z = close * Math.PI * 0.9
    if (arcB.current) arcB.current.rotation.z = Math.PI - close * Math.PI * 0.9
    if (lock.current) {
      const s = 1.35 - c * 0.5
      lock.current.scale.setScalar(s)
    }
  })

  return (
    <group ref={group} visible={false}>
      <mesh ref={arcA} material={material} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.62, 0.0035, 5, 80, Math.PI * 0.85]} />
      </mesh>
      <mesh ref={arcB} material={material} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.62, 0.0035, 5, 80, Math.PI * 0.85]} />
      </mesh>
      <mesh ref={lock} material={material} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.0018, 4, 90]} />
      </mesh>
    </group>
  )
}
