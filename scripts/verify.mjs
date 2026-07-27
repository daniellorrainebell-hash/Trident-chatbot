/**
 * Headless smoke test for the tour.
 *
 * Boots a browser against a running dev/preview server and checks that:
 *   1. a WebGL context comes up and the scene renders,
 *   2. every numbered stop button navigates to its stop,
 *   3. autoplay walks all six stops on its own and parks on PLAY at the end,
 *   4. nothing throws.
 *
 * Writes one screenshot per stop into ./screenshots.
 *
 * Usage:  npm run dev        (in another shell)
 *         npm run verify
 *
 * Set CHROME_PATH if Playwright's bundled Chromium isn't the one you want.
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const URL = process.env.TOUR_URL ?? 'http://localhost:5173/';
const OUT = 'screenshots';
const TOTAL_STOPS = 6;

const launchOptions = {
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
};
if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch(launchOptions);
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  // Match on the location, not the message — resource-load errors read
  // "Failed to load resource: ... 404" and never name the file.
  const url = m.location()?.url ?? '';
  if (m.type() === 'error' && !url.includes('favicon')) errors.push(`console: ${m.text()} (${url})`);
});

const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  process.exitCode = 1;
};

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas', { timeout: 20000 });

// 1. WebGL context
const gl = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  return {
    ok: !!(canvas.getContext('webgl2') || canvas.getContext('webgl')),
    width: canvas.width,
    height: canvas.height,
  };
});
gl.ok && gl.width > 0
  ? console.log(`PASS  WebGL context up (${gl.width}x${gl.height})`)
  : fail(`no WebGL context (${JSON.stringify(gl)})`);

// 2. Autoplay self-advances through every stop, unassisted.
const visited = [];
const start = Date.now();
while (Date.now() - start < 45000 && visited.length < TOTAL_STOPS) {
  const name = (await page.textContent('h1')).trim();
  if (visited[visited.length - 1] !== name) visited.push(name);
  await page.waitForTimeout(250);
}
visited.length === TOTAL_STOPS
  ? console.log(`PASS  autoplay visited all ${TOTAL_STOPS} stops: ${visited.join(' → ')}`)
  : fail(`autoplay reached only ${visited.length}/${TOTAL_STOPS}: ${visited.join(' → ')}`);

// 3. Autoplay parks on PLAY once the tour ends. The loop above exits when the
// final stop *begins*, so wait out its tween plus its dwell before checking.
await page.waitForTimeout(6000);
const playLabel = (await page.textContent('button >> nth=0')).trim();
playLabel.includes('PLAY')
  ? console.log('PASS  tour ends paused, ready to replay')
  : fail(`expected PLAY at end of tour, got "${playLabel}"`);

// 4. Manual navigation, plus a screenshot of each stop.
const buttons = await page.$$('button[title]');
if (buttons.length !== TOTAL_STOPS) fail(`expected ${TOTAL_STOPS} stop buttons, got ${buttons.length}`);

for (let i = 0; i < buttons.length; i++) {
  const expected = await buttons[i].getAttribute('title');
  await buttons[i].click();
  await page.waitForTimeout(2200); // let the camera tween settle
  const actual = (await page.textContent('h1')).trim();
  if (actual !== expected) fail(`stop ${i + 1}: expected "${expected}", showing "${actual}"`);
  await page.screenshot({ path: `${OUT}/stop-${i + 1}-${expected.toLowerCase().replace(/\s+/g, '-')}.png` });
}
console.log(`PASS  all ${TOTAL_STOPS} stops navigable; screenshots in ./${OUT}`);

errors.length
  ? fail(`page reported errors:\n  ${errors.join('\n  ')}`)
  : console.log('PASS  no page errors');

await browser.close();
