import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Campus layout — each zone gets its own footprint so nothing intersects:
//   Reception  z = +30      Atrium  origin      Pods  x = -26
//   Hub        z = -32      Courtyard x = +26
const tourStops = [
  {
    name: 'Reception Hall',
    description:
      'Welcome to Nexus Academy. State-of-the-art entrance with electric blue neon branding and AI assistants ready to guide your journey.',
    position: { x: 2, y: 7, z: 50 },
    target: { x: 0, y: 5, z: 30 },
    duration: 3000,
  },
  {
    name: 'Central Atrium',
    description:
      'The heart of Nexus Academy. A multi-level learning space where knowledge flows through interactive environments and AI mentors.',
    position: { x: 20, y: 14, z: 24 },
    target: { x: 0, y: 7, z: 0 },
    duration: 4000,
  },
  {
    name: 'Learning Pods',
    description:
      'Collaborative spaces where students work alongside AI robots. Designed for hands-on AI building and peer learning.',
    position: { x: -26, y: 11, z: 28 },
    target: { x: -26, y: 5, z: 2 },
    duration: 4000,
  },
  {
    name: 'Knowledge Hub',
    description:
      'Our library of AI knowledge. Curved walls lined with learning resources, quantum neural networks, and continuous discovery.',
    position: { x: 5, y: 19, z: -62 },
    target: { x: 0, y: 5, z: -32 },
    duration: 4000,
  },
  {
    name: 'Outdoor Courtyard',
    description:
      'A space for celebration and reflection. Where graduates gather and the community comes together.',
    position: { x: 34, y: 12, z: 26 },
    target: { x: 27, y: 2, z: 0 },
    duration: 4000,
  },
  {
    name: 'Nexus Academy',
    description:
      "Your journey through Nexus Academy is complete. Build. Lead. Scale. Welcome to The AI Architect's vision.",
    position: { x: 40, y: 34, z: 54 },
    target: { x: 0, y: 4, z: 2 },
    duration: 3000,
  },
];

const NEON = 0x00d4ff;
const BG = 0x0a0e27;

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

const NexusAcademyTour = () => {
  const containerRef = useRef(null);
  const [currentStop, setCurrentStop] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Refs the render loop reads, so it never sees a stale closure value.
  const stopRef = useRef(0);
  const autoPlayRef = useRef(true);
  const tweenRef = useRef(null);
  const lookAtRef = useRef(
    new THREE.Vector3(tourStops[0].target.x, tourStops[0].target.y, tourStops[0].target.z)
  );
  const dwellStartRef = useRef(null);
  const advanceRef = useRef(() => {});

  useEffect(() => {
    stopRef.current = currentStop;
  }, [currentStop]);

  useEffect(() => {
    autoPlayRef.current = isAutoPlay;
    if (isAutoPlay && dwellStartRef.current === null && tweenRef.current === null) {
      dwellStartRef.current = performance.now();
    }
  }, [isAutoPlay]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const disposables = [];
    const track = (obj) => {
      disposables.push(obj);
      return obj;
    };

    // ---- Scene ----------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    // Far plane of the fog sits well inside the floor's edge so the ground
    // fades into the sky instead of ending on a visible horizon line.
    scene.fog = new THREE.Fog(BG, 70, 200);

    const camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      600
    );
    const first = tourStops[0];
    camera.position.set(first.position.x, first.position.y, first.position.z);
    camera.lookAt(lookAtRef.current);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ---- Lighting -------------------------------------------------------
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    scene.add(new THREE.HemisphereLight(0x93c8ff, 0x0a0e27, 0.35));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(40, 55, 45);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    const shadowCam = directionalLight.shadow.camera;
    shadowCam.left = -80;
    shadowCam.right = 80;
    shadowCam.top = 80;
    shadowCam.bottom = -80;
    shadowCam.far = 200;
    shadowCam.updateProjectionMatrix();
    scene.add(directionalLight);

    // One neon accent light per zone.
    [
      [0, 9, 30, 2.0, 45], // reception
      [0, 10, 0, 2.2, 55], // atrium
      [-26, 7, 4, 1.8, 45], // pods
      [0, 7, -32, 2.0, 50], // hub
      [27, 4, 0, 1.4, 40], // courtyard
    ].forEach(([x, y, z, intensity, distance]) => {
      const light = new THREE.PointLight(NEON, intensity, distance);
      light.position.set(x, y, z);
      scene.add(light);
    });

    // ---- Materials ------------------------------------------------------
    const whiteMaterial = track(
      new THREE.MeshStandardMaterial({ color: 0xf2f4f8, metalness: 0.25, roughness: 0.45 })
    );
    const neonMaterial = track(
      new THREE.MeshStandardMaterial({
        color: NEON,
        emissive: 0x00b8e6,
        emissiveIntensity: 1.1,
        metalness: 0.7,
        roughness: 0.25,
      })
    );
    const glassMaterial = track(
      new THREE.MeshStandardMaterial({
        color: 0x9fd8ff,
        transparent: true,
        opacity: 0.22,
        metalness: 0.1,
        roughness: 0.05,
        side: THREE.DoubleSide,
      })
    );
    const glowMaterial = track(
      new THREE.MeshBasicMaterial({ color: NEON, transparent: true, opacity: 0.16 })
    );
    const neonLineMaterial = track(new THREE.LineBasicMaterial({ color: NEON }));

    const add = (geometry, material, [x, y, z], { shadow = true } = {}) => {
      const mesh = new THREE.Mesh(track(geometry), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = shadow;
      mesh.receiveShadow = shadow;
      scene.add(mesh);
      return mesh;
    };

    // ---- Ground ---------------------------------------------------------
    const floor = add(
      new THREE.PlaneGeometry(500, 500),
      track(new THREE.MeshStandardMaterial({ color: 0x141a33, metalness: 0.35, roughness: 0.7 })),
      [0, 0, 0],
      { shadow: false }
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;

    const grid = new THREE.GridHelper(400, 160, NEON, 0x16204a);
    grid.material.opacity = 0.12;
    grid.material.transparent = true;
    grid.position.y = 0.02;
    scene.add(grid);

    // ---- Reception Hall -------------------------------------------------
    add(new THREE.ConeGeometry(9, 9, 48), whiteMaterial, [0, 4.5, 30]);

    // Neon entrance arch: half-torus lintel on two pylons.
    const arch = add(
      new THREE.TorusGeometry(7, 0.28, 12, 64, Math.PI),
      neonMaterial,
      [0, 1, 38],
      { shadow: false }
    );
    arch.rotation.z = 0;
    [-7, 7].forEach((x) => {
      add(new THREE.CylinderGeometry(0.28, 0.28, 2, 12), neonMaterial, [x, 0, 38], {
        shadow: false,
      });
    });
    // Neon brand band wrapping the entrance rotunda, sized to hug the cone
    // at that height (radius tapers as 9 * (1 - y / 9)).
    add(new THREE.TorusGeometry(4.6, 0.22, 10, 64), neonMaterial, [0, 4.5, 30], {
      shadow: false,
    }).rotation.x = -Math.PI / 2;

    // ---- Central Atrium -------------------------------------------------
    const levels = [
      [7, 3],
      [9.5, 8],
      [12, 13],
    ];
    levels.forEach(([radius, y]) => {
      const plate = add(new THREE.TorusGeometry(radius, 0.9, 14, 64), whiteMaterial, [0, y, 0]);
      plate.rotation.x = -Math.PI / 2;

      // Slim struts tying each plate back to the core.
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const strut = add(
          new THREE.BoxGeometry(radius - 2.4, 0.3, 0.3),
          whiteMaterial,
          [Math.cos(angle) * (radius / 2 + 0.6), y, Math.sin(angle) * (radius / 2 + 0.6)]
        );
        strut.rotation.y = -angle;
      }
    });

    // The column is an open lattice of fins, so the neon core glows through it
    // instead of being sealed inside a solid cylinder.
    const finGeometry = track(new THREE.BoxGeometry(0.5, 18, 1.4));
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const fin = new THREE.Mesh(finGeometry, whiteMaterial);
      fin.position.set(Math.cos(angle) * 2.2, 9, Math.sin(angle) * 2.2);
      fin.rotation.y = -angle;
      fin.castShadow = true;
      scene.add(fin);
    }

    const neonCore = add(new THREE.CylinderGeometry(1.5, 1.5, 17, 40), neonMaterial, [0, 9, 0], {
      shadow: false,
    });
    const coreGlow = add(new THREE.CylinderGeometry(2.1, 2.1, 17.4, 40), glowMaterial, [0, 9, 0], {
      shadow: false,
    });
    coreGlow.material.depthWrite = false;
    // Beacon capping the core.
    add(new THREE.SphereGeometry(1.9, 32, 32), neonMaterial, [0, 18.4, 0], { shadow: false });

    // ---- Learning Pods --------------------------------------------------
    const podGeometry = track(new THREE.SphereGeometry(3.4, 32, 32));
    const podEdges = track(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(3.55, 1)));
    const podCoreGeometry = track(new THREE.SphereGeometry(1.1, 20, 20));
    const podPositions = [
      [-26, 5, 10],
      [-31, 7.5, 1],
      [-21, 3.6, -7],
    ];
    podPositions.forEach(([x, y, z]) => {
      const pod = new THREE.Mesh(podGeometry, glassMaterial);
      pod.position.set(x, y, z);
      pod.castShadow = true;
      scene.add(pod);

      const outline = new THREE.LineSegments(podEdges, neonLineMaterial);
      outline.position.set(x, y, z);
      scene.add(outline);

      // Glowing core reads through the glass against the dark sky.
      const core = new THREE.Mesh(podCoreGeometry, neonMaterial);
      core.position.set(x, y, z);
      scene.add(core);

      // Pods sit on slim plinths rather than floating.
      add(new THREE.CylinderGeometry(0.5, 0.8, y - 3.4, 16), whiteMaterial, [x, (y - 3.4) / 2, z]);
    });

    // ---- Knowledge Hub --------------------------------------------------
    // Open-topped curved shell so the neural core inside stays visible.
    // Rotated so the shell's opening faces the tour camera (which approaches
    // from -z) — otherwise the wall hides the neural core inside.
    add(
      new THREE.CylinderGeometry(11, 11, 10, 64, 1, true, Math.PI * 0.15, Math.PI * 1.7),
      whiteMaterial,
      [0, 5.5, -32]
    ).rotation.y = Math.PI;
    add(new THREE.TorusGeometry(11, 0.4, 12, 64), neonMaterial, [0, 11.2, -32], {
      shadow: false,
    }).rotation.x = -Math.PI / 2;
    add(new THREE.CylinderGeometry(12, 12.5, 1, 64), whiteMaterial, [0, 0.5, -32]);

    const brain = add(new THREE.IcosahedronGeometry(3, 3), neonMaterial, [0, 6.5, -32], {
      shadow: false,
    });
    const brainWire = new THREE.LineSegments(
      track(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(4.2, 2))),
      neonLineMaterial
    );
    brainWire.position.set(0, 6.5, -32);
    scene.add(brainWire);

    // ---- Outdoor Courtyard ---------------------------------------------
    const courtyard = add(new THREE.PlaneGeometry(22, 26), whiteMaterial, [27, 0.08, 0], {
      shadow: false,
    });
    courtyard.rotation.x = -Math.PI / 2;
    courtyard.receiveShadow = true;

    add(new THREE.CylinderGeometry(7, 7.5, 1.2, 48), whiteMaterial, [27, 0.6, 0]);
    add(new THREE.TorusGeometry(7.2, 0.18, 10, 64), neonMaterial, [27, 1.25, 0], {
      shadow: false,
    }).rotation.x = -Math.PI / 2;

    const waterMaterial = track(
      new THREE.MeshStandardMaterial({
        color: 0x0aa8d8,
        emissive: 0x0077b0,
        emissiveIntensity: 0.6,
        metalness: 0.6,
        roughness: 0.15,
      })
    );
    const waterGeometry = track(new THREE.CylinderGeometry(2.4, 2.4, 0.5, 40));
    const waters = [
      [36, 0.25, -9],
      [36, 0.25, 9],
      [18, 0.25, -9],
      [18, 0.25, 9],
    ].map(([x, y, z]) => {
      const water = new THREE.Mesh(waterGeometry, waterMaterial);
      water.position.set(x, y, z);
      scene.add(water);
      return water;
    });

    // ---- AI Robots ------------------------------------------------------
    const bodyGeometry = track(new THREE.CapsuleGeometry(0.55, 1.1, 8, 16));
    const headGeometry = track(new THREE.SphereGeometry(0.5, 20, 20));
    const robots = [
      [-4, 0, 26],
      [5, 0, 27],
      [-26, 0, 18],
      [8, 0, 12],
      [24, 0, 7],
      [0, 0, -20],
    ].map(([x, y, z], i) => {
      const group = new THREE.Group();

      const body = new THREE.Mesh(bodyGeometry, whiteMaterial);
      body.position.y = 1.1;
      body.castShadow = true;
      group.add(body);

      const head = new THREE.Mesh(headGeometry, neonMaterial);
      head.position.y = 2.25;
      group.add(head);

      group.position.set(x, y, z);
      scene.add(group);
      return { group, phase: i * 1.7, baseY: y };
    });

    // ---- Camera tour ----------------------------------------------------
    // A single loop owns the camera: it runs the active tween, then counts
    // dwell time and asks React to advance to the next stop.
    const startTween = (stopIndex) => {
      const stop = tourStops[stopIndex];
      tweenRef.current = {
        fromPos: camera.position.clone(),
        toPos: new THREE.Vector3(stop.position.x, stop.position.y, stop.position.z),
        fromLook: lookAtRef.current.clone(),
        toLook: new THREE.Vector3(stop.target.x, stop.target.y, stop.target.z),
        start: performance.now(),
        duration: 1800,
      };
      dwellStartRef.current = null;
    };
    advanceRef.current = startTween;

    let frameId = null;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const now = performance.now();

      neonCore.rotation.y += 0.005;
      brain.rotation.x += 0.003;
      brain.rotation.y += 0.005;
      brainWire.rotation.y -= 0.002;
      brain.position.y = 6.5 + Math.sin(elapsed * 1.2) * 0.3;
      waters.forEach((water, i) => {
        water.scale.setScalar(1 + Math.sin(elapsed * 1.5 + i) * 0.05);
      });
      robots.forEach(({ group, phase, baseY }) => {
        group.position.y = baseY + Math.abs(Math.sin(elapsed * 1.4 + phase)) * 0.14;
        group.rotation.y = Math.sin(elapsed * 0.5 + phase) * 0.5;
      });

      const tween = tweenRef.current;
      if (tween) {
        const t = Math.min((now - tween.start) / tween.duration, 1);
        const eased = easeInOut(t);
        camera.position.lerpVectors(tween.fromPos, tween.toPos, eased);
        lookAtRef.current.lerpVectors(tween.fromLook, tween.toLook, eased);
        if (t >= 1) {
          tweenRef.current = null;
          dwellStartRef.current = now;
        }
      } else if (autoPlayRef.current) {
        if (dwellStartRef.current === null) dwellStartRef.current = now;
        const stop = tourStops[stopRef.current];
        // Gentle drift so a held shot still feels alive.
        camera.position.x += Math.sin(elapsed * 0.35) * 0.006;
        camera.position.y += Math.cos(elapsed * 0.3) * 0.003;
        if (now - dwellStartRef.current >= stop.duration) {
          dwellStartRef.current = null;
          if (stopRef.current < tourStops.length - 1) {
            setCurrentStop(stopRef.current + 1);
          } else {
            setIsAutoPlay(false);
          }
        }
      }

      camera.lookAt(lookAtRef.current);
      renderer.render(scene, camera);
    };

    animate();

    // ---- Resize ---------------------------------------------------------
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameId !== null) cancelAnimationFrame(frameId);
      advanceRef.current = () => {};
      disposables.forEach((d) => d.dispose());
      grid.geometry.dispose();
      grid.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Kick off a camera tween whenever the stop changes (including the first).
  useEffect(() => {
    advanceRef.current(currentStop);
  }, [currentStop]);

  const handlePlayPause = useCallback(() => {
    setIsAutoPlay((playing) => {
      // Restarting from the final stop replays the tour.
      if (!playing && stopRef.current === tourStops.length - 1) setCurrentStop(0);
      return !playing;
    });
  }, []);

  const goToStop = useCallback((index) => {
    setIsAutoPlay(false);
    setCurrentStop(index);
  }, []);

  const stop = tourStops[currentStop];

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          maxWidth: '540px',
          background: 'rgba(10, 14, 39, 0.82)',
          border: '2px solid #00d4ff',
          borderRadius: '8px',
          padding: '20px',
          color: '#ffffff',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: '10px',
            letterSpacing: '2px',
            color: '#00d4ff',
            opacity: 0.7,
            marginBottom: '6px',
          }}
        >
          NEXUS ACADEMY · VIRTUAL TOUR
        </div>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#00d4ff' }}>{stop.name}</h1>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>{stop.description}</p>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <button
          onClick={handlePlayPause}
          style={{
            background: isAutoPlay ? '#00d4ff' : '#00a8cc',
            color: '#000',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '12px',
          }}
        >
          {isAutoPlay ? '⏸ PAUSE' : '▶ PLAY'}
        </button>

        {tourStops.map((s, index) => (
          <button
            key={s.name}
            onClick={() => goToStop(index)}
            title={s.name}
            style={{
              background: currentStop === index ? '#00d4ff' : '#1a1f3a',
              color: currentStop === index ? '#000' : '#00d4ff',
              border: '1px solid #00d4ff',
              padding: '8px 14px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
              transition: 'all 0.3s',
            }}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          right: '30px',
          background: 'rgba(10, 14, 39, 0.9)',
          border: '1px solid #00d4ff',
          borderRadius: '4px',
          padding: '10px 15px',
          color: '#00d4ff',
          fontSize: '12px',
          fontWeight: 'bold',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
        }}
      >
        {currentStop + 1} / {tourStops.length}
      </div>
    </div>
  );
};

export default NexusAcademyTour;
