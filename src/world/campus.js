import * as THREE from 'three';
import {
  planCurve,
  sampleFrames,
  sweepProfile,
  boxProfile,
  instanceAlongCurve,
  mirrorPoints,
  mergeAndDispose,
  buildStairs,
} from './lib.js';
import { makeBrandPanel } from './signage.js';

/**
 * Nexus Academy — exterior.
 *
 * The building is one continuous curved facade: a shallow central entrance
 * block flanked by two wings that sweep forward to embrace the arrival plaza.
 * Every horizontal element (slab bands, glazing, cove lighting, roofline)
 * follows the same plan curves, which is what gives the parametric look.
 */

// ---- Level datums (metres) ---------------------------------------------
export const PLAZA_Y = 0;
export const TERRACE_Y = 3.6; // podium / ground-floor level
const L1_TOP = 10.4;
const L1_BAND = 1.05;
const L2_TOP = 16.4;
const L2_BAND = 1.05;
const ROOF_Y = 19.0;
const ROOF_BAND = 1.7;
const CROWN_Y = 24.2; // the centre entrance block rises above the wings

const CORE_DEPTH = 34;
const PODIUM_DEPTH = 38;

// ---- Plan geometry -----------------------------------------------------
const CENTER_PTS = [
  [-13, 2.2],
  [-6.5, 0.5],
  [0, 0],
  [6.5, 0.5],
  [13, 2.2],
];
const RIGHT_WING_PTS = [
  [13, 2.2],
  [25, 6.8],
  [37, 15.5],
  [49, 26],
  [60, 36],
];
const LEFT_WING_PTS = mirrorPoints(RIGHT_WING_PTS);
const FACADE_PTS = [...LEFT_WING_PTS.slice(0, -1), ...CENTER_PTS, ...RIGHT_WING_PTS.slice(1)];

/** Extrude an XZ footprint polygon vertically. */
function extrudeFootprint(points, height) {
  const shape = new THREE.Shape();
  // Shape space maps (x, -z); a -90 degree X rotation then lands it in world XZ
  // with the extrusion depth pointing up +Y.
  points.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/** Footprint bounded in front by the facade curve, pushed back by `depth`. */
function facadeFootprint(curve, depth, divisions = 96) {
  const frames = sampleFrames(curve, divisions);
  const front = frames.map(({ position }) => [position.x, position.z]);
  // Lateral points outward (toward the plaza), so step against it to go inside.
  const back = frames
    .map(({ position, lateral }) => [
      position.x - lateral.x * depth,
      position.z - lateral.z * depth,
    ])
    .reverse();
  return [...front, ...back];
}

export function buildCampus(scene, materials) {
  const group = new THREE.Group();
  scene.add(group);

  const colliders = []; // Box3, blocks walking
  const walkables = []; // meshes the walker can stand on
  const disposables = [];
  const animated = [];
  // Planting positions queued before the tree builder is defined below.
  const plantTreeLater = [];

  const track = (geometry) => {
    disposables.push(geometry);
    return geometry;
  };
  const place = (geometry, material, { shadow = true, receive = true, walkable = false } = {}) => {
    const mesh = new THREE.Mesh(track(geometry), material);
    mesh.castShadow = shadow;
    mesh.receiveShadow = receive;
    group.add(mesh);
    if (walkable) walkables.push(mesh);
    return mesh;
  };

  const centerCurve = planCurve(CENTER_PTS);
  const rightCurve = planCurve(RIGHT_WING_PTS);
  const leftCurve = planCurve(LEFT_WING_PTS);
  const facadeCurve = planCurve(FACADE_PTS);
  const wings = [leftCurve, rightCurve];

  // ---- Ground ----------------------------------------------------------
  const lawn = place(new THREE.PlaneGeometry(1400, 1400), materials.lawn, { shadow: false });
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = -0.05;
  walkables.push(lawn);

  // Arrival plaza paving.
  const plaza = place(new THREE.BoxGeometry(190, 0.3, 130), materials.stone, {
    shadow: false,
    walkable: true,
  });
  plaza.position.set(0, PLAZA_Y - 0.15, 76);

  // ---- Podium and building core ---------------------------------------
  const podium = place(
    extrudeFootprint(facadeFootprint(facadeCurve, PODIUM_DEPTH), TERRACE_Y),
    materials.shell,
    { walkable: true }
  );
  podium.name = 'podium';

  // Only the wings are solid mass. The centre span is left hollow so the
  // entrance atrium can be a real interior you can walk into, rather than a
  // void carved out of a block after the fact.
  //
  // The mass is clad white, because its rear and end elevations are seen from
  // outside. A thin dark liner then sits between the mass and the glazing, which
  // is what gives the curtain wall a deep interior to reflect against — with a
  // white surface directly behind it, the glass reads as pale panel.
  wings.forEach((curve) => {
    const wingCore = place(
      extrudeFootprint(facadeFootprint(curve, CORE_DEPTH, 64), ROOF_Y - TERRACE_Y),
      materials.shell
    );
    wingCore.position.y = TERRACE_Y;

    place(
      sweepProfile(curve, boxProfile(0.25, 1.45, TERRACE_Y, ROOF_Y - 0.2), { divisions: 120 }),
      materials.interior,
      { shadow: false }
    );
  });

  // The podium is a solid mass; block walking through it except at the stair.
  {
    const frames = sampleFrames(facadeCurve, 48);
    frames.forEach(({ position, lateral }) => {
      // A thin collider wall just inside the facade line, with a gap at the
      // centre where the entrance doors are.
      if (Math.abs(position.x) < 9) return;
      const inner = position.clone().addScaledVector(lateral, -1.2);
      colliders.push(
        new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(inner.x, TERRACE_Y + 8, inner.z),
          new THREE.Vector3(4.2, 16, 4.2)
        )
      );
    });
  }

  // ---- Slab bands and cove lighting ------------------------------------
  // Wings get two expressed floor bands; the centre block is double height.
  const bandSpecs = [
    { yTop: L1_TOP, thickness: L1_BAND },
    { yTop: L2_TOP, thickness: L2_BAND },
  ];

  wings.forEach((curve) => {
    bandSpecs.forEach(({ yTop, thickness }) => {
      // Slab: projects past the glass line to cast a shadow across it.
      place(
        sweepProfile(curve, boxProfile(-3.4, 2.6, yTop - thickness, yTop), { divisions: 130 }),
        materials.shell
      );
      // Cove light tucked under the slab nose.
      const cove = place(
        sweepProfile(curve, boxProfile(2.2, 2.62, yTop - thickness - 0.16, yTop - thickness + 0.02), {
          divisions: 130,
        }),
        materials.neon,
        { shadow: false, receive: false }
      );
      cove.name = 'cove';
      // Terrace planting sits on the band tops, as in the renders.
      walkables.push(place(
        sweepProfile(curve, boxProfile(-3.4, 2.4, yTop, yTop + 0.02), { divisions: 60 }),
        materials.soffit,
        { shadow: false }
      ));
    });
  });

  // ---- Glazing ---------------------------------------------------------
  const glassBands = [];
  wings.forEach((curve) => {
    glassBands.push(
      { curve, from: TERRACE_Y + 0.1, to: L1_TOP - L1_BAND },
      { curve, from: L1_TOP, to: L2_TOP - L2_BAND },
      { curve, from: L2_TOP, to: ROOF_Y - 0.2 }
    );
  });
  // Centre block: full-height lobby glazing, up to the crown.
  glassBands.push({ curve: centerCurve, from: TERRACE_Y + 0.1, to: CROWN_Y - 0.3, center: true });

  glassBands.forEach(({ curve, from, to, center }) => {
    const glass = place(
      sweepProfile(curve, boxProfile(1.6, 1.78, from, to), { divisions: center ? 90 : 120 }),
      materials.glass,
      { shadow: false, receive: false }
    );
    glass.renderOrder = 2;

    // Curtain-wall mullions: verticals every 2.4 m, plus a transom at mid height.
    const height = to - from;
    const mullion = instanceAlongCurve(
      track(new THREE.BoxGeometry(0.13, height, 0.34)),
      materials.metal,
      curve,
      2.4,
      { lateral: 1.72, y: from + height / 2 }
    );
    group.add(mullion);
    disposables.push(mullion.geometry);

    place(
      sweepProfile(curve, boxProfile(1.55, 1.85, from + height / 2 - 0.07, from + height / 2 + 0.07), {
        divisions: 80,
      }),
      materials.metal,
      { receive: false }
    );
  });

  // ---- Roofline --------------------------------------------------------
  // A single band across the whole building with a slow vertical undulation —
  // the wave that ties the centre block to the wings.
  // Rises over the entrance, dips as it runs out along the wings, and carries a
  // gentle ripple the whole way — the line that ties the composition together.
  // The band follows the wings at their own roofline and the crown gets its own
  // band on top. An earlier version lifted a single band up over the centre with
  // a Gaussian, but even a wide bell keeps ~90% of its lift 15 m out — so the
  // band floated several metres clear of the wings, which only reach ROOF_Y.
  // Two bands let each one sit on the mass it actually caps.
  const ripple = (amplitude, frequency) => (t) =>
    Math.sin(t * Math.PI * frequency + 0.3) * amplitude -
    2.0 * Math.pow(1 - Math.min(Math.min(t, 1 - t) / 0.3, 1), 2);

  const roofBand = (curve, y, waveY, divisions) => {
    place(
      sweepProfile(curve, boxProfile(-4.6, 3.6, y, y + ROOF_BAND), {
        divisions,
        offsetY: waveY,
      }),
      materials.shell
    );
    const cove = place(
      sweepProfile(curve, boxProfile(3.1, 3.66, y - 0.26, y + 0.04), {
        divisions,
        offsetY: waveY,
      }),
      materials.neon,
      { shadow: false, receive: false }
    );
    cove.name = 'cove';
  };

  roofBand(facadeCurve, ROOF_Y, ripple(0.55, 3.4), 300);
  // The crown band has no tip fall — it is a short span and would dive at both
  // ends — so it gets a plain shallow wave.
  roofBand(centerCurve, CROWN_Y + 0.5, (t) => Math.sin(t * Math.PI * 1.6) * 0.3, 90);

  // Roof decks. The wings cap at the main roofline; the centre block carries its
  // own deck up at the crown. Without the crown deck you look down into the
  // atrium from any raised viewpoint, and its ceiling and downlights show above
  // the roofline from the plaza.
  wings.forEach((curve) => {
    place(
      extrudeFootprint(facadeFootprint(curve, CORE_DEPTH - 1, 48), 0.4),
      materials.soffit
    ).position.y = ROOF_Y;
  });

  const centreFootprint = facadeFootprint(centerCurve, CORE_DEPTH, 28);
  place(extrudeFootprint(centreFootprint, 0.5), materials.shell).position.y = CROWN_Y;

  // Flanks of the crown, closing the step up from the wings' roofline.
  [-1, 1].forEach((side) => {
    const flank = place(
      new THREE.BoxGeometry(0.7, CROWN_Y - ROOF_Y + 0.5, CORE_DEPTH),
      materials.shell
    );
    flank.position.set(side * 13, (ROOF_Y + CROWN_Y + 0.5) / 2, 1.4 - CORE_DEPTH / 2);
  });
  // Rear wall of the crown.
  const crownBack = place(new THREE.BoxGeometry(26.7, CROWN_Y - ROOF_Y + 0.5, 0.7), materials.shell);
  crownBack.position.set(0, (ROOF_Y + CROWN_Y + 0.5) / 2, 1.4 - CORE_DEPTH);

  // ---- Brand panel -----------------------------------------------------
  const brand = makeBrandPanel();
  disposables.push(brand.map, brand.emissiveMap);
  const brandMaterial = new THREE.MeshStandardMaterial({
    map: brand.map,
    emissiveMap: brand.emissiveMap,
    emissive: 0xffffff,
    emissiveIntensity: 2.6,
    roughness: 0.4,
    metalness: 0,
  });
  const brandPanel = place(new THREE.PlaneGeometry(22, 11), brandMaterial, { receive: false });
  brandPanel.position.set(0, 16.4, 2.45);
  // Deep reveal so the panel sits within the facade rather than stuck on it.
  place(new THREE.BoxGeometry(23.2, 12.2, 0.8), materials.shell).position.set(0, 16.4, 1.95);

  // ---- Entrance --------------------------------------------------------
  // Revolving-door bank set into the centre of the curtain wall.
  const doorBay = new THREE.Group();
  // Sits just proud of the glazing line (lateral 1.6-1.78 puts the curtain wall
  // at about z = 1.7 on centre), so the doors read in front of the glass.
  doorBay.position.set(0, TERRACE_Y, 2.05);
  group.add(doorBay);
  const DOOR_H = 5.6;
  for (let i = -3; i <= 3; i++) {
    const frame = new THREE.Mesh(track(new THREE.BoxGeometry(0.18, DOOR_H, 0.5)), materials.metal);
    frame.position.set(i * 2.5, DOOR_H / 2, 0);
    frame.castShadow = true;
    doorBay.add(frame);
  }
  const doorGlass = new THREE.Mesh(track(new THREE.BoxGeometry(15, DOOR_H - 0.1, 0.12)), materials.glass);
  doorGlass.position.set(0, DOOR_H / 2, 0);
  doorBay.add(doorGlass);
  const lintel = new THREE.Mesh(track(new THREE.BoxGeometry(16.6, 0.6, 1.2)), materials.shell);
  lintel.position.set(0, DOOR_H + 0.3, 0);
  lintel.castShadow = true;
  doorBay.add(lintel);
  const doorCove = new THREE.Mesh(track(new THREE.BoxGeometry(15.6, 0.14, 0.3)), materials.neon);
  doorCove.position.set(0, DOOR_H - 0.05, 0.5);
  doorCove.name = 'cove';
  doorBay.add(doorCove);

  // ---- Grand stair -----------------------------------------------------
  const STAIR_STEPS = 24;
  const STAIR_RISE = TERRACE_Y / STAIR_STEPS;
  const STAIR_TREAD = 0.72;
  const stairFrontZ = 2.4 + STAIR_STEPS * STAIR_TREAD;
  const stairs = place(
    buildStairs({
      steps: STAIR_STEPS,
      width: 22,
      rise: STAIR_RISE,
      tread: STAIR_TREAD,
      zStart: stairFrontZ,
      yStart: 0,
    }),
    materials.stone,
    { walkable: true }
  );
  stairs.name = 'stairs';

  // Cheek walls and handrails flanking the flight.
  const stairRun = STAIR_STEPS * STAIR_TREAD;
  const stairMidZ = 2.4 + stairRun / 2;
  // The flight climbs toward -Z. A box's local +Z must therefore tip downward,
  // which needs a positive X rotation; negating it lifts the plaza end into the
  // air instead of burying it in the steps.
  const rake = Math.atan2(TERRACE_Y, stairRun);
  [-1, 1].forEach((side) => {
    const cheek = place(new THREE.BoxGeometry(1.6, 1.15, stairRun + 1.6), materials.shell);
    cheek.position.set(side * 11.8, TERRACE_Y / 2 + 0.42, stairMidZ);
    cheek.rotation.x = rake;

    // A cylinder's axis is +Y, so aligning it with the raked flight is a
    // rotation of (90 degrees - rake) the other way round.
    const rail = place(
      new THREE.CylinderGeometry(0.07, 0.07, stairRun + 1.6, 12),
      materials.metal
    );
    rail.position.set(side * 11.8, TERRACE_Y / 2 + 1.5, stairMidZ);
    rail.rotation.x = -(Math.PI / 2 - rake);

    // Newel posts pin the rail to the cheek at both ends.
    [-1, 1].forEach((end) => {
      const dz = (end * (stairRun + 1.6)) / 2;
      const post = place(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 10), materials.metal);
      post.position.set(
        side * 11.8,
        TERRACE_Y / 2 + 0.95 - (dz * TERRACE_Y) / stairRun,
        stairMidZ + dz
      );
    });

    // Flanking planters at the foot of the stair.
    const planter = place(new THREE.BoxGeometry(5, 1.2, 5), materials.shell, { walkable: true });
    planter.position.set(side * 17, 0.6, stairFrontZ + 1.5);
    colliders.push(new THREE.Box3().setFromObject(planter));
    plantTreeLater.push([side * 17, 1.2, stairFrontZ + 1.5, 1.1]);
  });

  // Terrace landing in front of the doors.
  const landing = place(new THREE.BoxGeometry(30, 0.3, 6), materials.stone, { walkable: true });
  landing.position.set(0, TERRACE_Y - 0.15, 4);

  // ---- Reflecting pools and fountains ---------------------------------
  const pools = [];
  const POOL_W = 34;
  const POOL_D = 52;
  const RIM = 1.8;
  [-1, 1].forEach((side) => {
    const cx = side * 29;
    const cz = 58;
    // Coping is a rim of four bars, not a solid slab — a slab would simply cap
    // the basin and hide the water inside it.
    const rims = [
      [POOL_W, RIM, 0, (POOL_D - RIM) / 2],
      [POOL_W, RIM, 0, -(POOL_D - RIM) / 2],
      [RIM, POOL_D - RIM * 2, (POOL_W - RIM) / 2, 0],
      [RIM, POOL_D - RIM * 2, -(POOL_W - RIM) / 2, 0],
    ];
    rims.forEach(([w, d, dx, dz]) => {
      const bar = place(new THREE.BoxGeometry(w, 1.0, d), materials.stone, { walkable: true });
      bar.position.set(cx + dx, 0.5, cz + dz);
      colliders.push(new THREE.Box3().setFromObject(bar));
    });

    const basin = place(
      new THREE.BoxGeometry(POOL_W - RIM * 2, 0.9, POOL_D - RIM * 2),
      materials.darkMetal,
      { shadow: false }
    );
    basin.position.set(cx, 0.15, cz);

    const water = new THREE.Mesh(
      track(new THREE.PlaneGeometry(POOL_W - RIM * 2, POOL_D - RIM * 2, 1, 1)),
      new THREE.MeshPhysicalMaterial({
        color: 0x17587a,
        roughness: 0.02,
        metalness: 0.0,
        transparent: true,
        opacity: 0.86,
        transmission: 0.25,
        normalMap: materials.waterNormals,
        normalScale: new THREE.Vector2(0.14, 0.14),
        envMap: scene.environment,
        envMapIntensity: 1.25,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(cx, 0.72, cz);
    water.receiveShadow = false;
    group.add(water);
    pools.push(water.material);

    // Fountain jets: a tapered column of water plus a glow at the nozzle.
    for (let i = 0; i < 5; i++) {
      const z = 38 + i * 10;
      const jet = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.1, 0.55, 7, 12, 1, true)),
        new THREE.MeshPhysicalMaterial({
          color: 0xdff2ff,
          transparent: true,
          opacity: 0.35,
          roughness: 0.1,
          metalness: 0,
          side: THREE.DoubleSide,
          envMap: scene.environment,
        })
      );
      jet.position.set(cx + (i % 2 ? -7 : 7), 4.4, z);
      group.add(jet);
      animated.push({ type: 'jet', object: jet, phase: i * 1.3 + (side > 0 ? 0.6 : 0) });

      // Submerged uplight at the nozzle, just under the waterline.
      const splash = new THREE.Mesh(
        track(new THREE.CylinderGeometry(1.7, 1.7, 0.05, 20)),
        materials.neon
      );
      splash.position.set(jet.position.x, 0.68, z);
      splash.name = 'cove';
      group.add(splash);
    }
  });

  // ---- Landscaping -----------------------------------------------------
  const hedgeRow = (x, z, width, depth) => {
    const hedge = place(new THREE.BoxGeometry(width, 1.5, depth), materials.hedge, { walkable: true });
    hedge.position.set(x, 0.75, z);
    colliders.push(new THREE.Box3().setFromObject(hedge));
  };
  [-1, 1].forEach((side) => {
    hedgeRow(side * 11.5, 58, 3.2, 52);
    hedgeRow(side * 46.5, 58, 3.2, 52);
  });

  // Umbrella-canopy trees, as in the reference planting.
  //
  // Transforms are collected here and committed to two InstancedMeshes at the
  // end of the build. Built as individual meshes instead, the ~130 trees on the
  // campus cost close to a thousand draw calls per frame — by far the largest
  // single cost in the scene.
  const trunkMatrices = [];
  const canopyMatrices = [];
  const scratch = new THREE.Matrix4();
  const euler = new THREE.Euler();
  const quaternion = new THREE.Quaternion();

  const plantTree = (x, y, z, scale, tiers = 3) => {
    scratch.compose(
      new THREE.Vector3(x, y + 1.3 * scale, z),
      new THREE.Quaternion(),
      new THREE.Vector3(scale, 2.6 * scale, scale)
    );
    trunkMatrices.push(scratch.clone());

    // Overlapping rounded lobes, offset off-axis, rather than a stack of flat
    // discs — reads as a canopy instead of a pagoda.
    for (let i = 0; i < tiers; i++) {
      const lobes = i === 0 ? 3 : 2;
      for (let l = 0; l < lobes; l++) {
        const spread = (1.75 - i * 0.3) * scale * (0.72 + Math.random() * 0.35);
        const angle = Math.random() * Math.PI * 2;
        const drift = (0.55 - i * 0.12) * scale * Math.random();
        euler.set(Math.random(), Math.random() * Math.PI, Math.random() * 0.4);
        quaternion.setFromEuler(euler);
        scratch.compose(
          new THREE.Vector3(
            x + Math.cos(angle) * drift,
            y + (2.5 + i * 0.82) * scale,
            z + Math.sin(angle) * drift
          ),
          quaternion,
          new THREE.Vector3(spread, spread * 0.78, spread)
        );
        canopyMatrices.push(scratch.clone());
      }
    }

    colliders.push(
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, y + 2 * scale, z),
        new THREE.Vector3(1.1, 4 * scale, 1.1)
      )
    );
  };

  const commitPlanting = () => {
    const build = (geometry, material, matrices) => {
      const mesh = new THREE.InstancedMesh(track(geometry), material, matrices.length);
      matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      // Instances are spread across the whole site, so the shared bounding
      // sphere must cover it or frustum culling drops the entire batch.
      mesh.frustumCulled = false;
      group.add(mesh);
    };
    build(new THREE.CylinderGeometry(0.17, 0.26, 1, 8), materials.bark, trunkMatrices);
    build(new THREE.SphereGeometry(1, 12, 8), materials.foliage, canopyMatrices);
  };

  plantTreeLater.forEach(([x, y, z, scale]) => plantTree(x, y, z, scale, 2));

  // Plaza avenue.
  for (let i = 0; i < 6; i++) {
    const z = 34 + i * 12;
    plantTree(-18, 0, z, 1.35);
    plantTree(18, 0, z, 1.35);
  }
  // Terrace planting on the wing slab bands.
  wings.forEach((curve) => {
    [L1_TOP, L2_TOP].forEach((y, level) => {
      const count = 7;
      for (let i = 0; i < count; i++) {
        const t = 0.1 + (i / (count - 1)) * 0.85;
        const point = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t).setY(0).normalize();
        const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x);
        const spot = point.clone().addScaledVector(lateral, -1.3);
        plantTree(spot.x, y, spot.z, 0.82 - level * 0.08, 2);
      }
    });
  });
  // Beds either side of the approach.
  for (let i = 0; i < 5; i++) {
    plantTree(-58 + Math.random() * 8, 0, 34 + i * 20, 1.9);
    plantTree(58 - Math.random() * 8, 0, 34 + i * 20, 1.9);
  }

  // ---- Distant context -------------------------------------------------
  // A treeline closes the view without pulling focus.
  for (let i = 0; i < 70; i++) {
    const angle = (i / 70) * Math.PI * 2;
    const radius = 300 + Math.random() * 90;
    plantTree(Math.cos(angle) * radius, 0, Math.sin(angle) * radius + 40, 3 + Math.random() * 2, 2);
  }

  commitPlanting();

  const update = (elapsed) => {
    animated.forEach(({ type, object, phase }) => {
      if (type === 'jet') {
        const pulse = 1 + Math.sin(elapsed * 2.1 + phase) * 0.12;
        object.scale.set(1, pulse, 1);
        object.position.y = 4.4 * pulse;
      }
    });
    pools.forEach((material, i) => {
      material.normalMap.offset.set(elapsed * 0.014 * (i ? 1 : -1), elapsed * 0.02);
    });
  };

  const dispose = () => {
    disposables.forEach((d) => d.dispose?.());
    brandMaterial.dispose();
    pools.forEach((m) => m.dispose());
    scene.remove(group);
  };

  return {
    group,
    colliders,
    walkables,
    update,
    dispose,
    curves: { facadeCurve, centerCurve, wings },
    datums: { PLAZA_Y, TERRACE_Y, ROOF_Y, stairFrontZ },
  };
}
