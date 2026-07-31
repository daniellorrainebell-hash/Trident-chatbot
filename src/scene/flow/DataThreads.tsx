import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SERVICES } from '../../config/brand'
import { S } from '../../sequence/stageState'
import { orbitAngle, RING_TILT, SUBSYSTEM_POSITIONS } from '../layout'

/**
 * The light threads binding each subsystem back to the core.
 *
 * Each thread carries a travelling luminous band along its length. Crucially
 * the bands run at slightly different rates and phases, so the system reads
 * as five processes running concurrently rather than one animation played
 * five times.
 */

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const frag = /* glsl */ `
uniform float uTime;
uniform float uEnergy;
uniform float uFlare;
uniform float uSpeed;
uniform float uPhase;
uniform vec3  uColor;
varying vec2 vUv;

void main() {
  // Travel from the subsystem inward to the core.
  float head = fract(vUv.x - uTime * uSpeed + uPhase);
  float band = exp(-pow((head - 0.5) * 7.0, 2.0));

  // A second, fainter band keeps the line feeling continuously busy.
  float head2 = fract(vUv.x - uTime * uSpeed * 0.6 + uPhase + 0.5);
  float band2 = exp(-pow((head2 - 0.5) * 11.0, 2.0)) * 0.4;

  // Taper both ends so threads emerge and land rather than stopping dead.
  float taper = smoothstep(0.0, 0.09, vUv.x) * smoothstep(1.0, 0.9, vUv.x);

  float a = (0.1 + band + band2 + uFlare * 0.9) * uEnergy * taper;
  if (a <= 0.002) discard;
  gl_FragColor = vec4(uColor * (1.0 + uFlare), a);
}
`

function Thread({ index }: { index: number }) {
  const service = SERVICES[index]
  const mat = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const from = SUBSYSTEM_POSITIONS[index].clone()
    const to = new THREE.Vector3(0, 0, 0)

    // Bow the thread outward and upward so five of them read as distinct
    // arcs instead of a flat asterisk through the middle of the frame.
    const mid = from.clone().lerp(to, 0.5)
    mid.y += 0.22
    mid.multiplyScalar(1.08)

    const curve = new THREE.QuadraticBezierCurve3(from, mid, to)
    return new THREE.TubeGeometry(curve, 44, 0.0032, 5, false)
  }, [index])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uFlare: { value: 0 },
      uSpeed: { value: 0.2 + index * 0.021 },
      uPhase: { value: (index * 0.37) % 1 },
      uColor: { value: new THREE.Color(service.accent) },
    }),
    [index, service.accent],
  )

  useFrame((_, dt) => {
    const m = mat.current
    if (!m) return
    m.uniforms.uTime.value += dt
    m.uniforms.uEnergy.value = S.thread[index] * (1 - S.recede * 0.8)
    m.uniforms.uFlare.value = S.flare[index]
  })

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={mat}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export function DataThreads() {
  const orbit = useRef<THREE.Group>(null)

  // Threads live in the same rotating frame as the capsules they connect to.
  useFrame(({ clock }) => {
    if (orbit.current) orbit.current.rotation.y = orbitAngle(clock.elapsedTime)
  })

  return (
    <group rotation={[RING_TILT, 0, 0.06]}>
      <group ref={orbit}>
        {SERVICES.map((s, i) => (
          <Thread key={s.id} index={i} />
        ))}
      </group>
    </group>
  )
}
