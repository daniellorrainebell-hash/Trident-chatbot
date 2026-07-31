import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../../sequence/stageState'

/**
 * The five subsystem glyphs.
 *
 * Each is procedural geometry sized to sit inside a capsule. They are built
 * to be legible in silhouette at phone scale — a shape you can read at 40px
 * is worth more here than detail nobody will ever see.
 *
 * Each glyph reads its own activation straight out of the stage state by
 * index, so a subsystem lighting up never touches React.
 *   S.sub[i]   — activation, 0–1
 *   S.flare[i] — momentary spike as the workflow packet passes through
 */

export interface GlyphProps {
  index: number
  accent: string
}

function useGlowMaterial(accent: string) {
  return useMemo(
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
}

/* ── AI Voice Receptionists — concentric waveform rings + a responsive column ── */
export function VoiceGlyph({ index, accent }: GlyphProps) {
  const mat = useGlowMaterial(accent)
  const bars = useRef<(THREE.Mesh | null)[]>([])
  const rings = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const energy = S.sub[index]
    const flare = S.flare[index]
    mat.opacity = energy * (0.7 + flare * 0.9)

    bars.current.forEach((b, i) => {
      if (!b) return
      // A speaking cadence rather than a flat oscillation.
      const v = 0.35 + Math.abs(Math.sin(t * 2.6 + i * 0.9)) * 0.5 + Math.sin(t * 1.3 + i) * 0.15
      b.scale.y = Math.max(0.08, v * energy * (1 + flare))
    })
    if (rings.current) rings.current.rotation.z = t * 0.35
  })

  return (
    <group>
      <group ref={rings}>
        {[0.028, 0.042, 0.056].map((r, i) => (
          <mesh key={i} material={mat} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.0016, 4, 40, Math.PI * 1.35]} />
          </mesh>
        ))}
      </group>
      {[-2, -1, 0, 1, 2].map((i) => (
        <mesh
          key={i}
          material={mat}
          position={[i * 0.011, 0, 0]}
          ref={(el) => {
            bars.current[i + 2] = el
          }}
        >
          <boxGeometry args={[0.0035, 0.055, 0.0035]} />
        </mesh>
      ))}
    </group>
  )
}

/* ── Speed to Lead Agents — a forward-raked vector head with velocity trail ── */
export function SpeedGlyph({ index, accent }: GlyphProps) {
  const mat = useGlowMaterial(accent)
  const head = useRef<THREE.Mesh>(null)
  const trail = useRef<(THREE.Mesh | null)[]>([])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const energy = S.sub[index]
    const flare = S.flare[index]
    mat.opacity = energy * (0.72 + flare)

    if (head.current) head.current.position.y = 0.018 + Math.sin(t * 1.6) * 0.006
    trail.current.forEach((m, i) => {
      if (!m) return
      const p = (t * 0.55 + i * 0.33) % 1
      m.position.y = 0.02 - p * 0.09
      m.scale.setScalar((1 - p) * energy)
    })
  })

  return (
    <group rotation={[0.25, 0, 0]}>
      <mesh ref={head} material={mat}>
        <coneGeometry args={[0.026, 0.05, 3]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          material={mat}
          ref={(el) => {
            trail.current[i] = el
          }}
        >
          <boxGeometry args={[0.03, 0.0018, 0.0018]} />
        </mesh>
      ))}
    </group>
  )
}

/* ── Intelligent Chatbots — two interleaving arcs exchanging signal ── */
export function ChatGlyph({ index, accent }: GlyphProps) {
  const mat = useGlowMaterial(accent)
  const a = useRef<THREE.Mesh>(null)
  const b = useRef<THREE.Mesh>(null)
  const token = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const energy = S.sub[index]
    const flare = S.flare[index]
    mat.opacity = energy * (0.7 + flare * 0.95)

    if (a.current) a.current.rotation.z = t * 0.5
    if (b.current) b.current.rotation.z = -t * 0.5 + Math.PI
    if (token.current) {
      // A token passing back and forth between the two arcs.
      token.current.position.x = Math.sin(t * 1.9) * 0.038
      token.current.scale.setScalar(energy * (0.7 + flare))
    }
  })

  return (
    <group>
      <mesh ref={a} material={mat} position={[-0.016, 0.008, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.034, 0.0018, 4, 44, Math.PI * 1.1]} />
      </mesh>
      <mesh ref={b} material={mat} position={[0.016, -0.008, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.034, 0.0018, 4, 44, Math.PI * 1.1]} />
      </mesh>
      <mesh ref={token} material={mat}>
        <sphereGeometry args={[0.005, 10, 10]} />
      </mesh>
    </group>
  )
}

/* ── Reputation Management — a radial aperture whose blades open ── */
const APERTURE_BLADES = 6

export function ReputationGlyph({ index, accent }: GlyphProps) {
  const mat = useGlowMaterial(accent)
  const blades = useRef<(THREE.Group | null)[]>([])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const energy = S.sub[index]
    const flare = S.flare[index]
    mat.opacity = energy * (0.68 + flare)

    const open = energy * (0.7 + Math.sin(t * 0.8) * 0.12 + flare * 0.4)
    blades.current.forEach((g, i) => {
      if (!g) return
      g.rotation.z = (i / APERTURE_BLADES) * Math.PI * 2 + t * 0.16
      const blade = g.children[0]
      if (blade) blade.position.x = 0.018 + open * 0.03
    })
  })

  return (
    <group>
      {Array.from({ length: APERTURE_BLADES }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            blades.current[i] = el
          }}
        >
          <mesh material={mat} position={[0.03, 0, 0]}>
            <boxGeometry args={[0.026, 0.0022, 0.0022]} />
          </mesh>
        </group>
      ))}
      <mesh material={mat}>
        <sphereGeometry args={[0.008, 12, 12]} />
      </mesh>
    </group>
  )
}

/* ── Custom Automation — interlocking rotors clicking into assembly ── */
export function AutomationGlyph({ index, accent }: GlyphProps) {
  const mat = useGlowMaterial(accent)
  const rotors = useRef<(THREE.Mesh | null)[]>([])

  const specs = useMemo(
    () =>
      [
        { r: 0.05, teeth: 12, speed: 0.6, pos: [0, 0, 0] },
        { r: 0.03, teeth: 8, speed: -1.0, pos: [0.062, 0.018, 0] },
        { r: 0.024, teeth: 6, speed: 1.25, pos: [-0.055, -0.026, 0] },
      ] as { r: number; teeth: number; speed: number; pos: [number, number, number] }[],
    [],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const energy = S.sub[index]
    const flare = S.flare[index]
    mat.opacity = energy * (0.7 + flare * 0.9)

    rotors.current.forEach((m, i) => {
      if (!m) return
      m.rotation.z = t * specs[i].speed
      m.scale.setScalar(energy)
    })
  })

  return (
    <group scale={0.62}>
      {specs.map((s, i) => (
        <mesh
          key={i}
          material={mat}
          position={s.pos}
          rotation={[Math.PI / 2, 0, 0]}
          ref={(el) => {
            rotors.current[i] = el
          }}
        >
          <torusGeometry args={[s.r, 0.0022, 4, s.teeth * 2]} />
        </mesh>
      ))}
    </group>
  )
}

export const GLYPHS = {
  voice: VoiceGlyph,
  speed: SpeedGlyph,
  chat: ChatGlyph,
  reputation: ReputationGlyph,
  automation: AutomationGlyph,
} as const

export type GlyphId = keyof typeof GLYPHS
