import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../../sequence/stageState'
import { buildWorkflowCurve, orbitAngle, RING_TILT } from '../layout'

/**
 * The enquiry.
 *
 * A single luminous packet travelling the real route through the system:
 * in from off-frame, first contact, qualification, the core, follow-up,
 * confirmation, reputation. One object carrying one job is far more
 * legible than a swarm — and it's the whole point of Sequence D.
 *
 * `S.packetGain` accretes structure as the enquiry qualifies: it grows and
 * gains a second, counter-rotating shell. The data becomes more valuable
 * as it moves, and you can see it happen.
 */

const TRAIL = 14

export function Packet() {
  const orbit = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Mesh>(null)
  const outer = useRef<THREE.Mesh>(null)
  const trail = useRef<(THREE.Mesh | null)[]>([])
  const light = useRef<THREE.PointLight>(null)

  const curve = useMemo(() => buildWorkflowCurve(), [])

  const coreMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#eaf8ff'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  const shellMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#5cc8ff'),
        transparent: true,
        opacity: 0,
        wireframe: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  const trailMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#7fd8ff'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (orbit.current) orbit.current.rotation.y = orbitAngle(t)

    const p = S.packet
    const live = p >= 0 && p <= 1

    if (body.current) body.current.visible = live
    if (light.current) light.current.visible = live
    if (!live) {
      coreMaterial.opacity = 0
      shellMaterial.opacity = 0
      trailMaterial.opacity = 0
      return
    }

    const gain = S.packetGain

    curve.getPointAt(Math.min(1, Math.max(0, p)), tmp)
    if (body.current) body.current.position.copy(tmp)

    // Fade in on entry and settle on arrival, so it never pops.
    const envelope = Math.min(1, p * 12) * Math.min(1, (1 - p) * 9 + 0.25)

    coreMaterial.opacity = envelope * (0.9 + S.confirm * 0.6)
    shellMaterial.opacity = envelope * gain * 0.65
    trailMaterial.opacity = envelope * 0.35

    if (inner.current) {
      inner.current.rotation.y = t * 1.4
      inner.current.rotation.x = t * 0.9
      inner.current.scale.setScalar(0.7 + gain * 0.55 + S.confirm * 0.3)
    }
    if (outer.current) {
      outer.current.rotation.y = -t * 0.8
      outer.current.rotation.z = t * 0.5
      outer.current.scale.setScalar(1 + gain * 0.9)
    }
    if (light.current) {
      light.current.intensity = envelope * (1.6 + gain * 1.8 + S.confirm * 3)
    }

    // Trail samples the curve behind the packet — a real path, not a blur.
    trail.current.forEach((m, i) => {
      if (!m) return
      const back = p - (i + 1) * 0.006
      if (back < 0) {
        m.visible = false
        return
      }
      m.visible = true
      curve.getPointAt(back, tmp)
      m.position.copy(tmp)
      m.scale.setScalar((1 - i / TRAIL) * 0.5 * envelope)
    })
  })

  return (
    <group rotation={[RING_TILT, 0, 0.06]}>
      <group ref={orbit}>
        <group ref={body} visible={false}>
          <mesh ref={inner} material={coreMaterial}>
            <icosahedronGeometry args={[0.022, 0]} />
          </mesh>
          <mesh ref={outer} material={shellMaterial}>
            <icosahedronGeometry args={[0.04, 0]} />
          </mesh>
          <pointLight ref={light} color="#8fe0ff" distance={1.2} decay={2} intensity={0} />
        </group>

        {Array.from({ length: TRAIL }, (_, i) => (
          <mesh
            key={i}
            material={trailMaterial}
            ref={(el) => {
              trail.current[i] = el
            }}
          >
            <sphereGeometry args={[0.008, 6, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
