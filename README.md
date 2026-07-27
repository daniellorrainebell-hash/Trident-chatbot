# Trident-chatbot

## Nexus Academy — Virtual Tour

A Three.js walkthrough of the Nexus Academy campus, presented as a six-stop
guided camera tour. Autoplay flies between stops; the numbered buttons jump to
any stop directly.

### Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production bundle into dist/
npm run preview  # serve the built bundle
```

### Verifying it

`scripts/verify.mjs` drives a headless browser against a running server and
checks that WebGL comes up, autoplay walks all six stops on its own, the tour
parks on PLAY when it finishes, every stop button navigates correctly, and
nothing throws. It also drops one screenshot per stop into `screenshots/`.

```bash
npm run dev      # in one shell
npm run verify   # in another
```

Point it elsewhere with `TOUR_URL`, or at a specific browser binary with
`CHROME_PATH` (needed where Playwright's bundled Chromium isn't the installed
one).

### Tour stops

| # | Stop | Zone |
|---|------|------|
| 1 | Reception Hall | `z = +30` — cone rotunda, neon arch and brand band |
| 2 | Central Atrium | origin — three curved floor plates around a glowing core |
| 3 | Learning Pods | `x = -26` — glass pods on plinths with neon wireframes |
| 4 | Knowledge Hub | `z = -32` — open curved shell around a neural core |
| 5 | Outdoor Courtyard | `x = +26` — celebration platform and water features |
| 6 | Nexus Academy | high oblique establishing shot of the whole campus |

### Notes on the source component

The tour arrived as a single `.jsx` file. Getting it to render required fixing a
number of things, all in `src/NexusAcademyTour.jsx`:

- **Import.** Three was imported from a `cdn.jsdelivr.net` URL pinned to
  `three@r128`, which isn't a valid npm version specifier and doesn't resolve to
  a module build. Now a normal `three` package import.
- **`THREE.PCFShadowShadowMap`** doesn't exist — the shadow map type was being
  set to `undefined`. Corrected to `THREE.PCFSoftShadowMap`.
- **Stale closures.** The setup effect had a `[]` dependency list but read
  `currentStop` and `isAutoPlay` from its render scope, so the animation loop saw
  those values frozen at their mount-time defaults forever: autoplay couldn't be
  paused and never advanced past the second stop. The loop now reads mutable refs
  that React state mirrors into.
- **Two loops fighting over the camera.** The setup effect lerped the camera every
  frame while a second effect ran its own transition tween against the same
  camera. Both also stored their `requestAnimationFrame` handle in the same ref,
  so cleanup cancelled whichever had written last and leaked the other. There is
  now one loop that owns the camera, and one RAF handle.
- **Camera parked inside geometry.** The camera was never given an initial
  position, so it started at the world origin inside the central column. Stop 4
  also placed it at `(0, 4, -15)` — dead centre of the solid Knowledge Hub box,
  i.e. a black screen.
- **Vertical floor plates.** The atrium's `TorusGeometry` rings were never
  rotated, leaving them as upright hoops rather than the stacked horizontal
  levels the tour narration describes.
- **Invisible neon core.** A neon cylinder of radius 1.2 sat inside an opaque
  white column of radius 2, so the atrium's centrepiece could never be seen. The
  column is now an open lattice of fins that the core glows through.
- **Overlapping zones.** Every structure was packed into a 50×50 footprint, so
  the entrance cone intersected the atrium rings and the learning pods
  intersected the courtyard. Zones now sit on their own footprints (see the table
  above), with the stop cameras reframed to match.
- **Cleanup.** Geometries and materials are disposed, the renderer is disposed,
  and the canvas is removed via a captured container reference rather than a
  possibly-stale `containerRef.current`.
