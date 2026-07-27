import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Geometry helpers for parametric architecture.
 *
 * The campus facades are curved ribbons — floor slabs, glass walls, neon
 * reveals and balustrades all follow the same plan curves. Rather than
 * approximating them with primitives, everything is swept: a 2D cross-section
 * profile is carried along a path, which is how the real buildings in the
 * reference renders are shaped.
 *
 * ExtrudeGeometry's `extrudePath` is deliberately avoided here. It builds
 * Frenet frames, which roll the profile around the path and twist a horizontal
 * ribbon into a corkscrew. These sweeps pin "up" to +Y instead.
 */

/** Catmull-Rom curve through XZ control points at a fixed height. */
export function planCurve(points, y = 0) {
  return new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, y, z)),
    false,
    'catmullrom',
    0.25
  );
}

/** Evenly spaced samples along a curve, with tangent and lateral vectors. */
export function sampleFrames(curve, divisions) {
  const frames = [];
  for (let i = 0; i <= divisions; i++) {
    const t = i / divisions;
    const position = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).setY(0).normalize();
    // Lateral = tangent rotated 90 degrees about +Y. Up is always +Y, so a
    // horizontal ribbon stays horizontal for the whole sweep.
    const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x);
    frames.push({ t, position, tangent, lateral });
  }
  return frames;
}

/**
 * Sweep a closed cross-section along a path.
 *
 * @param curve    path to follow
 * @param profile  closed polygon as [lateral, vertical] pairs, in metres
 *                 **relative to the path**, not in world space. The path already
 *                 carries its own height, so a curve built at y = 16 with a
 *                 profile spanning 16..17 lands at 32..33. Wind counter-clockwise.
 * @param options.divisions   samples along the path
 * @param options.offsetY     f(t) -> extra height, for undulating rooflines
 * @param options.offsetX     f(t) -> extra lateral shift
 * @param options.caps        close the two ends
 * @param options.uvScale     [uAlongPath, vAcrossProfile] texture density
 */
export function sweepProfile(curve, profile, options = {}) {
  const {
    divisions = 160,
    offsetY = null,
    offsetX = null,
    caps = true,
    uvScale = [0.08, 0.25],
  } = options;

  const frames = sampleFrames(curve, divisions);
  const length = curve.getLength();
  const ring = profile.length;

  const positions = [];
  const uvs = [];
  const indices = [];

  // One ring of vertices per sample. Rings are duplicated per profile edge so
  // each facet gets its own normals — these are hard architectural edges, not
  // a smooth tube.
  const rings = frames.map((frame) => {
    const dy = offsetY ? offsetY(frame.t) : 0;
    const dx = offsetX ? offsetX(frame.t) : 0;
    return profile.map(([lat, vert]) =>
      frame.position
        .clone()
        .addScaledVector(frame.lateral, lat + dx)
        .add(new THREE.Vector3(0, vert + dy, 0))
    );
  });

  for (let edge = 0; edge < ring; edge++) {
    const next = (edge + 1) % ring;
    const base = positions.length / 3;

    for (let i = 0; i < rings.length; i++) {
      const u = (i / divisions) * length * uvScale[0];
      rings[i][edge].toArray(positions, positions.length);
      uvs.push(u, 0);
      rings[i][next].toArray(positions, positions.length);
      const span = Math.hypot(
        profile[next][0] - profile[edge][0],
        profile[next][1] - profile[edge][1]
      );
      uvs.push(u, span * uvScale[1]);
    }

    for (let i = 0; i < divisions; i++) {
      const a = base + i * 2;
      indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
  }

  if (caps) {
    [0, rings.length - 1].forEach((ringIndex, end) => {
      const base = positions.length / 3;
      rings[ringIndex].forEach((v) => {
        v.toArray(positions, positions.length);
        uvs.push(0, 0);
      });
      // Profiles are convex quads/rects in practice, so a fan is sufficient.
      for (let i = 1; i < ring - 1; i++) {
        if (end === 0) indices.push(base, base + i, base + i + 1);
        else indices.push(base, base + i + 1, base + i);
      }
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Rectangular cross-section, given lateral extent and height range. */
export function boxProfile(latFrom, latTo, yFrom, yTo) {
  return [
    [latFrom, yFrom],
    [latTo, yFrom],
    [latTo, yTo],
    [latFrom, yTo],
  ];
}

/**
 * Instance a unit-scaled mesh at regular arc-length intervals along a curve,
 * aligned to the path. Used for curtain-wall mullions, railing posts, lights.
 */
export function instanceAlongCurve(geometry, material, curve, spacing, options = {}) {
  const { lateral = 0, y = 0, jitter = 0, align = true } = options;
  const length = curve.getLength();
  const count = Math.max(1, Math.floor(length / spacing));
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const scale = new THREE.Vector3(1, 1, 1);

  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).setY(0).normalize();
    const lateralVec = new THREE.Vector3(-tangent.z, 0, tangent.x);
    const position = point
      .clone()
      .addScaledVector(lateralVec, lateral)
      .add(new THREE.Vector3(0, y + (jitter ? (Math.random() - 0.5) * jitter : 0), 0));
    if (align) {
      const angle = Math.atan2(tangent.x, tangent.z);
      quaternion.setFromAxisAngle(up, angle);
    } else {
      quaternion.identity();
    }
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(i, matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Mirror XZ control points across x = 0, reversing so the path stays continuous. */
export function mirrorPoints(points) {
  return points.map(([x, z]) => [-x, z]).reverse();
}

/** Merge a list of geometries, disposing the sources. */
export function mergeAndDispose(geometries) {
  const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
  geometries.forEach((g) => g.dispose());
  return merged;
}

/** A flight of stairs as a single merged geometry. */
export function buildStairs({ steps, width, rise, tread, zStart, yStart }) {
  const geometries = [];
  for (let i = 0; i < steps; i++) {
    const box = new THREE.BoxGeometry(width, rise, tread);
    box.translate(0, yStart + rise * (i + 0.5), zStart - tread * (i + 0.5));
    geometries.push(box);
  }
  return mergeAndDispose(geometries);
}
