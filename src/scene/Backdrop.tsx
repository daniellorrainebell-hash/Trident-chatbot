import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NOISE_GLSL } from './shaders/noise'
import { S } from '../sequence/stageState'

/**
 * The environment behind the object.
 *
 * A flat fill is the cheapest-looking thing a 3D scene can sit on: with no
 * tonal variation there is nothing to separate the subject from the void,
 * and the frame reads as a cutout on a colour swatch rather than an object
 * in a space.
 *
 * This is a large inverted sphere carrying three things:
 *   · a vertical gradient, deep navy above falling to near-black below
 *   · a soft radial lift behind the object, so it sits in its own pool of
 *     light rather than floating
 *   · very low-amplitude noise, which stops the gradient banding into
 *     visible steps on OLED phone screens — where this will actually be
 *     watched, and where banding on near-black is at its worst
 *
 * Rendered with depth writing off and on the far side of everything, so it
 * never interferes with the depth-of-field pass.
 */

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const frag = /* glsl */ `
${NOISE_GLSL}

uniform float uTime;
uniform float uLift;
uniform vec3  uHigh;
uniform vec3  uLow;
uniform vec3  uGlow;
varying vec3 vDir;

void main() {
  // Vertical gradient. Weighted low so most of the frame stays deep and the
  // lift reads as a horizon rather than a wash.
  float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(uLow, uHigh, pow(h, 1.6));

  // A pool of light behind the subject, brightest just below centre where
  // the object sits in a 9:16 frame.
  float d = length(vDir.xy - vec2(0.0, 0.06));
  float pool = smoothstep(0.95, 0.0, d);
  col += uGlow * pool * pool * uLift;

  gl_FragColor = vec4(col, 1.0);

  // These two chunks are what keep the backdrop in the same colour world as
  // the rest of the scene. Colour uniforms arrive in linear space, and a raw
  // ShaderMaterial gets no tone mapping or output conversion unless it asks
  // for it — without these the gradient renders markedly darker than the
  // hex values it was authored from.
  #include <tonemapping_fragment>
  #include <colorspace_fragment>

  // Dither, applied *after* conversion and at sub-LSB amplitude.
  //
  // Near-black gradients band badly on 8-bit displays and this is being
  // watched on a phone, so some dither is needed — but added before the
  // sRGB curve it gets massively amplified in the shadows and reads as
  // grain rather than disappearing. Half a code value here, per pixel.
  float dither = fract(sin(dot(gl_FragCoord.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453);
  gl_FragColor.rgb += (dither - 0.5) / 255.0;
}
`

export function Backdrop() {
  const mat = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLift: { value: 0 },
      uHigh: { value: new THREE.Color('#0a1526') },
      uLow: { value: new THREE.Color('#010206') },
      uGlow: { value: new THREE.Color('#0d3358') },
    }),
    [],
  )

  useFrame((_, dt) => {
    const m = mat.current
    if (!m) return
    m.uniforms.uTime.value += dt
    // The room comes up with the system and dims again for the payoff, so
    // the backdrop is part of the sequence rather than a static plate.
    m.uniforms.uLift.value = (0.25 + S.envIntensity * 0.75) * (1 - S.recede * 0.55)
  })

  return (
    <mesh scale={40} renderOrder={-1000}>
      <sphereGeometry args={[1, 32, 24]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
        fog={false}
      />
    </mesh>
  )
}
