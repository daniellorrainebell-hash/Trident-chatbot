import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../../sequence/stageState'
import { useExperience } from '../../state/useExperience'

/**
 * Suspended motes.
 *
 * Restraint is the entire brief here: these exist to give the volume air
 * and scale, not to be a particle effect. They drift slowly, most of them
 * sit far enough back to be soft, and they never form patterns.
 *
 * In Sequence A they also do real work — converging inward to seed the
 * ignition point before the core exists.
 */

const vert = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uConverge;
uniform float uPixelRatio;

attribute float aScale;
attribute float aPhase;
attribute vec3  aDrift;

varying float vFade;

void main() {
  vec3 p = position;

  // Independent slow drift per mote.
  p += aDrift * sin(uTime * 0.12 + aPhase) * 0.35;
  p.y += sin(uTime * 0.09 + aPhase * 1.7) * 0.12;

  // Sequence A: everything falls toward the ignition point.
  p = mix(p, normalize(p) * 0.06, uConverge);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);

  // Depth fade — distant motes sit back in the volume instead of sparkling.
  vFade = smoothstep(16.0, 1.4, -mv.z);

  gl_PointSize = uSize * aScale * uPixelRatio * (1.0 / max(0.35, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`

const frag = /* glsl */ `
uniform float uOpacity;
uniform vec3  uColor;
varying float vFade;

void main() {
  // Soft round sprite, no texture needed.
  vec2 d = gl_PointCoord - 0.5;
  float r = dot(d, d);
  float a = smoothstep(0.25, 0.0, r);
  a *= uOpacity * vFade;
  if (a <= 0.003) discard;
  gl_FragColor = vec4(uColor, a);
}
`

export function Motes() {
  const count = useExperience((s) => s.tier.motes)
  const mat = useRef<THREE.ShaderMaterial>(null)
  const group = useRef<THREE.Group>(null)

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const scale = new Float32Array(count)
    const phase = new Float32Array(count)
    const drift = new Float32Array(count * 3)

    let seed = 8675309
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }

    for (let i = 0; i < count; i++) {
      // Distributed through a shell around the core, biased outward so the
      // hero object keeps clean air around it.
      const r = 1.1 + Math.pow(rand(), 0.55) * 4.6
      const theta = rand() * Math.PI * 2
      const u = rand() * 2 - 1
      const s = Math.sqrt(1 - u * u)
      pos[i * 3] = Math.cos(theta) * s * r
      pos[i * 3 + 1] = u * r * 0.72
      pos[i * 3 + 2] = Math.sin(theta) * s * r

      scale[i] = 0.35 + rand() * 1.1
      phase[i] = rand() * Math.PI * 2
      drift[i * 3] = rand() - 0.5
      drift[i * 3 + 1] = rand() - 0.5
      drift[i * 3 + 2] = rand() - 0.5
    }

    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aScale', new THREE.BufferAttribute(scale, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    g.setAttribute('aDrift', new THREE.BufferAttribute(drift, 3))
    return g
  }, [count])

  // The renderer's own pixel ratio, not the window's — the tier may have
  // clamped it, and using the wrong one makes motes twice the intended size.
  const pixelRatio = useThree((s) => s.gl.getPixelRatio())

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 7.5 },
      uConverge: { value: 0 },
      uOpacity: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uColor: { value: new THREE.Color('#a8dcff') },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    uniforms.uPixelRatio.value = pixelRatio
  }, [pixelRatio, uniforms])

  useFrame(({ clock }, dt) => {
    const m = mat.current
    if (!m) return
    m.uniforms.uTime.value += dt
    m.uniforms.uOpacity.value = S.motes * 0.55
    // Converge only while the core has yet to ignite.
    m.uniforms.uConverge.value = Math.max(0, S.motes - S.ignition * 1.4) * 0.55

    if (group.current) group.current.rotation.y = clock.elapsedTime * 0.008
  })

  return (
    <group ref={group}>
      <points geometry={geometry}>
        <shaderMaterial
          ref={mat}
          vertexShader={vert}
          fragmentShader={frag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
