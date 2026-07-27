import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createEngine } from './engine.js';
import { createMaterials, disposeMaterials } from './world/materials.js';
import { buildCampus, TERRACE_Y } from './world/campus.js';
import { buildInterior } from './world/interior.js';
import { populateCampus } from './world/people.js';
import { createWalker } from './walker.js';
import { createTour, TOUR_STOPS } from './tour.js';

const NEON = '#7fd8ff';
const PANEL_BG = 'rgba(8, 20, 34, 0.78)';

// Debug: ?cam=x,y,z&look=x,y,z frames a still without entering either mode.
const vectorParam = (name) => {
  const raw = new URLSearchParams(window.location.search).get(name);
  if (!raw) return null;
  const parts = raw.split(',').map(Number);
  return parts.length === 3 && parts.every(Number.isFinite) ? new THREE.Vector3(...parts) : null;
};

const NexusAcademy = () => {
  const containerRef = useRef(null);
  const worldRef = useRef(null);

  const [mode, setMode] = useState('tour'); // 'tour' | 'walk'
  const [stop, setStop] = useState(0);
  // 'pointer' once the cursor is captured, 'drag' when lock is unavailable
  // (sandboxed frames refuse it) and looking falls back to click-and-drag.
  const [lookMode, setLookMode] = useState('drag');
  const [ready, setReady] = useState(false);

  // The render loop reads the mode every frame, so mirror it into a ref.
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = createEngine(container);
    const materials = createMaterials(engine.environment);
    const campus = buildCampus(engine.scene, materials);
    const interior = buildInterior(engine.scene, materials);
    const people = populateCampus(engine.scene, materials);

    const walkables = [...campus.walkables, ...interior.walkables];
    const colliders = [...campus.colliders, ...interior.colliders];

    const walker = createWalker(engine.camera, engine.renderer.domElement, {
      walkables,
      colliders,
      start: [0, 0, 92],
      onLookMode: setLookMode,
    });
    const tour = createTour(engine.camera);

    // A framing override is for stills only — it suppresses both camera modes.
    const still = vectorParam('cam');
    if (still) {
      engine.camera.position.copy(still);
      engine.camera.lookAt(vectorParam('look') ?? new THREE.Vector3(0, 13, 0));
    }

    worldRef.current = { engine, walker, tour };
    // Debug handle: used by scripts/verify.mjs to assert on movement, and handy
    // for picking geometry from the console when tracking down placement bugs.
    window.__nexus = { scene: engine.scene, camera: engine.camera, position: null };
    setReady(true);

    const clock = new THREE.Clock();
    let frameId = null;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      campus.update(elapsed);
      interior.update(elapsed);
      people.update(elapsed);

      if (!still) {
        if (modeRef.current === 'walk') {
          walker.update(delta);
          window.__nexus.position = walker.position.toArray();
          window.__nexus.pointerLocked = walker.isPointerLocked;
        } else {
          const next = tour.update(performance.now());
          if (next !== null) {
            tour.goTo(next);
            setStop(next);
          }
        }
      }

      engine.composer.render();
    };
    animate();

    const onResize = () => engine.setSize(container.clientWidth, container.clientHeight);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (frameId) cancelAnimationFrame(frameId);
      walker.dispose();
      people.dispose();
      interior.dispose();
      campus.dispose();
      disposeMaterials(materials);
      engine.dispose();
      delete window.__nexus;
      worldRef.current = null;
    };
  }, []);

  const enterWalk = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    // Carry the tour's framing into free-roam so the handover isn't a jump cut.
    const { position, yaw } = world.tour.currentFraming();
    const standing = Math.max(position.y, TERRACE_Y + 0.2);
    world.walker.teleport(position.x, standing - 1.68, position.z, yaw);
    setMode('walk');
    world.walker.requestLook();
  }, []);

  const enterTour = useCallback((index = 0) => {
    const world = worldRef.current;
    if (!world) return;
    world.walker.releaseLook();
    world.tour.goTo(index, { instant: true });
    setStop(index);
    setMode('tour');
  }, []);

  const jumpTo = useCallback(
    (index) => {
      const world = worldRef.current;
      if (!world) return;
      if (modeRef.current === 'walk') {
        enterTour(index);
        return;
      }
      world.tour.goTo(index);
      setStop(index);
    },
    [enterTour]
  );

  const current = TOUR_STOPS[stop];
  const chrome = {
    position: 'absolute',
    background: PANEL_BG,
    border: '1px solid rgba(127, 216, 255, 0.45)',
    borderRadius: '10px',
    color: '#eaf6ff',
    backdropFilter: 'blur(12px)',
    zIndex: 10,
  };

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {mode === 'tour' ? (
        <div
          style={{ ...chrome, top: '22px', left: '22px', maxWidth: '430px', padding: '18px 20px' }}
        >
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '2.5px',
              color: NEON,
              opacity: 0.75,
              marginBottom: '7px',
            }}
          >
            NEXUS ACADEMY · GUIDED TOUR · {stop + 1} / {TOUR_STOPS.length}
          </div>
          <h1 style={{ margin: '0 0 7px', fontSize: '25px', fontWeight: 500, color: NEON }}>
            {current.name}
          </h1>
          <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.62, opacity: 0.9 }}>
            {current.description}
          </p>
        </div>
      ) : (
        <div
          style={{ ...chrome, top: '22px', left: '22px', padding: '14px 18px', maxWidth: '330px' }}
        >
          <div style={{ fontSize: '10px', letterSpacing: '2.5px', color: NEON, opacity: 0.75 }}>
            NEXUS ACADEMY · FREE ROAM
          </div>
          <div style={{ marginTop: '9px', fontSize: '12.5px', lineHeight: 1.7, opacity: 0.9 }}>
            <b>W A S D</b> move · <b>Shift</b> sprint · <b>Space</b> jump
            <br />
            {lookMode === 'pointer' ? (
              <>
                <b>Mouse</b> look · <b>Esc</b> releases the cursor
              </>
            ) : (
              <>
                <b>Drag</b> to look around
              </>
            )}
          </div>
        </div>
      )}

      {mode === 'walk' && lookMode !== 'pointer' && (
        <button
          onClick={() => worldRef.current?.walker.requestLook()}
          style={{
            ...chrome,
            bottom: '86px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '9px 16px',
            fontSize: '11px',
            letterSpacing: '0.6px',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          Drag to look — or click here to capture the cursor
        </button>
      )}

      {mode === 'walk' && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '5px',
            height: '5px',
            marginLeft: '-2.5px',
            marginTop: '-2.5px',
            borderRadius: '50%',
            background: 'rgba(234, 246, 255, 0.75)',
            boxShadow: '0 0 6px rgba(127,216,255,0.9)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          bottom: '26px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '9px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <button
          onClick={mode === 'tour' ? enterWalk : () => enterTour(stop)}
          disabled={!ready}
          style={{
            background: mode === 'tour' ? NEON : 'rgba(8, 20, 34, 0.78)',
            color: mode === 'tour' ? '#04121e' : NEON,
            border: `1px solid ${NEON}`,
            borderRadius: '6px',
            padding: '11px 20px',
            fontSize: '11.5px',
            fontWeight: 700,
            letterSpacing: '1.2px',
            cursor: ready ? 'pointer' : 'default',
            backdropFilter: 'blur(12px)',
            font: 'inherit',
          }}
        >
          {mode === 'tour' ? '◆ WALK THE CAMPUS' : '◀ BACK TO TOUR'}
        </button>

        {TOUR_STOPS.map((item, index) => (
          <button
            key={item.name}
            onClick={() => jumpTo(index)}
            title={item.name}
            style={{
              background: mode === 'tour' && stop === index ? NEON : 'rgba(8, 20, 34, 0.7)',
              color: mode === 'tour' && stop === index ? '#04121e' : NEON,
              border: '1px solid rgba(127, 216, 255, 0.55)',
              borderRadius: '6px',
              padding: '10px 14px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              font: 'inherit',
            }}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NexusAcademy;
