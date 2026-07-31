import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { NOISE_GLSL } from '../shaders/noise'
import { S } from '../../sequence/stageState'
import { DIE_SIZE } from '../layout'

/**
 * The die — the processor at the heart of the stack.
 *
 * A small machined block with a luminous interior. It is the only object in
 * the scene bright enough to bloom, and the only thing that ever sits at the
 * exact centre of frame. Everything else is arranged around it.
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
uniform vec3  uDeep;
uniform vec3  uMid;
uniform vec3  uHot;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  vec3 p = vPos * 9.0;
  float t = uTime * 0.2;

  vec3 q = vec3(
    fbm(p + vec3(0.0, t, 0.0)),
    fbm(p + vec3(4.1, 1.7, 2.3) - t * 0.7),
    fbm(p + vec3(1.3, 8.6, 3.9) + t * 0.4)
  );
  float f = fbm(p + 1.6 * q) * 0.5 + 0.5;
  float e = pow(f, 1.5);

  float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.0);

  vec3 col = mix(uDeep, uMid, smoothstep(0.15, 0.55, e));
  col = mix(col, uHot, smoothstep(0.62, 1.0, e + uPulse * 0.35));

  // Kept deliberately low. Viewed straight down, a bright emissive face on
  // a flat chip blows out and washes the top plate's circuitry away — and
  // the circuitry is the thing worth looking at.
  float a = (e * 0.2 + fres * 0.16) * uIgnition * (0.5 + uPulse * 0.6);
  if (a <= 0.002) discard;
  gl_FragColor = vec4(col * (1.0 + uPulse * 0.5), a);
}
`

export function Die() {
  const group = useRef<THREE.Group>(null)
  const mat = useRef<THREE.ShaderMaterial>(null)
  const light = useRef<THREE.PointLight>(null)

  const shellMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#161f2d'),
        metalness: 1,
        roughness: 0.22,
        envMapIntensity: 3,
      }),
    [],
  )

  const seamMaterial = useMemo(
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

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIgnition: { value: 0 },
      uPulse: { value: 0 },
      uDeep: { value: new THREE.Color('#062a5c') },
      uMid: { value: new THREE.Color('#2e9bff') },
      uHot: { value: new THREE.Color('#e6f6ff') },
    }),
    [],
  )

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const ignition = S.ignition * (1 - S.recede * 0.55)

    if (group.current) {
      group.current.visible = S.ignition > 0.01
      const breath = 1 + Math.sin(t * 0.85) * 0.014 + Math.sin(t * 0.31) * 0.008
      group.current.scale.setScalar(breath * (1 + S.pulse * 0.07) * Math.max(0.001, S.ignition))
    }

    if (mat.current) {
      mat.current.uniforms.uTime.value += dt
      mat.current.uniforms.uIgnition.value = ignition
      // Confirmation reads as the die itself flaring, rather than a
      // separate ornament appearing to announce it.
      mat.current.uniforms.uPulse.value = S.pulse + S.confirm * 1.3
    }

    shellMaterial.envMapIntensity = 2.4 + ignition * 1.6
    seamMaterial.opacity = ignition * (0.35 + S.pulse * 0.5 + S.confirm * 0.7)
    if (light.current) light.current.intensity = (0.5 + S.pulse * 2.2 + S.confirm * 3) * ignition
  })

  return (
    <group ref={group} visible={false}>
      {/* Machined casing. Chamfered rather than a hard box — a raw cube
          edge is the most obviously synthetic shape there is, and the
          chamfer gives a highlight line that reads as milled metal. */}
      <RoundedBox
        args={[DIE_SIZE, DIE_SIZE * 0.34, DIE_SIZE]}
        radius={DIE_SIZE * 0.045}
        smoothness={4}
        material={shellMaterial}
      />

      {/* The lit face of the die. A surface rather than a volume — a glowing
          box at this scale just becomes a white blob under bloom. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, DIE_SIZE * 0.172, 0]}>
        <planeGeometry args={[DIE_SIZE * 0.74, DIE_SIZE * 0.74]} />
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

      {/* A hairline seam around the casing — the detail that says the light
          is coming from inside a machined part. */}
      <mesh material={seamMaterial}>
        <boxGeometry args={[DIE_SIZE * 1.02, DIE_SIZE * 0.06, DIE_SIZE * 1.02]} />
      </mesh>

      <pointLight ref={light} color="#7fd8ff" distance={4} decay={2} intensity={0} />
    </group>
  )
}
