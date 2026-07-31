import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../../sequence/stageState'
import { WAFER_SIZE } from '../layout'

/**
 * Surface-mount components — the parts sitting *on* the board.
 *
 * This is what separates a real board from a drawing of one. Traces alone
 * are lines on a plane, and lines on a plane read as a vector graphic no
 * matter how they are lit. Chips, capacitors, connector rows and pads give
 * the surface topology: they occlude each other, cast highlights, and catch
 * the light at different angles as the camera moves.
 *
 * Two instanced meshes per layer — dark machined bodies, and an emissive
 * strip on each — so the whole populated board costs two draw calls.
 */

const BODY_COUNT = 32

interface Part {
  x: number
  z: number
  w: number
  d: number
  h: number
  rot: number
  /** Bright parts read as active silicon; dark ones as passives. */
  lit: number
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Lays out parts in one quadrant and mirrors them, matching the routing. */
function buildParts(seed: number): Part[] {
  const rand = mulberry32(seed)
  const parts: Part[] = []
  const half = WAFER_SIZE / 2
  const clear = WAFER_SIZE * 0.17

  while (parts.length < BODY_COUNT) {
    const x = (0.1 + rand() * 0.82) * half
    const z = (0.1 + rand() * 0.82) * half
    if (Math.hypot(x, z) < clear) continue

    const kind = rand()
    // A realistic mix: a few larger ICs, many small passives, some
    // connector rows. Uniform blocks look like a placeholder.
    const w = kind < 0.14 ? 0.1 + rand() * 0.06 : kind < 0.55 ? 0.03 + rand() * 0.02 : 0.05 + rand() * 0.05
    const d = kind < 0.14 ? 0.09 + rand() * 0.05 : kind < 0.55 ? 0.018 + rand() * 0.012 : 0.02 + rand() * 0.015
    // Taller than scale-accurate on purpose: at this camera distance a
    // true-to-life 0.5mm passive is a pixel, and the whole point of the
    // parts is that they have visible height.
    const h = kind < 0.14 ? 0.03 + rand() * 0.016 : 0.014 + rand() * 0.012

    const p: Part = {
      x,
      z,
      w,
      d,
      h,
      rot: rand() < 0.5 ? 0 : Math.PI / 2,
      lit: kind < 0.14 ? 1 : rand() < 0.35 ? 0.6 : 0,
    }

    // Four-fold, matching the copper.
    parts.push(p)
    parts.push({ ...p, x: p.z, z: -p.x, rot: p.rot + Math.PI / 2 })
    parts.push({ ...p, x: -p.x, z: -p.z })
    parts.push({ ...p, x: -p.z, z: p.x, rot: p.rot + Math.PI / 2 })
  }

  return parts
}

export function Components({
  index,
  seed,
  accent,
}: {
  index: number
  seed: number
  accent: string
}) {
  const bodies = useRef<THREE.InstancedMesh>(null)
  const strips = useRef<THREE.InstancedMesh>(null)

  const parts = useMemo(() => buildParts(seed), [seed])

  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0a1420'),
        metalness: 0.85,
        roughness: 0.28,
        envMapIntensity: 2.2,
      }),
    [],
  )

  const stripMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accent),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [accent],
  )

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const pos = new THREE.Vector3()
    const scale = new THREE.Vector3()
    const colour = new THREE.Color()
    const lit = new THREE.Color(accent)

    parts.forEach((p, i) => {
      q.setFromEuler(new THREE.Euler(0, p.rot, 0))

      pos.set(p.x, p.h / 2, p.z)
      scale.set(p.w, p.h, p.d)
      m.compose(pos, q, scale)
      bodies.current?.setMatrixAt(i, m)

      // Active parts get a slightly cooler body so they read as silicon.
      colour.set(p.lit > 0 ? '#0e1c2e' : '#060c14')
      bodies.current?.setColorAt(i, colour)

      // The emissive strip sits on the top face of the part.
      pos.set(p.x, p.h + 0.0012, p.z)
      scale.set(p.w * 0.42, 0.001, p.d * 0.3)
      m.compose(pos, q, scale)
      strips.current?.setMatrixAt(i, m)
      strips.current?.setColorAt(i, p.lit > 0 ? lit : colour.set('#05080d'))
    })

    if (bodies.current) {
      bodies.current.instanceMatrix.needsUpdate = true
      if (bodies.current.instanceColor) bodies.current.instanceColor.needsUpdate = true
    }
    if (strips.current) {
      strips.current.instanceMatrix.needsUpdate = true
      if (strips.current.instanceColor) strips.current.instanceColor.needsUpdate = true
    }
  }, [parts, accent])

  useFrame(() => {
    const reveal = S.systems
    const energy = S.sub[index]
    const flare = S.flare[index]
    const fade = 1 - S.recede * 0.6

    if (bodies.current) bodies.current.visible = reveal > 0.01
    if (strips.current) strips.current.visible = reveal > 0.01

    bodyMaterial.envMapIntensity = (1.6 + energy * 1.4) * fade
    stripMaterial.opacity = (0.12 + energy * 0.85 + flare * 0.6) * reveal * fade
  })

  return (
    <group>
      <instancedMesh
        ref={bodies}
        args={[undefined, undefined, parts.length]}
        material={bodyMaterial}
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      <instancedMesh
        ref={strips}
        args={[undefined, undefined, parts.length]}
        material={stripMaterial}
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  )
}
