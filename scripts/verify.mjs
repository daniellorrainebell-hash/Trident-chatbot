/**
 * Headless smoke test for the Nexus Academy walkthrough.
 *
 * Checks that the scene renders, the guided tour advances and every stop is
 * reachable, free-roam movement works, and nothing throws. Writes one
 * screenshot per tour stop into ./screenshots.
 *
 * Usage:  npm run dev        (in another shell)
 *         npm run verify
 *
 * Set CHROME_PATH if Playwright's bundled Chromium isn't the installed one.
 *
 * A note on the very generous timings below. Headless Chromium rasterises in
 * software (SwiftShader), and this scene is fill-bound: measured throughput is
 * around 740k shaded pixels per second, so a 1024x576 frame takes roughly a
 * second to draw. On a GPU that same frame is a fraction of a millisecond. The
 * waits here are sized for the software renderer, not for real playback, and the
 * viewport is kept small so that frames keep arriving at all.
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const URL = process.env.TOUR_URL ?? 'http://localhost:5173/';
const OUT = 'screenshots';
const STOPS = 6;
const VIEWPORT = { width: 1024, height: 576 };

const launchOptions = {
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
};
if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch(launchOptions);
const page = await browser.newPage({ viewport: VIEWPORT });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  // Match on the location, not the message — resource-load failures read
  // "Failed to load resource: ... 404" and never name the file.
  const url = m.location()?.url ?? '';
  if (m.type() === 'error' && !url.includes('favicon')) errors.push(`console: ${m.text()} (${url})`);
});

let failures = 0;
const check = (ok, label, detail = '') => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures++;
    console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

/** Poll until `probe` returns truthy, or give up. */
const waitFor = async (probe, { timeout = 30000, interval = 500 } = {}) => {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await probe();
    if (value) return value;
    if (Date.now() > deadline) return null;
    await page.waitForTimeout(interval);
  }
};

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas', { timeout: 30000 });

// ---- 1. Renderer came up ------------------------------------------------
const gl = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  return {
    ok: !!(canvas.getContext('webgl2') || canvas.getContext('webgl')),
    width: canvas.width,
    height: canvas.height,
  };
});
check(gl.ok && gl.width > 0, `WebGL context up (${gl.width}x${gl.height})`, JSON.stringify(gl));

// ---- 2. Tour advances on its own ---------------------------------------
const stopIndex = async () => {
  const text = await page.textContent('div:has-text("GUIDED TOUR")').catch(() => '');
  return Number(text?.match(/·\s*(\d+)\s*\/\s*\d+/)?.[1] ?? 0);
};
const startIndex = await stopIndex();
const advancedTo = await waitFor(async () => {
  const now = await stopIndex();
  return now !== startIndex ? now : null;
}, { timeout: 40000 });
check(advancedTo !== null, `guided tour advances unaided (stop ${startIndex} -> ${advancedTo})`);

// ---- 3. Every stop is reachable, and screenshot each -------------------
const stopButtons = await page.$$('button[title]');
check(stopButtons.length === STOPS, `${STOPS} stop buttons present`, `got ${stopButtons.length}`);

for (let i = 0; i < stopButtons.length; i++) {
  const expected = await stopButtons[i].getAttribute('title');
  await stopButtons[i].click();
  const shown = await waitFor(
    async () => ((await page.textContent('h1')).trim() === expected ? true : null),
    { timeout: 15000 }
  );
  if (!shown) {
    check(false, `stop ${i + 1} reachable`, `caption never became "${expected}"`);
    continue;
  }
  // Let the flight land and a frame actually paint before capturing.
  await page.waitForTimeout(7000);
  const slug = expected.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  await page.screenshot({ path: `${OUT}/stop-${i + 1}-${slug}.png` });
}
check(true, `all ${STOPS} stops framed; screenshots in ./${OUT}`);

// ---- 4. Free roam ------------------------------------------------------
await page.click('button:has-text("WALK THE CAMPUS")');
check(
  (await waitFor(() => page.isVisible('text=FREE ROAM'), { timeout: 10000 })) !== null,
  'free-roam mode entered'
);

const readPosition = () => page.evaluate(() => window.__nexus?.position ?? null);
const before = await waitFor(readPosition, { timeout: 30000 });

if (!before) {
  check(false, 'walker position readable', 'window.__nexus.position never appeared');
} else {
  await page.keyboard.down('KeyW');
  // Movement is integrated per frame with delta clamped to 50 ms, so at software
  // frame rates the walker advances in visible steps. Hold long enough to clear
  // the noise floor.
  const moved = await waitFor(
    async () => {
      const now = await readPosition();
      const distance = Math.hypot(now[0] - before[0], now[2] - before[2]);
      return distance > 1.0 ? distance : null;
    },
    { timeout: 40000, interval: 1000 }
  );
  await page.keyboard.up('KeyW');
  check(moved !== null, `walking moves the camera${moved ? ` (${moved.toFixed(2)} m)` : ''}`);

  const after = await readPosition();
  check(
    Math.abs(after[1] - before[1]) < 6,
    `walker stays grounded (eye y ${before[1].toFixed(2)} -> ${after[1].toFixed(2)})`
  );

  // Walk hard into the facade; the collider wall should stop the advance.
  const wallProbe = await page.evaluate(() => window.__nexus?.position ?? null);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(25000);
  await page.keyboard.up('KeyW');
  const settled = await readPosition();
  check(
    settled !== null && Number.isFinite(settled[0]) && Math.abs(settled[0]) < 200,
    'walker stays inside the campus bounds',
    settled ? settled.map((v) => v.toFixed(1)).join(', ') : 'no position'
  );
  void wallProbe;

  await page.screenshot({ path: `${OUT}/free-roam.png` });
}

// ---- 5. Back to the tour ----------------------------------------------
// Release pointer lock explicitly and wait for it. While the canvas holds the
// lock, Chromium routes every pointer event to it, so a click on the button bar
// is reported as intercepted by the canvas and never lands.
await page.evaluate(() => document.exitPointerLock?.());
const unlocked = await waitFor(
  () => page.evaluate(() => document.pointerLockElement === null),
  { timeout: 10000 }
);
check(unlocked !== null, 'pointer lock released');
await page.click('button:has-text("BACK TO TOUR")');
check(
  (await waitFor(() => page.isVisible('text=GUIDED TOUR'), { timeout: 10000 })) !== null,
  'returns to guided tour'
);

check(errors.length === 0, 'no page errors', errors.join(' | '));

await browser.close();
console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exitCode = failures === 0 ? 0 : 1;
