import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../sequence/stageState'
import { useExperience } from '../state/useExperience'

/**
 * Camera choreography.
 *
 * The director tweens spherical coordinates; this converts them to a
 * position every frame and adds the layer that actually separates
 * "cinematic" from "demo" — a small amount of handheld noise.
 *
 * Three incommensurable sine pairs give drift that never repeats and never
 * looks like a sine wave. Amplitude is tiny (sub-degree) on purpose: you
 * should feel an operator behind the lens, not notice a wobble.
 */

const HANDHELD = [
  { freq: 0.31, amp: 0.0075 },
  { freq: 0.73, amp: 0.0034 },
  { freq: 1.27, amp: 0.0016 },
]

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const reducedMotion = useExperience((s) => s.reducedMotion)

  /**
   * Framing compensation. 9:16 is the design aspect; on a taller viewport
   * (some Androids, browser chrome collapsing) the horizontal field is
   * narrower still, so the camera pulls back to keep the composition
   * intact rather than cropping the orbital ring.
   */
  const aspectComp =
    size.height > 0
      ? THREE.MathUtils.clamp(0.5625 / (size.width / size.height), 0.88, 1.3)
      : 1

  const target = useRef(new THREE.Vector3())
  const pos = useRef(new THREE.Vector3())
  const smoothed = useRef(new THREE.Vector3())
  const initialised = useRef(false)

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const c = S.cam

    const theta = c.theta + c.userTheta
    const phi = THREE.MathUtils.clamp(c.phi + c.userPhi, -0.85, 0.95)

    // Spherical → cartesian.
    const r = c.radius * aspectComp
    pos.current.set(
      r * Math.cos(phi) * Math.sin(theta),
      r * Math.sin(phi) + c.targetY * 0.35,
      r * Math.cos(phi) * Math.cos(theta),
    )

    if (!initialised.current) {
      smoothed.current.copy(pos.current)
      initialised.current = true
    }

    // A touch of inertia. Keeps GSAP's easing honest and makes manual
    // orbiting in interactive mode feel weighted rather than glued.
    const lerp = 1 - Math.pow(0.0015, dt)
    smoothed.current.lerp(pos.current, lerp)
    camera.position.copy(smoothed.current)

    if (!reducedMotion && c.handheld > 0) {
      let nx = 0
      let ny = 0
      for (const h of HANDHELD) {
        nx += Math.sin(t * h.freq * 2.13 + 1.7) * h.amp
        ny += Math.cos(t * h.freq * 1.61) * h.amp
      }
      camera.position.x += nx * c.handheld * r * 0.5
      camera.position.y += ny * c.handheld * r * 0.5
    }

    target.current.set(0, c.targetY, 0)
    camera.lookAt(target.current)

    if (Math.abs(camera.fov - c.fov) > 0.001) {
      camera.fov = c.fov
      camera.updateProjectionMatrix()
    }
  })

  return null
}
