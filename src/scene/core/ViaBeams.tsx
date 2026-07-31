import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../../sequence/stageState'
import { LAYER_Y, STACK_HEIGHT, WAFER_SIZE } from '../layout'

/**
 * Vias — the vertical channels carrying charge between layers.
 *
 * Four columns on the diagonals, which keeps the object four-fold
 * symmetric from any angle. They do two jobs at once: they visibly connect
 * the layers into one machine, and they are the only vertical motion in an
 * object made entirely of horizontal planes.
 *
 * Charge runs *upward* from the die — the system answering, not just
 * receiving.
 */

const COLUMNS = 4
const RADIUS = WAFER_SIZE * 0.3

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
uniform float uPhase;
uniform vec3  uColor;
uniform vec3  uHot;
varying vec2 vUv;

void main() {
  // Charge climbing the column.
  float d = fract(vUv.y * 1.6 - uTime * 0.42 + uPhase);
  float pulse = pow(1.0 - d, 9.0);

  float d2 = fract(vUv.y * 1.6 - uTime * 0.19 + uPhase + 0.5);
  pulse += pow(1.0 - d2, 16.0) * 0.5;

  // Fade at both ends so the column emerges from the stack rather than
  // stopping dead at a hard edge.
  float taper = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);

  float a = (0.008 + pulse * 0.8) * uEnergy * taper;
  if (a <= 0.002) discard;

  gl_FragColor = vec4(mix(uColor, uHot, pulse), a);
}
`

function Column({ index }: { index: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null)

  const angle = (index / COLUMNS) * Math.PI * 2 + Math.PI / 4
  const position: [number, number, number] = [
    Math.cos(angle) * RADIUS,
    (LAYER_Y[0] + LAYER_Y[LAYER_Y.length - 1]) / 2,
    Math.sin(angle) * RADIUS,
  ]

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uPhase: { value: (index * 0.31) % 1 },
      uColor: { value: new THREE.Color('#2e9bff') },
      uHot: { value: new THREE.Color('#dff2ff') },
    }),
    [index],
  )

  useFrame((_, dt) => {
    const m = mat.current
    if (!m) return
    m.uniforms.uTime.value += dt
    // Columns only carry charge once the layers they connect are online.
    const lit = S.sub.reduce((a, b) => a + b, 0) / S.sub.length
    m.uniforms.uEnergy.value = lit * S.systems * (1 - S.recede * 0.85)
  })

  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.0038, 0.0038, STACK_HEIGHT * 1.15, 6, 1, true]} />
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

export function ViaBeams() {
  return (
    <group>
      {Array.from({ length: COLUMNS }, (_, i) => (
        <Column key={i} index={i} />
      ))}
    </group>
  )
}
