import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../../sequence/stageState'
import { buildWorkflowCurve } from '../layout'

/**
 * The enquiry.
 *
 * A single point of light routing across the copper and dropping through
 * the stack layer by layer until it reaches the die. One object doing one
 * job — a swarm would say nothing, and a descent through five visible
 * layers says exactly what the system does.
 *
 * `S.packetGain` brightens and lengthens the trail as the enquiry qualifies,
 * so it visibly carries more by the time it lands.
 */

const TRAIL = 20

export function Packet() {
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Mesh>(null)
  const trail = useRef<(THREE.Mesh | null)[]>([])
  const light = useRef<THREE.PointLight>(null)

  const curve = useMemo(() => buildWorkflowCurve(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  const headMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#bfe6ff'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  const trailMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#2e9bff'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useFrame(({ clock }) => {
    const p = S.packet
    const live = p >= 0 && p <= 1

    if (body.current) body.current.visible = live
    if (!live) {
      headMaterial.opacity = 0
      trailMaterial.opacity = 0
      return
    }

    const gain = S.packetGain
    const t = clock.elapsedTime

    curve.getPointAt(Math.min(1, Math.max(0, p)), tmp)
    if (body.current) body.current.position.copy(tmp)

    // Ease in on arrival and settle on landing, so it never pops.
    const envelope = Math.min(1, p * 14) * Math.min(1, (1 - p) * 10 + 0.3)

    headMaterial.opacity = envelope * 0.72
    trailMaterial.opacity = envelope * (0.4 + gain * 0.35)

    if (head.current) {
      head.current.scale.setScalar(0.8 + gain * 0.5 + Math.sin(t * 9) * 0.05)
    }
    if (light.current) light.current.intensity = envelope * (1.4 + gain * 2.2)

    // The trail samples the curve behind the head — it follows the real
    // route, including the drops between layers.
    const spacing = 0.0045 + gain * 0.003
    trail.current.forEach((m, i) => {
      if (!m) return
      const back = p - (i + 1) * spacing
      if (back < 0) {
        m.visible = false
        return
      }
      m.visible = true
      curve.getPointAt(back, tmp)
      m.position.copy(tmp)
      m.scale.setScalar((1 - i / TRAIL) * 0.55 * envelope)
    })
  })

  return (
    <group>
      <group ref={body} visible={false}>
        <mesh ref={head} material={headMaterial}>
          <sphereGeometry args={[0.017, 12, 12]} />
        </mesh>
        <pointLight ref={light} color="#8fe0ff" distance={1.1} decay={2} intensity={0} />
      </group>

      {Array.from({ length: TRAIL }, (_, i) => (
        <mesh
          key={i}
          material={trailMaterial}
          ref={(el) => {
            trail.current[i] = el
          }}
        >
          <sphereGeometry args={[0.0075, 6, 6]} />
        </mesh>
      ))}
    </group>
  )
}
