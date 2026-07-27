/**
 * Check the single-file bundle the way a host actually serves it: inside a
 * sandboxed iframe, from the filesystem, with no pointer-lock permission.
 *
 * This is the case `npm run verify` cannot cover. That suite drives the dev
 * server in a top-level page, where pointer lock is granted; embedded, the
 * browser refuses it outright, and a lock-only implementation would silently
 * fail to look anywhere. Here we assert that drag-to-look picks up instead.
 *
 * Usage:  npm run bundle && npm run verify:artifact
 */
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const target = `${process.cwd()}/artifact/nexus-academy.html`;
const HOST = '/tmp/nexus-artifact-host.html';

writeFileSync(
  HOST,
  `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;height:100%}iframe{border:0;width:100vw;height:100vh}</style>
<iframe src="file://${target}" sandbox="allow-scripts allow-same-origin"></iframe>`
);

const launchOptions = {
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--allow-file-access-from-files',
  ],
};
if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;

const browser = await chromium.launch(launchOptions);
const page = await browser.newPage({ viewport: { width: 1024, height: 576 } });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  // The browser logs its own notice when it blocks pointer lock in a sandboxed
  // frame. That is the condition under test, not a fault.
  const text = m.text();
  if (m.type() === 'error' && !text.includes('pointer lock')) errors.push(`console: ${text}`);
});

let failures = 0;
const check = (ok, label, detail = '') => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures++;
    console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

await page.goto(`file://${HOST}`, { waitUntil: 'networkidle' });
const frame = page.frames().find((f) => f !== page.mainFrame());
await frame.waitForSelector('canvas', { timeout: 40000 });
await page.waitForTimeout(12000);

check(await frame.evaluate(() => document.getElementById('nexus-boot')?.hidden), 'boot card clears');

const canvas = await frame.evaluate(() => {
  const c = document.querySelector('canvas');
  return c ? { w: c.width, h: c.height } : null;
});
check(canvas && canvas.w > 0, `canvas sized (${canvas?.w}x${canvas?.h})`);
check(Boolean((await frame.textContent('h1')).trim()), 'tour caption rendered');

// ---- Looking without pointer lock --------------------------------------
await frame.click('button:has-text("WALK THE CAMPUS")');
await page.waitForTimeout(3000);

const hud = (await frame.textContent('div:has-text("FREE ROAM")')).replace(/\s+/g, ' ');
check(hud.includes('Drag'), 'HUD offers drag-to-look when lock is refused', hud.slice(0, 80));

const yawOf = () => frame.evaluate(() => window.__nexus?.camera?.rotation?.y ?? null);
const yawBefore = await yawOf();
await page.mouse.move(500, 300);
await page.mouse.down();
for (let i = 0; i < 12; i++) {
  await page.mouse.move(500 + i * 18, 300);
  await page.waitForTimeout(60);
}
await page.mouse.up();
await page.waitForTimeout(2500);
const yawAfter = await yawOf();
check(
  yawBefore !== null && Math.abs(yawAfter - yawBefore) > 0.05,
  `drag turns the view (yaw ${yawBefore?.toFixed(2)} -> ${yawAfter?.toFixed(2)})`
);

// ---- Movement ----------------------------------------------------------
const posBefore = await frame.evaluate(() => window.__nexus?.position ?? null);
await frame.click('body');
await page.keyboard.down('KeyW');
await page.waitForTimeout(14000); // software frame rate; see scripts/verify.mjs
await page.keyboard.up('KeyW');
const posAfter = await frame.evaluate(() => window.__nexus?.position ?? null);
const moved =
  posBefore && posAfter
    ? Math.hypot(posAfter[0] - posBefore[0], posAfter[2] - posBefore[2])
    : 0;
check(moved > 0.4, `WASD moves the walker (${moved.toFixed(2)} m)`);

check(errors.length === 0, 'no page errors', errors.join(' | '));

await browser.close();
console.log(failures === 0 ? '\nArtifact bundle OK.' : `\n${failures} check(s) failed.`);
process.exitCode = failures === 0 ? 0 : 1;
