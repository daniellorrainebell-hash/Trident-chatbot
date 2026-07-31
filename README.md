# NEXUS IQ SYSTEMS — BRAND CINEMATIC

A 9:16, phone-first, real-time 3D brand cinematic for **Nexus IQ Systems**.

The core is a stack of five glass circuit wafers around a machined die, held
square to the lens and four-fold symmetric. Each layer is one service system,
so a service coming online *is* a layer of the object lighting up rather than
a separate thing orbiting it — five layers, one machine. Charge runs through
the copper and up the via columns throughout. A real enquiry then routes
across the board and drops through the stack to the die, and it lands on a
brand payoff frame built to be screen-recorded.

---

## Contact details

Taken from the business card and live in `src/config/brand.ts` → `COPY.end`:

```ts
end: {
  person:  'Daniel Bell',
  role:    'Founder, Nexus IQ Systems',
  mobile:  '07858 188645',
  office:  '0800 193 5055',
  website: 'nexus-iq.co.uk',                 // what's displayed
  websiteUrl: 'https://www.nexus-iq.co.uk',  // where it links
}
```

Numbers are spaced for legibility — the end frame gets read off a moving
story, not studied. The `tel:` links strip the spaces, so dialling is
unaffected. The website shows without `www.` but links to the `www` host,
which is the one guaranteed to resolve.

Any field left empty is **skipped** rather than rendered as a placeholder, so
the frame stays composed whatever it's given.

---

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build to dist/
npm run preview  # serve the production build
```

`npm run dev` binds to your network, so you can open it on your phone at
`http://<your-machine-ip>:5173` — which is how you should be reviewing it.

---

## The two modes

**Cinematic** — the primary deliverable. One button starts it.

- **60s film** — the full sequence.
- **22s story** — the same components on a compressed timeline, for Stories.

It ends on the payoff frame and **holds indefinitely**. There's no auto-loop
to fight; stop your recording whenever you like.

**Interactive** — everything already online. Drag to orbit, tap a layer for
a one-line summary, run the workflow on demand, replay the film.

**Recording mode** — the `Record` control hides every piece of chrome. Press
and hold anywhere to bring it back (a tap won't, on purpose).

### Recording on a phone

1. Open on the phone, portrait, in full screen.
2. Start the screen recording.
3. Press **Initialise Nexus Intelligence**.
4. Stop recording once the end frame has held as long as you want.

---

## Editing it

Everything you're likely to change lives in `src/config/` — no 3D code involved.

| To change | Edit |
|---|---|
| Any on-screen wording | `config/brand.ts` → `COPY` |
| Service names / summaries / accents | `config/brand.ts` → `SERVICES` |
| Contact details | `config/brand.ts` → `COPY.end` |
| Which logo file is used | `config/brand.ts` → `LOGO_SRC` |
| Pacing of any beat | `config/timeline.ts` |
| Device quality tiers | `config/quality.ts` |

**Pacing** is defined as `{ at, dur }` in seconds. `FULL` and `SHORT` are two
values of the same shape, so retiming the film never means touching a
component. To hold the core reveal longer, raise `coreCaption.dur` and push
`systemsReveal.at` back by the same amount.

**Swapping the logo**: drop a transparent PNG into `public/brand/` and point
`LOGO_SRC` at it. Alpha is required — the mark sits on near-black. The
alternate neon lockup is already there as `nexus-iq-logo-neon.png`.

**Adding or removing a service**: edit the `SERVICES` array. The number of
wafers, the layer spacing, the captions and the workflow path all derive from
it, so a sixth service adds a sixth layer automatically. Each service's
`accent` sets the colour of its layer's circuitry — keep them inside the
blue range or the palette breaks.

**Changing the circuitry**: `scene/core/traceTexture.ts` generates each layer's
copper procedurally. `nets` controls density and `grid` controls how fine the
routing is (both set per layer in `Wafer.tsx`). The routing is deliberately
Manhattan/45° — that constraint is why it reads as engineered rather than
decorative, so keep it if you change anything else.

---

## How it's built

React 18 · TypeScript · Three.js · React Three Fiber · Drei · GSAP · Zustand,
bundled with Vite. No external art assets beyond the logo — the studio
lighting, materials, particles and geometry are all procedural.

Three ideas carry the whole thing:

**One clock.** The entire cinematic is a single GSAP timeline over one mutable
object (`sequence/stageState.ts`). Components read it inside `useFrame`, so
animating thirty values at 60fps never touches React. It also means the film
can be scrubbed, paused or rebuilt at a different tempo for free — the 22s cut
is a config, not a second implementation.

**Content is data.** All copy, services and timings are config. Nothing
user-facing is hard-coded in a component.

**Quality tiers from the start.** Device capability is detected at boot and
measured at runtime; a device that can't hold its tier is demoted quietly and
early. Tiers vary MSAA, resolution scale, particle budget and post effects.

**Restraint is enforced, not aspirational.** There is one object and nothing
else — no orbiting elements, no connecting lines, no suspended geometry. Five
layers of visible circuitry is already a lot of detail, and detail only reads
as expensive when there is empty space around it.

**The object holds still; the light and the lens move.** Azimuth stays at
zero for the whole film because any rotation away from it breaks the
four-fold symmetry the board is built around. The motion budget goes to
charge running through the copper, the activation wavefronts, and the
camera's climb and descent instead.

```
src/
├─ config/      brand.ts · timeline.ts · quality.ts
├─ state/       useExperience.ts
├─ sequence/    stageState.ts · director.ts
├─ scene/
│  ├─ Stage · Studio · CameraRig · PostFX · layout
│  ├─ core/     CoreStack · Wafer · Die · ViaBeams · traceTexture
│  ├─ flow/     Packet
│  └─ fx/       Motes
└─ ui/          Preloader · StartScreen · CinematicLogo · Caption ·
                EndFrame · Controls · ServiceSheet · useStageGestures
```

### URL flags

- `?tier=A|B|C` — pin the quality tier and disable auto-demotion.
- `?qa=1` — exposes `window.__nexusQA` (`start`, `seek`, `state`) for
  deterministic frame capture. Not present without the flag.

---

## Deploying

Static build, no server. `npm run build`, then upload `dist/` to Netlify,
Vercel, Cloudflare Pages, S3 or any static host. `base` is relative, so it
works from a subdirectory without rewrite rules.

For website embedding later, an `<iframe>` with a 9:16 aspect ratio is the
cleanest route — the stage already letterboxes itself on any viewport.

---

## QA

`qa/` holds Playwright scripts that drive the real build and capture frames —
how the sequence was reviewed beat by beat rather than by eye.

```bash
npm run preview
node qa/capture-cinematic.mjs http://127.0.0.1:4173/ A   # timeline beats
node qa/capture-modes.mjs     http://127.0.0.1:4173/ B   # short cut, interactive, recording
node qa/capture-desktop.mjs   http://127.0.0.1:4173/     # desktop + tall viewport framing
```

Set `SHOT_DIR` to choose an output directory, and `CHROME_PATH` if you want a
specific Chromium binary.

---

## Known limits

- **Sound** is not implemented. The piece is silent by design — screen
  recordings usually get music in post. No audio hooks are wired up yet.
- **Reduced motion** is honoured (camera handheld off, UI transitions
  shortened) but the cinematic still plays; it isn't reduced to a static frame.
- **Tier detection** is best-effort. GPU strings are unreliable, which is why
  the runtime FPS probe exists as the real safety net.
- **Lighting is tuned for flat plates.** The key light is broad and dim on
  purpose: a plate mirrors its light source, so a compact key returns a blown
  white rectangle on the glass. If you ever swap the core for a curved form,
  that trade reverses.
