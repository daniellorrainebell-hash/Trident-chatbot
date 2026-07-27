# Trident-chatbot

## Nexus Academy — 3D campus walkthrough

A real-time Three.js environment of the Nexus Academy campus, built to match the
reference renders: white parametric architecture, blue solar glazing, cove
lighting, a marble arrival plaza with reflecting pools and fountains, and a
four-storey top-lit entrance atrium.

Two ways to see it:

- **Guided tour** — a cinematic camera flies between six stops and drifts on
  each shot. Runs on load; the numbered buttons jump to any stop.
- **Free roam** — first-person WASD + mouselook, with gravity, wall collision
  and stair climbing. Walk from the plaza, up the ceremonial stair, through the
  doors and around the atrium galleries.

### Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production bundle into dist/
npm run preview  # serve the built bundle
```

### Controls

| | |
|---|---|
| `W` `A` `S` `D` | move |
| Mouse | look |
| `Shift` | sprint |
| `Space` | jump |
| `Esc` | release the cursor |

Looking works two ways. Where the browser grants pointer lock you get the usual
captured-cursor mouselook; where it doesn't — a sandboxed iframe refuses the
request outright — the view falls back to click-and-drag, and the on-screen hint
changes to match. Touch drag works too. A lock-only implementation looks fine in
a tab and does nothing at all when embedded, which is why both paths exist.

### Publishing it as a single page

```bash
npm run bundle   # builds, then folds everything into artifact/nexus-academy.html
```

That produces one self-contained HTML fragment (~770 kB) with the JavaScript
inlined, for hosts that apply a strict CSP and block every external request. It
is a fragment rather than a document — no doctype or `<html>`/`<head>`/`<body>`
— because the host supplies the surrounding skeleton.

### Verifying it

`scripts/verify.mjs` drives a headless browser against a running server and
checks that WebGL comes up, the tour advances unaided, all six stops are
reachable, free-roam movement works and stays grounded, and nothing throws. It
writes one screenshot per stop into `screenshots/`.

```bash
npm run dev      # in one shell
npm run verify   # in another
```

`TOUR_URL` points it elsewhere; `CHROME_PATH` selects a specific browser binary.

Its timeouts look extravagant, and deliberately so: headless Chromium
rasterises in software, and this scene is fill-bound — measured throughput is
roughly 740k shaded pixels per second, so one 1024×576 frame takes about a
second. Frame time scales with pixel count, which is the signature of fill cost
rather than scene complexity; on a GPU the same frame is a fraction of a
millisecond.

### How it's built

Everything is generated in code and self-contained — no downloaded models,
textures, HDRIs or fonts, and no CDN at runtime.

| | |
|---|---|
| `src/engine.js` | renderer, atmospheric-scattering sky, sun, environment map, bloom / SMAA / tone-map chain |
| `src/world/lib.js` | geometry toolkit: sweeps a cross-section along a plan curve |
| `src/world/signage.js` | all branding and surface detail, drawn on 2D canvases |
| `src/world/materials.js` | the physically-based material library |
| `src/world/campus.js` | exterior: podium, facades, roofline, stair, plaza, water, planting |
| `src/world/interior.js` | entrance atrium: galleries, reception, skylight, neural core |
| `src/world/people.js` | students, staff and AI assistants, with walk and idle cycles |
| `src/walker.js` | first-person controls, collision and ground-following |
| `src/tour.js` | the six guided-tour stops |

The architecture is parametric rather than assembled from primitives. Floor
slabs, glazing, cove lighting, balustrades and the roofline all sweep a profile
along shared plan curves (`sweepProfile`), which is what produces the curved
facades. `ExtrudeGeometry`'s `extrudePath` is deliberately avoided: it builds
Frenet frames, which roll the profile along the path and twist a horizontal
ribbon into a corkscrew. The sweeps here pin "up" to +Y instead.

The NEXUS ACADEMY mark and wordmark are drawn to canvas at load and used as
paired colour and emissive maps, so the lettering glows through the bloom pass
while the panel behind it stays a matte white surface.

### What this does and doesn't reach

The architecture, daylight, materials, water, planting and branding are the
parts that procedural generation does well, and they carry the look.

The **people are the honest limit**. They are low-poly procedural figures with a
walk cycle, built to read at plaza and atrium distance — silhouette, uniform
colours, the white-and-charcoal robot chassis. They will not stand up to close
inspection, and they are not the photoreal humans in the reference images.
Getting there needs authored, rigged and textured character assets; there is no
procedural route to it. If you want that, the path is to drop glTF characters
into `src/world/people.js` in place of `buildFigure`.

### Notes for anyone changing the lighting

The scene is HDR end to end, and two things about it are easy to get wrong.

**The sky's linear radiance is about 6, not 1.** Exposure therefore sits at
0.18; at a nominal 0.5 the ACES curve pushes the whole frame into desaturated
white. Anything unlit that should read as white in daylight has to be scaled to
match — the clouds, the holographic elements and the interior signage all carry
colour values well above 1. Note that `toneMapped: false` does *not* help here:
it only suppresses in-shader tone mapping, which the composer already bypasses,
so the output pass tone maps those materials regardless.

**Bloom thresholds are in linear radiance too.** With the sky at ~6, a threshold
below that blooms the entire frame into haze. It is set to 14, and the cove
lighting is emissive enough to clear it.

Two related rules of thumb. Direct sun is kept several times stronger than
`envMapIntensity` — otherwise ambient swamps it and the massing goes flat with no
readable shadows. And interior point lights are specified in candela falling off
as 1/d², so their intensity is derived from the mount height
(`intensity = target × distance²`) rather than picked by eye; a fixture a few
metres off the floor needs a tiny value, and a plausible-looking large one blows
the room out.
