import { chromium } from 'playwright'
import fs from 'fs'

const OUT = process.env.SHOT_DIR || '/tmp/nexus-modes'
fs.mkdirSync(OUT, { recursive: true })
const BASE = process.argv[2] || 'http://127.0.0.1:4173/'
const TIER = process.argv[3] || 'B'

const browser = await chromium.launch({
  // Falls back to Playwright's own browser when CHROME_PATH isn't set.
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-sandbox',
  ],
})
const page = await browser.newPage({
  viewport: { width: 450, height: 800 },
  deviceScaleFactor: 2,
})

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

const shot = (n) => page.screenshot({ timeout: 180000, path: `${OUT}/${n}.png` })

await page.goto(`${BASE}?qa=1&tier=${TIER}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)
await page.waitForFunction(() => !!window.__nexusQA, null, { timeout: 15000 })

// ── 22s Stories cut ──
await page.evaluate(() => window.__nexusQA.start('short'))
await page.waitForTimeout(1200)
for (const t of [2.0, 5.5, 8.5, 11.5, 14.0, 16.5, 19.5, 22.4]) {
  await page.evaluate((tt) => window.__nexusQA.seek(tt), t)
  await page.waitForTimeout(700)
  await shot(`short-${String(t).padStart(5, '0')}`)
}

// ── Interactive mode ──
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await page.getByRole('button', { name: /explore interactively/i }).click()
await page.waitForTimeout(4500)
await shot('interactive-rest')

// Drag to orbit.
const box = await page.locator('.stage').boundingBox()
await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.45)
await page.mouse.down()
await page.mouse.move(box.x + box.width * 0.16, box.y + box.height * 0.4, { steps: 14 })
await page.waitForTimeout(900)
await shot('interactive-orbit')
await page.mouse.up()

// Run the workflow on demand.
await page.getByRole('button', { name: /run workflow/i }).click()
await page.waitForTimeout(4200)
await shot('interactive-workflow')

// Recording mode should leave an empty frame.
await page.getByRole('button', { name: /^record$/i }).click()
await page.waitForTimeout(6000)
await shot('interactive-recording')

console.log(
  'ERRORS:',
  errors.length ? JSON.stringify([...new Set(errors)].slice(0, 10), null, 1) : 'none',
)
await browser.close()
