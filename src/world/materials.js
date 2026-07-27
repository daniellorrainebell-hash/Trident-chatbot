import * as THREE from 'three';
import {
  makeStoneTexture,
  makeFoliageTexture,
  makeWaterNormals,
  normalFromCanvas,
  textureFrom,
} from './signage.js';

export const NEON = new THREE.Color('#5ec8ff');

/**
 * Material library. Everything is physically based and shares the sky
 * environment map, which is what sells the white architecture: the panels pick
 * up blue from above and warm bounce from the plaza.
 */
export function createMaterials(environment) {
  const stoneCanvas = makeStoneTexture({ tiles: 4 });
  const stoneMap = textureFrom(stoneCanvas, { repeat: [10, 10] });
  const stoneNormal = textureFrom(normalFromCanvas(stoneCanvas, 0.8), {
    repeat: [10, 10],
    srgb: false,
  });

  const foliageMap = textureFrom(makeFoliageTexture(), { repeat: [6, 6] });
  const lawnMap = textureFrom(makeFoliageTexture({ dark: 34, light: 82 }), { repeat: [40, 40] });

  // The sky environment is bright (radiance ~6), so this stays low: it sets the
  // ambient level, and direct sun has to stay several times stronger than it or
  // shadows wash out and the massing goes flat.
  const shared = { envMap: environment, envMapIntensity: 0.25 };

  return {
    /** Architectural panel: the signature smooth white shell. */
    shell: new THREE.MeshPhysicalMaterial({
      color: 0xf6f8f9,
      metalness: 0.0,
      roughness: 0.34,
      clearcoat: 0.6,
      clearcoatRoughness: 0.28,
      sheen: 0.2,
      sheenColor: new THREE.Color(0xdfeaf2),
      ...shared,
    }),

    /** Slightly warmer white for soffits and undersides. */
    soffit: new THREE.MeshStandardMaterial({
      color: 0xe8ecef,
      metalness: 0.0,
      roughness: 0.55,
      ...shared,
    }),

    /**
     * Curtain-wall glazing. Weighted toward reflection rather than
     * transmission: a high-transmission glass over a pale interior just reads
     * as white panel, where real solar glazing mirrors the sky and goes blue.
     */
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x5c8bab,
      metalness: 0.22,
      roughness: 0.035,
      transparent: true,
      opacity: 0.62,
      // Deliberately no `transmission`. Any non-zero value makes three render
      // the whole scene a second time every frame into a transmission target,
      // which dominated the frame budget here. Plain alpha plus a strong
      // environment reflection is visually equivalent for architectural glazing.
      ior: 1.5,
      reflectivity: 0.95,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      side: THREE.DoubleSide,
      envMap: environment,
      envMapIntensity: 1.1,
    }),

    /** Interior volumes read through the glazing — kept in shadow. */
    interior: new THREE.MeshStandardMaterial({
      color: 0x3d4855,
      metalness: 0.1,
      roughness: 0.7,
      ...shared,
    }),

    /** Interior glass balustrades — clearer, less tinted. */
    balustrade: new THREE.MeshPhysicalMaterial({
      color: 0xdaeef7,
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      ...shared,
    }),

    /** Brushed metal for mullions, handrails, door frames. */
    metal: new THREE.MeshStandardMaterial({
      color: 0xb8c0c7,
      metalness: 0.9,
      roughness: 0.34,
      ...shared,
    }),

    darkMetal: new THREE.MeshStandardMaterial({
      color: 0x2c3138,
      metalness: 0.8,
      roughness: 0.4,
      ...shared,
    }),

    /** Polished plaza stone. */
    stone: new THREE.MeshStandardMaterial({
      map: stoneMap,
      normalMap: stoneNormal,
      normalScale: new THREE.Vector2(0.35, 0.35),
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.16,
      ...shared,
    }),

    /** Interior marble — tighter tiling, glossier. */
    marble: new THREE.MeshStandardMaterial({
      map: textureFrom(stoneCanvas, { repeat: [5, 5] }),
      color: 0xfbfcfd,
      metalness: 0.14,
      roughness: 0.08,
      ...shared,
    }),

    lawn: new THREE.MeshStandardMaterial({ map: lawnMap, roughness: 0.9, ...shared }),

    hedge: new THREE.MeshStandardMaterial({
      map: foliageMap,
      color: 0x9fdc9a,
      roughness: 0.85,
      ...shared,
    }),

    foliage: new THREE.MeshStandardMaterial({
      map: foliageMap,
      color: 0xa8e0a0,
      roughness: 0.8,
      side: THREE.DoubleSide,
      ...shared,
    }),

    bark: new THREE.MeshStandardMaterial({ color: 0x6b5b4d, roughness: 0.85, ...shared }),

    /** Cove lighting and light reveals. Emissive drives the bloom pass. */
    neon: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: NEON,
      emissiveIntensity: 34.0,
      roughness: 0.4,
      toneMapped: false,
    }),

    /** Softer emissive for floor plates and emitters, which sit close to the
     * camera and blow out badly at full cove brightness. */
    neonSoft: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: NEON,
      emissiveIntensity: 7.0,
      roughness: 0.4,
    }),

    /**
     * Holographic projections: additive, unlit, no depth writes. The colour is
     * scaled past 1 because the output pass tone maps unlit materials too, so a
     * nominal cyan would land as a dull grey-blue.
     */
    hologram: new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x8fe8ff).multiplyScalar(4.5),
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),

    /** Uniform fabrics for the student and staff figures. */
    uniformNavy: new THREE.MeshStandardMaterial({ color: 0x1b2951, roughness: 0.62, ...shared }),
    uniformWhite: new THREE.MeshStandardMaterial({ color: 0xeef2f6, roughness: 0.55, ...shared }),
    skin: new THREE.MeshStandardMaterial({ color: 0xc79a7a, roughness: 0.66, ...shared }),
    hair: new THREE.MeshStandardMaterial({ color: 0x2b2320, roughness: 0.7, ...shared }),

    /** Robot chassis: glossy white shell with dark joints. */
    chassis: new THREE.MeshPhysicalMaterial({
      color: 0xf4f7fa,
      metalness: 0.1,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      ...shared,
    }),
    joint: new THREE.MeshStandardMaterial({
      color: 0x22262c,
      metalness: 0.55,
      roughness: 0.35,
      ...shared,
    }),

    waterNormals: makeWaterNormals(),

    /** Loose textures kept for disposal. */
    _textures: [stoneMap, stoneNormal, foliageMap, lawnMap],
  };
}

export function disposeMaterials(materials) {
  Object.values(materials).forEach((value) => {
    if (Array.isArray(value)) value.forEach((t) => t?.dispose?.());
    else value?.dispose?.();
  });
}
