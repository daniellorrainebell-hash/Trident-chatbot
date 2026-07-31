import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../../sequence/stageState'
import { createTraceTexture } from './traceTexture'
import { WAFER_SIZE, WAFER_CORNER } from '../layout'

/**
 * One glass circuit wafer.
 *
 * The copper is a **real physically-based metal**, not an emissive line.
 * That distinction is the whole look: additive glowing wireframe on black is
 * a 1990s aesthetic — it was what the hardware of that era could do, and no
 * amount of polish moves it forward. Modern product imagery puts light
 * *inside* material rather than using light instead of material.
 *
 * So the traces here are metal that reflects the studio environment, catches
 * a specular roll across it as the camera moves, and goes dark in shadow.
 * Emission is reserved for the charge actually travelling the net — glow as
 * an event, not a permanent state.
 *
 * Implemented by injecting into MeshStandardMaterial via onBeforeCompile,
 * which keeps the entire PBR pipeline (env map, roughness, fresnel, tone
 * mapping) and adds only what the circuitry needs on top.
 */

/** Rounded-square profile with a real bevel for the edge to catch light. */
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
      // Real thickness. A zero-depth plate has no edge to light, and the lit
      // edge of a glass sheet is the most convincing detail available here.
      depth: 0.034,
      bevelEnabled: true,
      bevelThickness: 0.009,
      bevelSize: 0.009,
      bevelSegments: 4,
      curveSegments: 12,
    })
    geo.center()
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])
}

interface TraceUniforms {
  uTraces: { value: THREE.Texture }
  uTime: { value: number }
  uEnergy: { value: number }
  uFlare: { value: number }
  uWave: { value: number }
  uAccent: { value: THREE.Color }
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
  accent: string
}) {
  const substrate = useSubstrateGeometry()
  const group = useRef<THREE.Group>(null)

  const traces = useMemo(
    () => createTraceTexture({ seed, nets: 4 + (index % 3), grid: 30 + index * 2 }),
    [seed, index],
  )

  /** Glass substrate — thin, dark, and reflective at grazing angles. */
  const substrateMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#050c17'),
        metalness: 0,
        roughness: 0.28,
        transmission: 0.55,
        thickness: 0.05,
        ior: 1.5,
        transparent: true,
        opacity: 0.55,
        envMapIntensity: 0.9,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  )

  /** Copper. Real metal, with charge injected on top of the PBR result. */
  const { copperMaterial, uniforms } = useMemo(() => {
    const u: TraceUniforms = {
      uTraces: { value: traces },
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uFlare: { value: 0 },
      uWave: { value: 0 },
      uAccent: { value: new THREE.Color(accent) },
    }

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#9fb2c6'),
      metalness: 1,
      roughness: 0.32,
      envMapIntensity: 2.4,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, u)

      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vTraceUv;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvTraceUv = uv;')

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          /* glsl */ `
          #include <common>
          uniform sampler2D uTraces;
          uniform float uTime;
          uniform float uEnergy;
          uniform float uFlare;
          uniform float uWave;
          uniform vec3  uAccent;
          varying vec2 vTraceUv;
          float trProgress; float trNode;
          `,
        )
        // Copper mask cuts the plane down to the routing itself.
        .replace(
          '#include <map_fragment>',
          /* glsl */ `
          #include <map_fragment>
          vec4 trc = texture2D(uTraces, vTraceUv);
          // Threshold kept very low. Mipmapping averages a thin bright trace
          // against black, so a high cut breaks continuous copper into a
          // string of dots at distance — the opposite of what we want.
          float copper = smoothstep(0.03, 0.26, trc.r);
          if (copper < 0.015) discard;
          trProgress = trc.g;
          // Gated hard: after mipmapping the pad channel bleeds along the
          // runs, and a high-frequency term on that bleed is what was
          // speckling the whole trace.
          trNode = smoothstep(0.86, 0.99, trc.b);
          diffuseColor.a *= copper;
          `,
        )
        // Pads are polished; the runs are slightly duller. Real boards have
        // this variation and it is what stops the metal looking uniform.
        .replace(
          '#include <roughnessmap_fragment>',
          /* glsl */ `
          #include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, 0.12, trNode);
          `,
        )
        // Charge. The only emissive component in the entire object.
        .replace(
          '#include <emissivemap_fragment>',
          /* glsl */ `
          #include <emissivemap_fragment>
          // Low frequency on purpose. The progress channel is 8-bit, so any
          // high multiplier turns its quantisation into visible grain.
          float d1 = fract(trProgress * 1.5 - uTime * 0.26);
          float charge = pow(1.0 - d1, 11.0);
          float d2 = fract(trProgress * 1.0 - uTime * 0.11 + 0.37);
          charge += pow(1.0 - d2, 15.0) * 0.5;

          float spark = pow(1.0 - fract(trProgress * 2.0 - uTime * 0.4), 18.0) * trNode;

          float rad = length(vTraceUv - 0.5) * 1.4142;
          float wave = smoothstep(0.09, 0.0, abs(rad - uWave)) * step(0.001, uWave);

          float lit = uEnergy;
          totalEmissiveRadiance +=
              uAccent * (charge * 3.4 * lit + spark * 1.4 * lit + uFlare * 0.8)
            + vec3(0.82, 0.93, 1.0) * wave * 3.0;
          `,
        )
    }
    mat.customProgramCacheKey = () => `wafer-copper-${accent}`

    return { copperMaterial: mat, uniforms: u }
  }, [traces, accent])

  useFrame((_, dt) => {
    const reveal = S.systems
    const energy = S.sub[index]
    const flare = S.flare[index]

    if (group.current) {
      group.current.visible = reveal > 0.01
      group.current.position.y = y * (0.7 + reveal * 0.3) + (1 - reveal) * 0.12
      const s = 0.9 + reveal * 0.1
      group.current.scale.set(s, 1, s)
    }

    const fade = 1 - S.recede * 0.55
    substrateMaterial.opacity = reveal * (0.3 + energy * 0.16) * fade
    substrateMaterial.envMapIntensity = 0.75 + energy * 0.5 + flare * 0.4

    // Unlit copper is still real metal picking up the room — the board is a
    // physical object before it has power, not an empty plate.
    copperMaterial.opacity = reveal * (0.7 + energy * 0.3) * fade
    copperMaterial.envMapIntensity = 3.4 + energy * 2.2 + flare * 1.4
    copperMaterial.roughness = 0.32 - energy * 0.1

    uniforms.uTime.value += dt
    uniforms.uEnergy.value = energy * (1 - S.recede * 0.7)
    uniforms.uFlare.value = flare
    uniforms.uWave.value = S.wave[index]
  })

  return (
    <group ref={group}>
      <mesh geometry={substrate} material={substrateMaterial} />
      {/* Copper sits just proud of the substrate so it never z-fights. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, 0]} material={copperMaterial}>
        <planeGeometry args={[WAFER_SIZE, WAFER_SIZE]} />
      </mesh>
    </group>
  )
}
