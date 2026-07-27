import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { makeCloudTexture } from './world/signage.js';

/**
 * Renderer, daylight and post-processing.
 *
 * The look depends on three things working together: an atmospheric scattering
 * sky used as the scene's environment map (so the white shells pick up real sky
 * colour instead of flat ambient), ACES filmic tone mapping, and a bloom pass
 * that only the emissive cove lighting reaches.
 */

// Sun high and in front of the building's south-facing entrance, so the facade
// is lit and shadows rake away from the arrival view. An azimuth past 90 degrees
// puts the sun behind the facade and leaves the whole elevation in shade.
const SUN_ELEVATION = 44;
const SUN_AZIMUTH = 34;

/** Debug overrides: ?exp=0.4&ray=4&turb=2&bloom=5&clouds=0 */
const tuning = (() => {
  const params = new URLSearchParams(window.location.search);
  const num = (key, fallback) => {
    const value = Number(params.get(key));
    return Number.isFinite(value) && params.get(key) !== null ? value : fallback;
  };
  return {
    exposure: num('exp', 0.18),
    rayleigh: num('ray', 7),
    turbidity: num('turb', 1.3),
    bloomThreshold: num('bloom', 14),
    clouds: num('clouds', 1) !== 0,
  };
})();

export function createEngine(container) {
  const renderer = new THREE.WebGLRenderer({
    antialias: false, // SMAA handles this in the composer
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // The composer renders into a target, so materials skip tone mapping and
  // OutputPass applies it once at the end. The Sky shader's radiance measures
  // around 6 in linear units, so exposure has to sit well under 1 or ACES
  // pushes the whole frame into desaturated white.
  renderer.toneMappingExposure = tuning.exposure;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    62,
    container.clientWidth / container.clientHeight,
    0.1,
    2000
  );

  // ---- Sky -------------------------------------------------------------
  const sky = new Sky();
  sky.scale.setScalar(8000);
  const uniforms = sky.material.uniforms;
  // Low turbidity with high Rayleigh scattering gives the deep saturated blue of
  // the reference. Raising turbidity adds haze and drains the colour to grey.
  uniforms.turbidity.value = tuning.turbidity;
  uniforms.rayleigh.value = tuning.rayleigh;
  uniforms.mieCoefficient.value = 0.004;
  uniforms.mieDirectionalG.value = 0.75;

  const sunPosition = new THREE.Vector3().setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - SUN_ELEVATION),
    THREE.MathUtils.degToRad(SUN_AZIMUTH)
  );
  uniforms.sunPosition.value.copy(sunPosition);
  scene.add(sky);

  // ---- Clouds ----------------------------------------------------------
  // A dome inside the sky carrying an alpha cloud map. Added after the
  // environment is captured so the clouds don't bake into the reflections.
  const cloudTexture = makeCloudTexture();
  // Radius must stay inside the camera's far plane. The Sky shader pins itself
  // to the far plane in its vertex stage, so it is exempt; an ordinary mesh is
  // not, and a dome outside `far` is simply clipped away.
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(1500, 48, 24),
    new THREE.MeshBasicMaterial({
      // Colour is pushed past 1.0 deliberately. Sunlit cumulus have to match the
      // sky's linear radiance, and `toneMapped: false` cannot help here — it only
      // suppresses in-shader tone mapping, which the composer already bypasses,
      // so plain white would land at 0.18 after OutputPass and read as grey.
      color: new THREE.Color().setScalar(7.5),
      alphaMap: cloudTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      opacity: 0.95,
    })
  );
  clouds.renderOrder = -1;
  clouds.visible = tuning.clouds;

  // Bake the sky into an environment map so every PBR surface reflects it.
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  // The sky dome sits at radius ~4000, so the capture camera's far plane has to
  // be pushed well past PMREMGenerator's default of 100 or it captures nothing.
  const environment = pmrem.fromScene(sky, 0, 0.1, 20000).texture;
  scene.environment = environment;
  scene.add(clouds);

  // ---- Lighting --------------------------------------------------------
  // Direct sun is deliberately strong relative to the environment ambient —
  // that ratio is what produces readable shadows instead of a flat wash.
  const sun = new THREE.DirectionalLight(0xfff4e2, 6.0);
  sun.position.copy(sunPosition).multiplyScalar(220);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.045;
  const shadowCamera = sun.shadow.camera;
  shadowCamera.near = 20;
  shadowCamera.far = 520;
  shadowCamera.left = -150;
  shadowCamera.right = 150;
  shadowCamera.top = 150;
  shadowCamera.bottom = -150;
  shadowCamera.updateProjectionMatrix();
  scene.add(sun);

  // No hemisphere fill: the environment map already supplies sky and ground
  // bounce, and adding both double-counts the ambient and flattens the shading.
  // A faint warm bounce off the plaza stone is the one thing it misses.
  const bounce = new THREE.DirectionalLight(0xffe9cf, 0.5);
  bounce.position.set(-sunPosition.x, -0.4, -sunPosition.z).multiplyScalar(120);
  scene.add(bounce);

  // ---- Post-processing -------------------------------------------------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // Bloom sees linear radiance, not display-referred colour. The daylight sky
  // alone measures ~6, so the threshold has to clear that or the entire frame
  // blooms into white haze. Only the cove lighting is meant to pass.
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.34, // strength
    0.7, // radius
    tuning.bloomThreshold // threshold in linear radiance
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const smaa = new SMAAPass(container.clientWidth, container.clientHeight);
  composer.addPass(smaa);

  const setSize = (width, height) => {
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    bloom.setSize(width, height);
  };

  const dispose = () => {
    environment.dispose();
    pmrem.dispose();
    cloudTexture.dispose();
    clouds.geometry.dispose();
    clouds.material.dispose();
    sky.geometry.dispose();
    sky.material.dispose();
    composer.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { renderer, scene, camera, composer, sun, sunPosition, environment, setSize, dispose };
}
