import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { S } from '../../sequence/stageState'
import { useExperience } from '../../state/useExperience'
import { CORE_RADIUS, SHELL_SCALE_Y } from '../layout'

/**
 * The glass shell — a cut, faceted lens rather than a sphere.
 *
 * A dodecahedron read flat gives twelve clean pentagonal facets; elongated
 * on Y it stops reading as jewellery and starts reading as an instrument.
 * The facets matter more than they look: they catch the studio lightformers
 * as long straight specular streaks, and that streak is the single strongest
 * cue that a surface is real glass rather than a shader trick.
 *
 * Crystallisation is two stages — the facet edges draw themselves in first,
 * then the solid glass fills between them.
 */

const SHELL_R = CORE_RADIUS

export function GlassShell() {
  const tier = useExperience((s) => s.tier)
  const group = useRef<THREE.Group>(null)
  const solid = useRef<THREE.Mesh>(null)
  const edges = useRef<THREE.LineSegments>(null)
  const edgeMat = useRef<THREE.LineBasicMaterial>(null)

  const geo = useMemo(() => new THREE.DodecahedronGeometry(SHELL_R, 0), [])
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(geo, 1), [geo])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    if (group.current) {
      // Slow drift plus a shallow nod, so the facets keep sweeping through
      // the key light instead of holding one static highlight.
      group.current.rotation.y = t * 0.062
      group.current.rotation.x = Math.sin(t * 0.21) * 0.05
      group.current.rotation.z = Math.cos(t * 0.17) * 0.03
    }

    if (solid.current) {
      const form = S.shellSolid
      const breathe = 1 + Math.sin(t * 0.9) * 0.008
      const s = form * breathe * (1 + S.pulse * 0.035)
      solid.current.scale.set(s, s * SHELL_SCALE_Y, s)
      solid.current.visible = form > 0.01
    }

    if (edges.current && edgeMat.current) {
      const e = S.shellEdges
      const s = Math.max(0.0001, e)
      edges.current.scale.set(s, s * SHELL_SCALE_Y, s)
      // The tracery fades as the solid glass takes over, leaving only a
      // faint hairline on the bevels.
      edgeMat.current.opacity = e * (1 - S.shellSolid * 0.82) * (1 - S.recede * 0.5)
      edges.current.visible = edgeMat.current.opacity > 0.005
    }
  })

  return (
    <group ref={group}>
      <lineSegments ref={edges} geometry={edgeGeo}>
        <lineBasicMaterial
          ref={edgeMat}
          color="#9fe6ff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <mesh ref={solid} geometry={geo} visible={false}>
        {tier.transmission ? (
          <MeshTransmissionMaterial
            samples={tier.transmissionSamples}
            resolution={tier.transmissionResolution}
            backside={tier.backside}
            backsideThickness={0.4}
            transmission={1}
            /* Thin and lightly attenuated. Heavier values turn the shell
               into a solid blue block and bury the core it exists to
               reveal — the glass has to stay a lens, not become the
               subject. */
            thickness={0.45}
            roughness={0.17}
            ior={1.6}
            chromaticAberration={0.045}
            anisotropy={0.15}
            /* Distortion is the main source of sampling speckle, so it stays
               low; the facets already break the refraction up. */
            distortion={0.04}
            distortionScale={0.15}
            temporalDistortion={0}
            clearcoat={0.35}
            clearcoatRoughness={0.18}
            attenuationDistance={3.2}
            attenuationColor="#8fc4e8"
            color="#eaf6ff"
            flatShading
          />
        ) : (
          // Tier C — no transmission pass. Reflective physical glass with a
          // fresnel-weighted rim reads convincingly at this size and costs
          // a fraction of the frame budget.
          <meshPhysicalMaterial
            color="#0a1526"
            metalness={0.1}
            roughness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.05}
            transparent
            opacity={0.42}
            envMapIntensity={2.4}
            flatShading
          />
        )}
      </mesh>
    </group>
  )
}
