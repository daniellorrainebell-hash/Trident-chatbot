import * as THREE from 'three';

/**
 * Students, staff and AI assistants.
 *
 * These are procedural low-poly figures with a simple idle/walk cycle. They are
 * built to read correctly at plaza and atrium distance — silhouette, uniform
 * colours, the white-and-charcoal robot chassis — not to stand up to close
 * inspection. Photoreal characters need authored, rigged and textured assets;
 * there is no procedural route to them.
 */

const LIMB_SEGMENTS = 6;

function buildFigure(materials, { robot = false, torsoColor, scale = 1 } = {}) {
  const group = new THREE.Group();
  const joints = {};

  const shell = robot ? materials.chassis : torsoColor;
  const dark = robot ? materials.joint : materials.uniformNavy;

  // Torso: tapered, slight forward lean at the shoulders.
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.19, 0.44, 4, 12),
    robot ? materials.chassis : shell
  );
  torso.position.y = 1.19;
  torso.scale.set(1.16, 1, 0.78);
  torso.castShadow = true;
  group.add(torso);

  // Hips.
  const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.14, 4, 12), dark);
  hips.position.y = 0.9;
  hips.scale.set(1.1, 1, 0.85);
  hips.castShadow = true;
  group.add(hips);

  // Head and neck.
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.09, 8), dark);
  neck.position.y = 1.5;
  group.add(neck);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.115, 16, 14),
    robot ? materials.chassis : materials.skin
  );
  head.position.y = 1.62;
  head.scale.set(0.92, 1.1, 0.98);
  head.castShadow = true;
  group.add(head);
  joints.head = head;

  if (robot) {
    // Visor band and a glowing sensor ring, as on the reference robots.
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.118, 16, 12), materials.joint);
    visor.position.copy(head.position);
    visor.scale.set(0.94, 0.52, 1.0);
    visor.position.y += 0.012;
    visor.position.z += 0.008;
    group.add(visor);

    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.011, 6, 16), materials.neon);
    eye.position.set(0, 1.632, 0.108);
    group.add(eye);

    const chestRing = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.016, 6, 18), materials.neon);
    chestRing.position.set(0, 1.24, 0.152);
    group.add(chestRing);
  } else {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.122, 14, 12), materials.hair);
    hair.position.copy(head.position);
    hair.position.y += 0.026;
    hair.scale.set(0.96, 0.86, 1.0);
    group.add(hair);

    // A pale panel down the front reads as the uniform's contrast stripe.
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.4, 0.02), materials.uniformWhite);
    stripe.position.set(0, 1.2, 0.16);
    group.add(stripe);
  }

  // Arms and legs hang from pivot groups so they can swing.
  const limb = (length, radius, material) => {
    const mesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(radius, length - radius * 2, 3, LIMB_SEGMENTS),
      material
    );
    mesh.position.y = -length / 2;
    mesh.castShadow = true;
    const pivot = new THREE.Group();
    pivot.add(mesh);
    return pivot;
  };

  joints.arms = [-1, 1].map((side) => {
    const pivot = limb(0.62, 0.055, robot ? materials.chassis : shell);
    pivot.position.set(side * 0.25, 1.42, 0);
    group.add(pivot);
    return pivot;
  });

  joints.legs = [-1, 1].map((side) => {
    const pivot = limb(0.86, 0.072, robot ? materials.chassis : materials.uniformNavy);
    pivot.position.set(side * 0.1, 0.87, 0);
    group.add(pivot);

    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.06, 0.22),
      robot ? materials.chassis : materials.uniformWhite
    );
    shoe.position.set(0, -0.85, 0.03);
    shoe.castShadow = true;
    pivot.add(shoe);
    return pivot;
  });

  group.scale.setScalar(scale);
  return { group, joints };
}

/**
 * @param spec.path    array of [x, z] waypoints; figures loop along it
 * @param spec.y       ground height for this figure
 * @param spec.robot   render as an AI assistant
 * @param spec.speed   metres per second; 0 stands still
 * @param spec.facing  radians, used only when standing still
 */
export function buildPeople(scene, materials, specs) {
  const group = new THREE.Group();
  scene.add(group);

  const disposed = [];
  const actors = [];

  const uniformTops = [materials.uniformNavy, materials.uniformWhite];

  specs.forEach((spec, index) => {
    const { group: figure, joints } = buildFigure(materials, {
      robot: spec.robot,
      torsoColor: uniformTops[index % uniformTops.length],
      scale: spec.robot ? 1.04 : 0.95 + ((index * 37) % 11) / 100,
    });
    group.add(figure);
    figure.traverse((child) => {
      if (child.isMesh) disposed.push(child.geometry);
    });

    const path = spec.path
      ? spec.path.map(([x, z]) => new THREE.Vector3(x, spec.y ?? 0, z))
      : null;
    const curve = path && path.length > 1 ? new THREE.CatmullRomCurve3(path, true) : null;

    actors.push({
      figure,
      joints,
      curve,
      length: curve ? curve.getLength() : 0,
      speed: spec.speed ?? 0,
      offset: (index * 0.37) % 1,
      phase: index * 1.7,
      home: new THREE.Vector3(spec.at?.[0] ?? 0, spec.y ?? 0, spec.at?.[1] ?? 0),
      facing: spec.facing ?? 0,
    });

    if (!curve) {
      figure.position.copy(actors[actors.length - 1].home);
      figure.rotation.y = spec.facing ?? 0;
    }
  });

  const forward = new THREE.Vector3();

  const update = (elapsed) => {
    actors.forEach((actor) => {
      const { figure, joints, curve, speed, phase } = actor;

      if (curve && speed > 0) {
        const t = (actor.offset + (elapsed * speed) / actor.length) % 1;
        curve.getPointAt(t, figure.position);
        curve.getTangentAt(t, forward);
        figure.rotation.y = Math.atan2(forward.x, forward.z);

        // Walk cycle: opposed arm and leg swing, plus a small vertical bob.
        const stride = elapsed * speed * 2.4 + phase;
        const swing = Math.sin(stride) * 0.55;
        joints.legs[0].rotation.x = swing;
        joints.legs[1].rotation.x = -swing;
        joints.arms[0].rotation.x = -swing * 0.7;
        joints.arms[1].rotation.x = swing * 0.7;
        figure.position.y += Math.abs(Math.cos(stride)) * 0.035;
      } else {
        // Idle: weight shift, a little arm sway, occasional glance.
        const idle = elapsed * 0.9 + phase;
        const sway = Math.sin(idle) * 0.07;
        joints.arms[0].rotation.x = sway;
        joints.arms[1].rotation.x = -sway;
        joints.legs[0].rotation.x = 0;
        joints.legs[1].rotation.x = 0;
        figure.rotation.y = actor.facing + Math.sin(idle * 0.4) * 0.16;
        joints.head.rotation.y = Math.sin(idle * 0.5 + 1) * 0.35;
        figure.position.y = actor.home.y + Math.sin(idle * 2) * 0.006;
      }
    });
  };

  const dispose = () => {
    disposed.forEach((geometry) => geometry.dispose());
    scene.remove(group);
  };

  return { group, update, dispose, count: actors.length };
}

/** Populates the plaza, the entrance stair and the atrium. */
export function populateCampus(scene, materials, { plazaY = 0, atriumY = 3.6 } = {}) {
  const specs = [
    // Plaza: groups arriving along the central walk.
    { path: [[-6, 96], [-5, 60], [-3, 34], [-2, 22]], y: plazaY, speed: 1.25 },
    { path: [[7, 22], [6, 44], [8, 70], [9, 98]], y: plazaY, speed: 1.1 },
    { path: [[-20, 40], [-14, 30], [-8, 26], [-4, 24]], y: plazaY, speed: 1.0 },
    { path: [[22, 32], [14, 26], [6, 24]], y: plazaY, speed: 1.15, robot: true },
    { at: [-13, 30], y: plazaY, facing: 0.7 },
    { at: [-11.6, 31.2], y: plazaY, facing: -2.3 },
    { at: [-12.6, 32.4], y: plazaY, facing: 2.9, robot: true },
    { at: [15, 40], y: plazaY, facing: -0.9 },
    { at: [16.4, 41], y: plazaY, facing: 2.2 },
    { at: [-30, 20], y: plazaY, facing: 1.4 },
    { at: [31, 18], y: plazaY, facing: -1.2, robot: true },

    // Atrium: reception, wayfinding, small clusters.
    { at: [-2.2, -11], y: atriumY, facing: Math.PI, robot: true },
    { at: [-3.6, -9.4], y: atriumY, facing: 0.2 },
    { at: [-2.2, -8.6], y: atriumY, facing: -0.4 },
    { at: [4.4, -12.6], y: atriumY, facing: 3.5 },
    { at: [6.2, -11], y: atriumY, facing: 2.6, robot: true },
    { path: [[-9, -4], [-9, -22], [9, -24], [9, -5]], y: atriumY, speed: 0.85 },
    { path: [[9, -6], [8, -20], [-8, -22], [-9, -7]], y: atriumY, speed: 0.7, robot: true },
    { path: [[0, -3], [5, -8], [2, -18], [-5, -12]], y: atriumY, speed: 0.95 },
    { at: [0.5, -14.4], y: atriumY, facing: 0 },
    { at: [-6.5, -19], y: atriumY, facing: 1.1 },
    { at: [7.5, -19.5], y: atriumY, facing: -1.4, robot: true },

    // Entrance terrace.
    { at: [-6, 3.5], y: atriumY, facing: 2.8 },
    { at: [5.5, 3.2], y: atriumY, facing: -2.6, robot: true },
  ];

  return buildPeople(scene, materials, specs);
}
