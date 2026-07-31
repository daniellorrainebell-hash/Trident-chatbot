import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NOISE_GLSL } from '../shaders/noise'
import { S } from '../../sequence/stageState'
import { useExperience } from '../../state/useExperience'

/**
 * The luminous heart of the object.
 *
 * Not a glowing ball: a domain-warped noise volume approximated by a few
 * nested additive shells. Because each shell samples the same field at a
 * different radius, the parallax between them reads as real internal
 * depth — far cheaper than raymarching and, on a small bright object,
 * essentially indistinguishable.
 *
 * This is the only thing in the scene bright enough to bloom.
 */

const vert = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vPos = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

const frag = /* glsl */ `
${NOISE_GLSL}

uniform float uTime;
uniform float uIgnition;
uniform float uPulse;
uniform float uShellIndex;
uniform float uHeat;
uniform float uOpacity;
uniform vec3  uDeep;
uniform vec3  uMid;
uniform vec3  uHot;

varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  // Each shell samples the same field at its own offset, so the layers
  // parallax against each other as the group turns. That parallax is what
  // reads as real internal depth rather than three stacked sprites.
  vec3 p = vPos * 2.15 + vec3(0.0, uShellIndex * 1.7, 0.0);
  float t = uTime * 0.16;

  // Domain warp — this is what stops it reading as generic noise.
  vec3 q = vec3(
    fbm(p + vec3(0.0, t, 0.0)),
    fbm(p + vec3(5.2, 1.3, 2.7) - t * 0.8),
    fbm(p + vec3(1.7, 9.2, 3.1) + t * 0.5)
  );
  float f = fbm(p + 1.75 * q + vec3(0.0, -t * 0.4, 0.0));
  f = f * 0.5 + 0.5;

  float e = pow(f, 1.6);

  // Fresnel rim. On the inner shells these rims sit *inside* the outer
  // silhouette, stacking into concentric hot cores — the cheap way to a
  // volumetric read without raymarching anything.
  float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.2);

  vec3 col = mix(uDeep, uMid, smoothstep(0.10, 0.50, e));
  col = mix(col, uHot, smoothstep(0.45, 0.95, e * (0.6 + uHeat)));

  float a = (e * (0.30 + uHeat * 0.45) + fres * (0.45 - uHeat * 0.12))
          * uOpacity * uIgnition * (0.72 + uPulse * 0.9);

  if (a <= 0.002) discard;
  gl_FragColor = vec4(col * (1.0 + uPulse * 0.7), a);
}
`

function Shell({
  index,
  radius,
  opacity,
  heat,
}: {
  index: number
  radius: number
  opacity: number
  /** 0 at the outer shell, 1 at the innermost — drives colour temperature. */
  heat: number
}) {
  const mat = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIgnition: { value: 0 },
      uPulse: { value: 0 },
      uShellIndex: { value: index },
      uHeat: { value: heat },
      uOpacity: { value: opacity },
      uDeep: { value: new THREE.Color('#03102c') },
      uMid: { value: new THREE.Color('#1a8fe6') },
      uHot: { value: new THREE.Color('#e8f7ff') },
    }),
    [index, opacity, heat],
  )

  useFrame((_, dt) => {
    const m = mat.current
    if (!m) return
    m.uniforms.uTime.value += dt
    m.uniforms.uIgnition.value = S.ignition * (1 - S.recede * 0.45)
    m.uniforms.uPulse.value = S.pulse
  })

  return (
    <mesh scale={radius}>
      <icosahedronGeometry args={[1, 5]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function InnerCore() {
  const tier = useExperience((s) => s.tier)
  const group = useRef<THREE.Group>(null)

  const shells = useMemo(() => {
    const all = [
      { r: 0.3, o: 0.9, heat: 0 },
      { r: 0.225, o: 0.8, heat: 0.55 },
      { r: 0.15, o: 0.7, heat: 1 },
    ]
    // Tier B drops the middle shell rather than the hot centre — losing the
    // core's brightest layer would change the look, not just the cost.
    return tier.coreShells >= 3 ? all : [all[0], all[2]]
  }, [tier.coreShells])

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    // A slow, irregular breath. Two incommensurable periods so it never
    // settles into a visible loop.
    const breath = 1 + Math.sin(t * 0.9) * 0.02 + Math.sin(t * 0.37) * 0.012
    group.current.scale.setScalar(breath * (1 + S.pulse * 0.09))
    group.current.rotation.y = t * 0.05
  })

  return (
    <group ref={group}>
      {shells.map((s, i) => (
        <Shell key={i} index={i} radius={s.r} opacity={s.o} heat={s.heat} />
      ))}
      {/* A practical light, so the lattice and shell actually respond to
          ignition rather than just sitting in front of a glow. */}
      <CoreLight />
    </group>
  )
}

/** Drives the practical light off the same ignition curve. */
function CoreLight() {
  const ref = useRef<THREE.PointLight>(null)
  useFrame(() => {
    if (!ref.current) return
    ref.current.intensity = (2.4 + S.pulse * 6) * S.ignition * (1 - S.recede * 0.6)
  })
  return <pointLight ref={ref} color="#7fd8ff" distance={5} decay={2} intensity={0} />
}
