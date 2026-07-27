import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

/**
 * First-person walkthrough: WASD to move, mouse to look, shift to sprint,
 * space to jump.
 *
 * Ground height comes from a downward raycast against the walkable meshes, so
 * the stair, terrace, podium and mezzanine galleries are all climbable without
 * any special-casing. Horizontal blocking uses axis-aligned boxes, resolved one
 * axis at a time so sliding along a wall works instead of sticking.
 */

const EYE_HEIGHT = 1.68;
const WALK_SPEED = 4.4;
const SPRINT_SPEED = 8.6;
const GRAVITY = 22;
const JUMP_SPEED = 6.4;
const RADIUS = 0.42; // player capsule radius, for wall clearance
const STEP_UP = 0.72; // tallest ledge that can be walked straight up

export function createWalker(camera, domElement, { walkables, colliders, start }) {
  const controls = new PointerLockControls(camera, domElement);

  const keys = new Set();
  const onKeyDown = (event) => {
    keys.add(event.code);
    // Space would otherwise scroll the page behind the canvas.
    if (event.code === 'Space') event.preventDefault();
  };
  const onKeyUp = (event) => keys.delete(event.code);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  const position = new THREE.Vector3(start?.[0] ?? 0, start?.[1] ?? EYE_HEIGHT, start?.[2] ?? 90);
  let verticalVelocity = 0;
  let grounded = true;

  const raycaster = new THREE.Raycaster();
  raycaster.far = 60;
  const down = new THREE.Vector3(0, -1, 0);
  const probe = new THREE.Vector3();

  /** Highest walkable surface under `x, z` at or below `fromY`. */
  const groundAt = (x, z, fromY) => {
    probe.set(x, fromY + STEP_UP, z);
    raycaster.set(probe, down);
    const hits = raycaster.intersectObjects(walkables, false);
    for (const hit of hits) {
      // Skip near-vertical faces; they are walls, not floors.
      if (hit.face && hit.face.normal.y < 0.5) continue;
      return hit.point.y;
    }
    return null;
  };

  const blocked = (x, y, z) => {
    for (const box of colliders) {
      if (
        x + RADIUS > box.min.x &&
        x - RADIUS < box.max.x &&
        z + RADIUS > box.min.z &&
        z - RADIUS < box.max.z &&
        y + 1.6 > box.min.y &&
        y < box.max.y
      ) {
        return true;
      }
    }
    return false;
  };

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const step = new THREE.Vector3();

  const update = (delta) => {
    const dt = Math.min(delta, 0.05); // clamp so a stalled frame can't tunnel

    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();
    right.crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize().negate();

    step.set(0, 0, 0);
    if (keys.has('KeyW') || keys.has('ArrowUp')) step.add(forward);
    if (keys.has('KeyS') || keys.has('ArrowDown')) step.sub(forward);
    if (keys.has('KeyD') || keys.has('ArrowRight')) step.add(right);
    if (keys.has('KeyA') || keys.has('ArrowLeft')) step.sub(right);

    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? SPRINT_SPEED : WALK_SPEED;
    if (step.lengthSq() > 0) step.normalize().multiplyScalar(speed * dt);

    const feetY = position.y - EYE_HEIGHT;

    // Resolve each axis separately so a blocked X still allows Z movement —
    // this is what makes the player slide along a wall rather than stop dead.
    if (step.x !== 0 && !blocked(position.x + step.x, feetY, position.z)) position.x += step.x;
    if (step.z !== 0 && !blocked(position.x, feetY, position.z + step.z)) position.z += step.z;

    // Vertical: snap to ground when falling onto it, otherwise integrate.
    const ground = groundAt(position.x, position.z, feetY);
    if (keys.has('Space') && grounded) {
      verticalVelocity = JUMP_SPEED;
      grounded = false;
    }
    verticalVelocity -= GRAVITY * dt;
    let nextFeet = feetY + verticalVelocity * dt;

    if (ground !== null && nextFeet <= ground) {
      // Walking up a shallow step should not require a jump.
      if (verticalVelocity <= 0 || ground - feetY < STEP_UP) {
        nextFeet = ground;
        verticalVelocity = 0;
        grounded = true;
      }
    } else {
      grounded = false;
    }

    position.y = nextFeet + EYE_HEIGHT;
    camera.position.copy(position);
  };

  /** Drop the walker at a position, keeping it on the ground. */
  const teleport = (x, y, z, yaw) => {
    position.set(x, y + EYE_HEIGHT, z);
    const ground = groundAt(x, z, y);
    if (ground !== null) position.y = ground + EYE_HEIGHT;
    verticalVelocity = 0;
    camera.position.copy(position);
    if (yaw !== undefined) {
      camera.rotation.set(0, yaw, 0);
    }
  };

  const dispose = () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    controls.disconnect();
  };

  return {
    controls,
    update,
    teleport,
    dispose,
    get position() {
      return position;
    },
    get isLocked() {
      return controls.isLocked;
    },
  };
}
