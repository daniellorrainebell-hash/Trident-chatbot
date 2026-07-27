import * as THREE from 'three';
import { planCurve, sweepProfile, boxProfile, instanceAlongCurve } from './lib.js';
import { makeGlowSign, makeDataPanel } from './signage.js';

/**
 * Nexus Academy — entrance atrium.
 *
 * A four-storey top-lit volume behind the centre facade: marble floor,
 * curved mezzanine galleries with glass balustrades, a reception counter, and
 * the holographic neural core suspended in the void.
 *
 * Interior surfaces are lit by dedicated fixtures rather than by the sun. The
 * curtain wall is reflective solar glazing, so almost nothing gets through it —
 * relying on daylight here leaves the whole space black.
 */

const FLOOR_Y = 3.6;
const CEILING_Y = 22.4; // sits below the exterior crown roof at 24.2
const HALF_W = 13; // matches the centre facade span
const BACK_Z = -31;
const FRONT_Z = 1.4;

// Mezzanine galleries.
const LEVELS = [10.4, 16.4];

export function buildInterior(scene, materials) {
  const group = new THREE.Group();
  scene.add(group);

  const colliders = [];
  const walkables = [];
  const disposables = [];
  const animated = [];

  const track = (geometry) => {
    disposables.push(geometry);
    return geometry;
  };
  const place = (geometry, material, options = {}) => {
    const { shadow = true, receive = true, walkable = false } = options;
    const mesh = new THREE.Mesh(track(geometry), material);
    mesh.castShadow = shadow;
    mesh.receiveShadow = receive;
    group.add(mesh);
    if (walkable) walkables.push(mesh);
    return mesh;
  };

  const depth = FRONT_Z - BACK_Z;
  const midZ = (FRONT_Z + BACK_Z) / 2;

  // ---- Shell ------------------------------------------------------------
  const floor = place(new THREE.BoxGeometry(HALF_W * 2, 0.4, depth), materials.marble, {
    shadow: false,
    walkable: true,
  });
  floor.position.set(0, FLOOR_Y - 0.2, midZ);

  // Side and back walls.
  [-1, 1].forEach((side) => {
    const wall = place(
      new THREE.BoxGeometry(0.6, CEILING_Y - FLOOR_Y, depth),
      materials.soffit
    );
    wall.position.set(side * HALF_W, (FLOOR_Y + CEILING_Y) / 2, midZ);
    colliders.push(new THREE.Box3().setFromObject(wall));
  });
  const backWall = place(
    new THREE.BoxGeometry(HALF_W * 2, CEILING_Y - FLOOR_Y, 0.6),
    materials.soffit
  );
  backWall.position.set(0, (FLOOR_Y + CEILING_Y) / 2, BACK_Z);
  colliders.push(new THREE.Box3().setFromObject(backWall));

  // ---- Skylight ---------------------------------------------------------
  // Ceiling built as a frame around a central opening, with a bright diffusing
  // panel in the aperture. The panel is emissive so it reads as blown-out sky.
  const OPEN_W = 15;
  const OPEN_D = 22;
  const ceilingParts = [
    [HALF_W * 2, (depth - OPEN_D) / 2, 0, BACK_Z + (depth - OPEN_D) / 4],
    [HALF_W * 2, (depth - OPEN_D) / 2, 0, FRONT_Z - (depth - OPEN_D) / 4],
    [(HALF_W * 2 - OPEN_W) / 2, OPEN_D, -(HALF_W + OPEN_W / 2) / 2, midZ],
    [(HALF_W * 2 - OPEN_W) / 2, OPEN_D, (HALF_W + OPEN_W / 2) / 2, midZ],
  ];
  ceilingParts.forEach(([w, d, x, z]) => {
    const slab = place(new THREE.BoxGeometry(w, 0.7, d), materials.soffit, { shadow: false });
    slab.position.set(x, CEILING_Y, z);
  });

  const skylightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xdcefff,
    // Matched to the daylight sky's linear radiance so the aperture reads as an
    // opening to the outside rather than a grey panel.
    emissiveIntensity: 2.2,
    roughness: 1,
  });
  const skylight = place(new THREE.PlaneGeometry(OPEN_W, OPEN_D), skylightMaterial, {
    shadow: false,
    receive: false,
  });
  skylight.rotation.x = Math.PI / 2;
  skylight.position.set(0, CEILING_Y - 0.36, midZ);

  // Skylight mullions read as structure against the bright aperture.
  for (let i = 1; i < 8; i++) {
    const bar = place(new THREE.BoxGeometry(OPEN_W, 0.3, 0.25), materials.metal, { shadow: false });
    bar.position.set(0, CEILING_Y - 0.5, BACK_Z + (depth - OPEN_D) / 2 + (OPEN_D / 8) * i);
  }

  // The aperture is closed from above by the exterior crown roof (built with the
  // facade), not by a glazed lantern here. The emissive panel above still reads
  // as daylight from inside, and nothing interior shows above the roofline.

  // ---- Mezzanine galleries ---------------------------------------------
  // A U of gallery running along both sides and the back wall at each level.
  LEVELS.forEach((y, index) => {
    const inset = 4.6 + index * 0.9; // galleries step back as they rise
    const galleryPts = [
      [HALF_W - 0.3, FRONT_Z - 2],
      [HALF_W - inset * 0.5, BACK_Z + 10],
      [HALF_W - inset, BACK_Z + 3.2],
      [0, BACK_Z + 2.6 + index * 0.5],
      [-(HALF_W - inset), BACK_Z + 3.2],
      [-(HALF_W - inset * 0.5), BACK_Z + 10],
      [-(HALF_W - 0.3), FRONT_Z - 2],
    ];
    const galleryCurve = planCurve(galleryPts, y);

    // Profile offsets below are relative to the curve, which planCurve already
    // placed at `y`. Passing absolute heights doubles them.
    //
    // This U winds clockwise, so the sweep's lateral vector points at the wall.
    // Negative offsets are therefore the ones that reach into the room; using
    // positive ones buries the whole gallery inside the wall.
    const WIDTH = 4.4;

    const deck = place(
      sweepProfile(galleryCurve, boxProfile(-WIDTH, 0.2, -0.55, 0), { divisions: 150 }),
      materials.shell,
      { walkable: true }
    );
    deck.name = 'gallery';

    // Cove light under the deck nose — the signature glowing edge.
    const cove = place(
      sweepProfile(galleryCurve, boxProfile(-WIDTH - 0.16, -WIDTH + 0.16, -0.72, -0.55), {
        divisions: 150,
      }),
      materials.neonSoft,
      { shadow: false, receive: false }
    );
    cove.name = 'cove';

    // Glass balustrade with a metal caprail, set at the open edge.
    const balustrade = place(
      sweepProfile(galleryCurve, boxProfile(-WIDTH - 0.06, -WIDTH + 0.06, 0, 1.05), {
        divisions: 150,
      }),
      materials.balustrade,
      { shadow: false, receive: false }
    );
    balustrade.renderOrder = 3;
    place(
      sweepProfile(
        galleryCurve,
        boxProfile(-WIDTH - 0.09, -WIDTH + 0.09, 1.05, 1.13),
        { divisions: 150 }
      ),
      materials.metal,
      { shadow: false }
    );

    // Planting spilling over the gallery edge, as in the reference interiors.
    const shrub = track(new THREE.SphereGeometry(1, 8, 6));
    const planting = instanceAlongCurve(shrub, materials.foliage, galleryCurve, 5.5, {
      lateral: -WIDTH + 1.1,
      y: 0.5,
      jitter: 0.3,
      align: false,
    });
    planting.castShadow = false;
    group.add(planting);
  });

  // ---- Reception counter -----------------------------------------------
  const deskCurve = planCurve(
    [
      [-7, -13],
      [-3.4, -15.6],
      [1.2, -15.9],
      [5.6, -14.2],
      [8, -11.4],
    ],
    FLOOR_Y
  );
  place(
    sweepProfile(deskCurve, boxProfile(-0.9, 0.9, 0, 1.12), { divisions: 90 }),
    materials.shell,
    { walkable: false }
  );
  const deskGlow = place(
    sweepProfile(deskCurve, boxProfile(-0.95, 0.95, 0.06, 0.2), {
      divisions: 90,
    }),
    materials.neonSoft,
    { shadow: false, receive: false }
  );
  deskGlow.name = 'cove';
  place(
    sweepProfile(deskCurve, boxProfile(-1.02, 1.02, 1.12, 1.2), {
      divisions: 90,
    }),
    materials.marble
  );
  // Block walking through the counter.
  for (let i = 0; i <= 8; i++) {
    const point = deskCurve.getPointAt(i / 8);
    colliders.push(
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(point.x, FLOOR_Y + 0.6, point.z),
        new THREE.Vector3(2.6, 1.2, 2.6)
      )
    );
  }

  // ---- Branding and holography ----------------------------------------
  const signTexture = makeGlowSign({ color: '#9ceaff' });
  disposables.push(signTexture);
  const signMaterial = new THREE.MeshBasicMaterial({
    map: signTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    // Pushed well past 1 so the sign blooms; unlit materials are still tone
    // mapped by the output pass, and plain white would land mid-grey.
    color: new THREE.Color().setScalar(9),
  });
  const sign = place(new THREE.PlaneGeometry(15, 6.15), signMaterial, {
    shadow: false,
    receive: false,
  });
  sign.position.set(0, 12.4, BACK_Z + 0.45);

  // Suspended holographic neural core.
  const brainGroup = new THREE.Group();
  brainGroup.position.set(0, 11.4, midZ + 3);
  group.add(brainGroup);

  const brainCore = new THREE.Mesh(
    track(new THREE.IcosahedronGeometry(3.2, 3)),
    materials.hologram
  );
  brainGroup.add(brainCore);
  const brainWire = new THREE.LineSegments(
    track(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(4.0, 2))),
    new THREE.LineBasicMaterial({
      color: new THREE.Color(0x9ceaff).multiplyScalar(9),
      transparent: true,
      opacity: 0.8,
    })
  );
  brainGroup.add(brainWire);

  // Projector cone from the floor plate below.
  const cone = new THREE.Mesh(
    track(new THREE.ConeGeometry(3.4, 8.4, 40, 1, true)),
    materials.hologram
  );
  cone.position.y = -3.9;
  cone.rotation.x = Math.PI;
  brainGroup.add(cone);

  const emitter = place(new THREE.CylinderGeometry(2.4, 2.4, 0.12, 40), materials.neonSoft, {
    shadow: false,
  });
  emitter.position.set(0, FLOOR_Y + 0.06, midZ + 3);
  emitter.name = 'cove';

  // Wall-mounted readouts.
  const panels = [
    { lines: ['QUANTUM NEURAL', 'NETWORKS', 'STUDIO 07'], x: -HALF_W + 0.45, z: -18, ry: Math.PI / 2 },
    { lines: ['BUILD. LEAD. SCALE.', 'INTAKE 2026', 'ORIENTATION 09:00'], x: HALF_W - 0.45, z: -12, ry: -Math.PI / 2 },
  ];
  panels.forEach(({ lines, x, z, ry }) => {
    const texture = makeDataPanel(lines);
    disposables.push(texture);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      color: new THREE.Color().setScalar(4.5),
      depthWrite: false,
    });
    const panel = place(new THREE.PlaneGeometry(4.4, 2.2), material, {
      shadow: false,
      receive: false,
    });
    panel.position.set(x, FLOOR_Y + 3.1, z);
    panel.rotation.y = ry;
  });

  // ---- Interior lighting ------------------------------------------------
  // Point lights are specified in candela and fall off as 1/d², so intensity has
  // to be derived from the throw distance, not picked by eye. Target illuminance
  // at floor level is a little under the exterior's ~6, which keeps the atrium
  // reading as shade without going murky:
  //
  //     intensity = target * distance²
  //
  // All fixtures are mounted high for that reason — a lamp a few metres off the
  // floor needs a tiny value, and guessing a large one blows the whole room out.
  const MOUNT_Y = 20.5;
  const TARGET_LUX = 2.6;
  const throwDistance = MOUNT_Y - FLOOR_Y;
  const lampIntensity = TARGET_LUX * throwDistance * throwDistance;
  // Kept to three fixtures: every additional point light costs a shader
  // permutation and per-fragment work across the whole scene.
  [[0, -5], [0, -16], [0, -27]].forEach(([x, z]) => {
    const lamp = new THREE.PointLight(0xeaf4ff, lampIntensity, 90, 2);
    lamp.position.set(x, MOUNT_Y, z);
    group.add(lamp);
  });

  // Downlight rings in the ceiling frame.
  [-7, 0, 7].forEach((x) => {
    [-27, -3].forEach((z) => {
      const ring = place(new THREE.TorusGeometry(1.1, 0.07, 8, 28), materials.neonSoft, {
        shadow: false,
      });
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, CEILING_Y - 0.45, z);
      ring.name = 'cove';
    });
  });

  const update = (elapsed) => {
    brainGroup.position.y = 11.4 + Math.sin(elapsed * 0.7) * 0.35;
    brainCore.rotation.y = elapsed * 0.12;
    brainCore.rotation.x = Math.sin(elapsed * 0.2) * 0.2;
    brainWire.rotation.y = -elapsed * 0.09;
    cone.material.opacity = 0.3 + Math.sin(elapsed * 2.4) * 0.06;
    animated.forEach((fn) => fn(elapsed));
  };

  const dispose = () => {
    disposables.forEach((d) => d.dispose?.());
    skylightMaterial.dispose();
    signMaterial.dispose();
    brainWire.material.dispose();
    scene.remove(group);
  };

  return {
    group,
    colliders,
    walkables,
    update,
    dispose,
    bounds: { FLOOR_Y, CEILING_Y, HALF_W, BACK_Z, FRONT_Z, midZ },
  };
}
