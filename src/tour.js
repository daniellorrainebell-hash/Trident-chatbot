import * as THREE from 'three';

/**
 * Guided tour: a cinematic camera that flies between stops, with a slow push
 * on each shot so held frames stay alive.
 *
 * Each stop is a camera position and a look-at target in world space. The
 * `dolly` vector is added to the position over the stop's hold, giving the shot
 * a drift rather than a freeze.
 */
export const TOUR_STOPS = [
  {
    name: 'Arrival Plaza',
    description:
      'The approach to Nexus Academy. Two wings sweep forward to embrace the arrival plaza, framed by reflecting pools and fountains.',
    position: [0, 5.6, 96],
    target: [0, 14, 4],
    dolly: [0, 0.6, -14],
    hold: 7000,
  },
  {
    name: 'Grand Entrance',
    description:
      'The ceremonial stair rises to the terrace beneath the academy wordmark. Cove lighting traces every floor plate across the facade.',
    position: [-3, 3.4, 40],
    target: [0, 15, 0],
    dolly: [3, 2.2, -14],
    hold: 6500,
  },
  {
    name: 'Reception Atrium',
    description:
      'Inside the entrance hall. Four storeys of curved galleries rise to a skylight, with AI assistants stationed at the reception counter.',
    position: [0, 5.4, -2],
    target: [0, 9.5, -30],
    dolly: [0, 1.2, -11],
    hold: 7000,
  },
  {
    name: 'The Neural Core',
    description:
      'A live projection of the academy’s learning model, suspended in the atrium void above its emitter plate.',
    position: [7.5, 8.2, -6],
    target: [0, 11.4, -17],
    dolly: [-9, 0.8, -3],
    hold: 6500,
  },
  {
    name: 'Upper Galleries',
    description:
      'The mezzanine levels, where studios open onto the atrium behind glass balustrades and planting spills over the edge.',
    position: [-9.5, 12.2, -6],
    target: [4, 13, -26],
    dolly: [3, 3.4, -8],
    hold: 6500,
  },
  {
    name: 'Nexus Academy',
    description:
      'Build. Lead. Scale. The full campus from the air — the wings, the plaza, and the courtyard beyond.',
    position: [54, 44, 104],
    target: [0, 10, 12],
    dolly: [-30, -6, -26],
    hold: 8000,
  },
];

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function createTour(camera) {
  const lookAt = new THREE.Vector3(...TOUR_STOPS[0].target);
  const position = new THREE.Vector3(...TOUR_STOPS[0].position);

  let index = 0;
  let flight = null; // active transition
  let holdStart = null;

  const stopVectors = (stop) => ({
    from: new THREE.Vector3(...stop.position),
    to: new THREE.Vector3(...stop.position).add(new THREE.Vector3(...stop.dolly)),
    target: new THREE.Vector3(...stop.target),
  });

  const goTo = (next, { instant = false } = {}) => {
    index = ((next % TOUR_STOPS.length) + TOUR_STOPS.length) % TOUR_STOPS.length;
    const { from, target } = stopVectors(TOUR_STOPS[index]);
    if (instant) {
      position.copy(from);
      lookAt.copy(target);
      flight = null;
      holdStart = performance.now();
      return index;
    }
    flight = {
      fromPos: position.clone(),
      toPos: from,
      fromLook: lookAt.clone(),
      toLook: target,
      start: performance.now(),
      duration: 2200,
    };
    holdStart = null;
    return index;
  };

  /**
   * @returns {number|null} the stop index to advance to, or null. The caller
   * owns the stop state so the UI stays in sync.
   */
  const update = (now) => {
    const stop = TOUR_STOPS[index];

    if (flight) {
      const t = Math.min((now - flight.start) / flight.duration, 1);
      const eased = easeInOut(t);
      position.lerpVectors(flight.fromPos, flight.toPos, eased);
      lookAt.lerpVectors(flight.fromLook, flight.toLook, eased);
      if (t >= 1) {
        flight = null;
        holdStart = now;
      }
    } else {
      if (holdStart === null) holdStart = now;
      const t = Math.min((now - holdStart) / stop.hold, 1);
      const { from, to, target } = stopVectors(stop);
      position.lerpVectors(from, to, easeInOut(t));
      lookAt.copy(target);
      if (t >= 1) return (index + 1) % TOUR_STOPS.length;
    }

    camera.position.copy(position);
    camera.lookAt(lookAt);
    return null;
  };

  /** Hand the current framing over to free-roam so the switch isn't a jump cut. */
  const currentFraming = () => ({
    position: position.clone(),
    yaw: Math.atan2(position.x - lookAt.x, position.z - lookAt.z),
  });

  return { update, goTo, currentFraming, get index() { return index; } };
}
