import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../../sequence/stageState'
import { createTraceTexture } from './traceTexture'
import { WAFER_SIZE, WAFER_CORNER } from '../layout'

/**
 * One glass circuit wafer.
 *
 * Two parts: a rounded glass substrate that catches light on its bevelled
 * edge, and the copper layer sitting just above it. The edge highlight is
 * doing most of the work — a thin glass plate lit from the side is the
 * single most premium-reading thing in the whole scene, and it costs almost
 * nothing.
 *
 * Activation is per-wafer (`S.sub[index]`), so a service coming online
 * *is* a layer of the object lighting up rather than a separate thing
 * appearing next to it.
 */

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const frag = /* glsl */ `
uniform sampler2D uTraces;
uniform float uTime;
uniform float uEnergy;
uniform float uFlare;
uniform float uIdle;
uniform vec3  uDim;
uniform vec3  uLit;
uniform vec3  uHot;
varying vec2 vUv;

void main() {
  vec4 t = texture2D(uTraces, vUv);

  float copper = smoothstep(0.30, 0.62, t.r);
  if (copper <= 0.001) discard;

  float progress = t.g;
  float node = smoothstep(0.55, 0.95, t.b);

  // A signal running along the actual route. Sharp head, exponential trail —
  // it reads as current, not as a moving highlight.
  float d = fract(progress - uTime * 0.09);
  float pulse = pow(1.0 - d, 26.0);

  // Unlit copper is still faintly visible, so the board reads as a real
  // object before it powers up rather than appearing from nothing.
  float level = uIdle + uEnergy * 0.85;

  vec3 col = mix(uDim, uLit, uEnergy);
  col = mix(col, uHot, clamp(pulse * uEnergy + node * uEnergy * 0.55 + uFlare, 0.0, 1.0));

  float a = copper * (level + pulse * uEnergy * 0.9 + node * uEnergy * 0.5 + uFlare * 0.6);

  gl_FragColor = vec4(col * (1.0 + pulse * uEnergy * 1.6), a);
}
`

/** Rounded-square profile — extruded so the edge has a real bevel to light. */
function useSubstrateGeometry() {
  return useMemo(() => {
    const half = WAFER_SIZE / 2
    const r = WAFER_CORNER
    const shape = new THREE.Shape()
    shape.moveTo(-half + r, -half)
    shape.lineTo(half - r, -half)
    shape.quadraticCurveTo(half, -half, half, -half + r)
    shape.lineTo(half, half - r)
    shape.quadraticCurveTo(half, half, half - r, half)
    shape.lineTo(-half + r, half)
    shape.quadraticCurveTo(-half, half, -half, half - r)
    shape.lineTo(-half, -half + r)
    shape.quadraticCurveTo(-half, -half, -half + r, -half)

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 2,
      curveSegments: 8,
    })
    geo.center()
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])
}

export function Wafer({
  index,
  y,
  seed,
  accent,
}: {
  index: number
  y: number
  seed: number
  /** Each layer sits at a slightly different point in the blue range, so
   *  the services read as related but distinct without a colour change. */
  accent: string
}) {
  const substrate = useSubstrateGeometry()
  const group = useRef<THREE.Group>(null)
  const mat = useRef<THREE.ShaderMaterial>(null)

  const traces = useMemo(
    () => createTraceTexture({ seed, nets: 22 + (index % 3) * 4, grid: 36 + index * 3 }),
    [seed, index],
  )

  const substrateMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#04101f'),
        metalness: 0,
        // Soft enough that the plate picks up a broad sheen rather than a
        // mirror image of the light source, but not so soft it turns milky
        // — frosted plastic is the failure mode on the other side of this.
        roughness: 0.5,
        // No clearcoat: it adds a second, sharper specular lobe that ignores
        // the base roughness, which is exactly the hotspot we're avoiding.
        clearcoat: 0,
        transparent: true,
        opacity: 0.2,
        envMapIntensity: 0.85,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  )

  const uniforms = useMemo(
    () => ({
      uTraces: { value: traces },
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uFlare: { value: 0 },
      uIdle: { value: 0.06 },
      uDim: { value: new THREE.Color('#123a63') },
      uLit: { value: new THREE.Color(accent) },
      uHot: { value: new THREE.Color('#cfeeff') },
    }),
    [traces, accent],
  )

  useFrame((_, dt) => {
    const reveal = S.systems
    const energy = S.sub[index]
    const flare = S.flare[index]

    if (group.current) {
      group.current.visible = reveal > 0.01
      // Layers settle into the stack from slightly apart — an assembly, not
      // a fade-in.
      group.current.position.y = y * (0.7 + reveal * 0.3) + (1 - reveal) * 0.12
      const s = 0.9 + reveal * 0.1
      group.current.scale.set(s, 1, s)
    }

    substrateMaterial.opacity = reveal * (0.13 + energy * 0.11) * (1 - S.recede * 0.55)
    substrateMaterial.envMapIntensity = 0.8 + energy * 0.6 + flare * 0.5

    const m = mat.current
    if (m) {
      m.uniforms.uTime.value += dt
      m.uniforms.uEnergy.value = energy * (1 - S.recede * 0.7)
      m.uniforms.uFlare.value = flare
      m.uniforms.uIdle.value = 0.05 * reveal * (1 - S.recede * 0.8)
    }
  })

  return (
    <group ref={group}>
      <mesh geometry={substrate} material={substrateMaterial} />
      {/* Copper sits just proud of the substrate so it never z-fights. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, 0]}>
        <planeGeometry args={[WAFER_SIZE, WAFER_SIZE]} />
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
    </group>
  )
}
