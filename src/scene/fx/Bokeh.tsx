import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../../sequence/stageState'
import { STACK_HEIGHT, WAFER_SIZE } from '../layout'

/**
 * Bokeh points.
 *
 * Small emissive spheres scattered through the volume around the board.
 * They are not decoration — they are what makes the depth of field visible.
 * A defocused *point* of light renders as a soft disc, and those discs are
 * the single most recognisable signature of a modern render. Without
 * something bright and small at varying depths, DOF has nothing to act on
 * and the shot just looks slightly soft.
 *
 * Deliberately real geometry with depth writing, not sprites: the DOF pass
 * reads the depth buffer, so a point that doesn't write depth never gets
 * blurred correctly.
 */

const COUNT = 42

export function Bokeh({ accent = '#4fb8ff' }: { accent?: string }) {
  const mesh = useRef<THREE.InstancedMesh>(null)

  const points = useMemo(() => {
    let seed = 90210
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }

    return Array.from({ length: COUNT }, () => {
      const angle = rand() * Math.PI * 2
      // Biased outward so the board itself stays clear.
      const radius = WAFER_SIZE * (0.55 + Math.pow(rand(), 0.5) * 1.3)
      return {
        x: Math.cos(angle) * radius,
        y: (rand() - 0.42) * STACK_HEIGHT * 2.6,
        z: Math.sin(angle) * radius,
        scale: 0.004 + Math.pow(rand(), 2.6) * 0.017,
        phase: rand() * Math.PI * 2,
        rate: 0.25 + rand() * 0.5,
        warm: rand() < 0.16,
      }
    })
  }, [])

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffffff'),
        transparent: true,
        opacity: 0,
        toneMapped: false,
      }),
    [],
  )

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const pos = new THREE.Vector3()
    const scale = new THREE.Vector3()
    const c = new THREE.Color()
    const cool = new THREE.Color(accent)
    // A handful of warm points stop the palette reading as a single filter.
    const warm = new THREE.Color('#ffd9a8')

    points.forEach((p, i) => {
      pos.set(p.x, p.y, p.z)
      scale.setScalar(p.scale)
      m.compose(pos, q, scale)
      mesh.current?.setMatrixAt(i, m)
      c.copy(p.warm ? warm : cool).lerp(new THREE.Color('#ffffff'), 0.35)
      mesh.current?.setColorAt(i, c)
    })

    if (mesh.current) {
      mesh.current.instanceMatrix.needsUpdate = true
      if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    }
  }, [points, accent])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const live = S.systems * (1 - S.recede * 0.5)
    if (mesh.current) mesh.current.visible = live > 0.01
    // A slow, uneven twinkle. Uniform brightness reads as a texture; uneven
    // reads as light in a room.
    material.opacity = live * (0.4 + Math.sin(t * 0.7) * 0.06)
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} material={material}>
      <sphereGeometry args={[1, 8, 8]} />
    </instancedMesh>
  )
}
